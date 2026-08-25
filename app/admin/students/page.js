'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { GraduationCap, UserPlus, Edit, Trash2, Users, AlertCircle, Filter } from 'lucide-react';

function getStudentClassInfo(student, classesList = []) {
  if (!student) return { name: 'Belum Ada Kelas', grade: null };

  if (student.classes && student.classes.name) {
    const clsName = student.classes.name;
    const grade = student.classes.grade || extractGradeNum(clsName);
    return { name: clsName, grade };
  }

  if (student.class_id) {
    const found = classesList.find(c =>
      String(c.id) === String(student.class_id) ||
      String(c.name).toLowerCase() === String(student.class_id).toLowerCase() ||
      String(c.code).toLowerCase() === String(student.class_id).toLowerCase()
    );

    if (found) {
      const grade = found.grade || extractGradeNum(found.name);
      return { name: found.name, grade };
    }

    const g = extractGradeNum(student.class_id);
    if (g) return { name: `Kelas ${g}`, grade: g };

    return { name: String(student.class_id), grade: extractGradeNum(student.class_id) };
  }

  if (student.class_name) {
    const g = extractGradeNum(student.class_name);
    return { name: student.class_name, grade: g };
  }

  return { name: 'Belum Ada Kelas', grade: null };
}

function extractGradeNum(str) {
  if (!str) return null;
  const s = String(str);
  if (s.includes('7')) return 7;
  if (s.includes('8')) return 8;
  if (s.includes('9')) return 9;
  return null;
}

export default function AdminStudentsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: '',
    full_name: '',
    class_id: '',
    is_active: true
  });

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [{ data: profData }, { data: clsData }] = await Promise.all([
        supabase.from('profiles').select('*, classes(id, name, grade)').eq('role', 'student').order('full_name', { ascending: true }),
        supabase.from('classes').select('*').order('name', { ascending: true })
      ]);

      const uniqueClassesMap = new Map();
      (clsData || []).forEach(c => {
        const cleanName = c.name?.trim();
        if (cleanName && !uniqueClassesMap.has(cleanName)) {
          uniqueClassesMap.set(cleanName, c);
        }
      });

      setStudents(profData || []);
      setClasses(Array.from(uniqueClassesMap.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const countGrade = (gradeNum) => students.filter(s => getStudentClassInfo(s, classes).grade === gradeNum).length;
  const countUnassigned = students.filter(s => getStudentClassInfo(s, classes).grade === null).length;

  const handleOpenModal = (s = null) => {
    if (s) {
      setEditingStudent(s);
      setForm({
        email: s.email || '',
        full_name: s.full_name || '',
        class_id: s.class_id || '',
        is_active: s.is_active !== false
      });
    } else {
      setEditingStudent(null);
      setForm({
        email: '',
        full_name: '',
        class_id: classes[0]?.id || '',
        is_active: true
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setSaving(true);
    const supabase = createClient();

    try {
      if (editingStudent) {
        await supabase.from('profiles').update({
          full_name: form.full_name.trim(),
          class_id: form.class_id || null,
          is_active: form.is_active,
          updated_at: new Date().toISOString()
        }).eq('id', editingStudent.id);
      } else {
        const stdId = crypto.randomUUID ? crypto.randomUUID() : `std-${Date.now()}`;
        await supabase.from('profiles').insert({
          id: stdId,
          email: form.email.trim().toLowerCase(),
          full_name: form.full_name.trim(),
          role: 'student',
          class_id: form.class_id || null,
          is_active: form.is_active,
          created_at: new Date().toISOString()
        });
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (s) => {
    const supabase = createClient();
    await supabase.from('profiles').update({ is_active: !s.is_active }).eq('id', s.id);
    fetchData();
  };

  const handleDelete = async (s) => {
    if (!confirm(`Hapus akun siswa ${s.full_name}?`)) return;
    const supabase = createClient();
    await supabase.from('profiles').delete().eq('id', s.id);
    fetchData();
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (s.email || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedClass === 'ALL') return true;
    if (selectedClass === 'UNASSIGNED') return getStudentClassInfo(s, classes).grade === null;
    if (['7', '8', '9'].includes(selectedClass)) {
      return getStudentClassInfo(s, classes).grade === parseInt(selectedClass);
    }

    return String(s.class_id) === String(selectedClass);
  });

  const [assigning, setAssigning] = useState(false);

  async function handleAutoAssign() {
    const supabase = createClient();
    setAssigning(true);
    try {
      let activeClasses = classes;
      if (!activeClasses || activeClasses.length === 0) {
        const { data: created } = await supabase.from('classes').insert([
          { name: 'Kelas 7A', grade: 7, code: 'K7A' },
          { name: 'Kelas 8A', grade: 8, code: 'K8A' },
          { name: 'Kelas 9A', grade: 9, code: 'K9A' }
        ]).select();
        activeClasses = created || [];
      }

      const unassignedStudents = students.filter(s => getStudentClassInfo(s, activeClasses).grade === null);
      if (unassignedStudents.length === 0) {
        alert('Semua siswa sudah terbagi ke dalam kelas!');
        return;
      }

      for (let i = 0; i < unassignedStudents.length; i++) {
        const s = unassignedStudents[i];
        const targetClass = activeClasses[i % activeClasses.length];
        await supabase.from('profiles').update({
          class_id: targetClass.id,
          updated_at: new Date().toISOString()
        }).eq('id', s.id);
      }

      await fetchData();
      alert(`Berhasil membagikan ${unassignedStudents.length} siswa secara merata ke dalam Kelas 7, Kelas 8, dan Kelas 9!`);
    } catch (e) {
      console.error(e);
      alert('Gagal membagikan kelas secara otomatis.');
    } finally {
      setAssigning(false);
    }
  }

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Manajemen Siswa & Pemetaan Kelas</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Kelola data siswa terdaftar dan pembagian kelas di sekolah (Admin Control)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {countUnassigned > 0 && (
            <button
              onClick={handleAutoAssign}
              disabled={assigning}
              className="btn btn-outline btn-sm"
              style={{ gap: 6 }}
            >
              ✨ {assigning ? 'Membagikan Kelas...' : `Bagi ${countUnassigned} Siswa ke Kelas 7, 8, 9`}
            </button>
          )}
          <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
            <UserPlus size={16} /> Tambah Akun Siswa
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{students.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Siswa</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{countGrade(7)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Siswa Kelas 7</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{countGrade(8)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Siswa Kelas 8</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{countGrade(9)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Siswa Kelas 9</div>
          </div>
        </div>

        <div className="card card-padding" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{countUnassigned}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Belum Masuk Kelas</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card card-padding" style={{ marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchInput placeholder="Cari nama siswa atau email..." value={search} onChange={setSearch} />
        </div>

        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 180 }}
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
        >
          <option value="ALL">Semua Kelas</option>
          <option value="7">Siswa Kelas 7</option>
          <option value="8">Siswa Kelas 8</option>
          <option value="9">Siswa Kelas 9</option>
          <option value="UNASSIGNED">Belum Masuk Kelas</option>
          {classes.length > 0 && <option disabled>── Rombel Khusus ──</option>}
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Data Siswa Tidak Ditemukan" description="Belum ada siswa terdaftar pada kelas yang dipilih." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Siswa</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Kelas Assigned</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status Akun</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => {
                  const isActive = s.is_active !== false;
                  const classInfo = getStudentClassInfo(s, classes);
                  const isAssigned = classInfo.grade !== null || classInfo.name !== 'Belum Ada Kelas';

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar name={s.full_name || s.email} src={s.avatar_url} size={38} />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.full_name || 'Tanpa Nama'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: 12,
                            background: isAssigned ? '#EFF6FF' : '#FEF2F2',
                            color: isAssigned ? '#2563EB' : '#DC2626',
                            fontWeight: 700
                          }}
                        >
                          🏫 {classInfo.name}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => handleToggleStatus(s)}
                          style={{
                            background: isActive ? '#F0FDF4' : '#FEF2F2',
                            border: `1px solid ${isActive ? '#BBF7D0' : '#FECACA'}`,
                            color: isActive ? '#16A34A' : '#DC2626',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isActive ? 'Aktif' : 'Non-aktif'}
                        </button>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenModal(s)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => handleDelete(s)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingStudent ? `Edit Siswa: ${editingStudent.full_name}` : 'Tambah Siswa Baru'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!editingStudent && (
            <div className="form-group">
              <label className="form-label" htmlFor="std_email">Email Siswa *</label>
              <input id="std_email" type="email" required className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contoh: siswa@binasejahtera.sch.id" />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="std_name">Nama Lengkap Siswa *</label>
            <input id="std_name" type="text" required className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Nama lengkap siswa" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="std_class">Pilih Kelas *</label>
            <select id="std_class" className="form-input" value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
              <option value="">-- Tanpa Kelas --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyimpan...' : 'Simpan Data Siswa'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
