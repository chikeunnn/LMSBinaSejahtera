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
import { Users, UserPlus, Edit, Trash2, BookMarked, FileText, HelpCircle, Video, CheckCircle2, Search } from 'lucide-react';

export default function AdminTeachersPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: '',
    full_name: '',
    is_active: true,
    assigned_subject_ids: []
  });

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [
        { data: profData },
        { data: subjData },
        { data: matData },
        { data: vidData },
        { data: quizData }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'teacher').order('full_name', { ascending: true }),
        supabase.from('subjects').select('*, profiles(full_name)'),
        supabase.from('materials').select('id, teacher_id, subject_id'),
        supabase.from('videos').select('id, teacher_id, subject_id'),
        supabase.from('quizzes').select('id, teacher_id, subject_id'),
      ]);

      const allSubj = subjData || [];
      const allMats = matData || [];
      const allVids = vidData || [];
      const allQuizzes = quizData || [];

      // Combine teacher stats with subjects taught
      const teacherList = (profData || []).map(t => {
        // Find subjects where teacher_id matches OR created_by matches
        const taughtSubjects = allSubj.filter(s => s.teacher_id === t.id || s.created_by === t.id);
        const myMats = allMats.filter(m => m.teacher_id === t.id);
        const myVids = allVids.filter(v => v.teacher_id === t.id);
        const myQuizzes = allQuizzes.filter(q => q.teacher_id === t.id);

        return {
          ...t,
          subjectsTaught: taughtSubjects,
          materialCount: myMats.length,
          videoCount: myVids.length,
          quizCount: myQuizzes.length
        };
      });

      setTeachers(teacherList);
      setSubjects(allSubj);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (t = null) => {
    if (t) {
      setEditingTeacher(t);
      setForm({
        email: t.email || '',
        full_name: t.full_name || '',
        is_active: t.is_active !== false,
        assigned_subject_ids: (t.subjectsTaught || []).map(s => s.id)
      });
    } else {
      setEditingTeacher(null);
      setForm({
        email: '',
        full_name: '',
        is_active: true,
        assigned_subject_ids: []
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
      let teacherId = editingTeacher?.id;
      if (editingTeacher) {
        await supabase.from('profiles').update({
          full_name: form.full_name.trim(),
          is_active: form.is_active,
          updated_at: new Date().toISOString()
        }).eq('id', editingTeacher.id);
      } else {
        teacherId = crypto.randomUUID ? crypto.randomUUID() : `tch-${Date.now()}`;
        await supabase.from('profiles').insert({
          id: teacherId,
          email: form.email.trim().toLowerCase(),
          full_name: form.full_name.trim(),
          role: 'teacher',
          is_active: form.is_active,
          created_at: new Date().toISOString()
        });
      }

      // Update teacher_id assignment in subjects
      if (form.assigned_subject_ids.length > 0 && teacherId) {
        for (const sId of form.assigned_subject_ids) {
          await supabase.from('subjects').update({ teacher_id: teacherId }).eq('id', sId);
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (t) => {
    const supabase = createClient();
    await supabase.from('profiles').update({ is_active: !t.is_active }).eq('id', t.id);
    fetchData();
  };

  const handleDelete = async (t) => {
    if (!confirm(`Hapus data guru ${t.full_name}?`)) return;
    const supabase = createClient();
    await supabase.from('profiles').delete().eq('id', t.id);
    fetchData();
  };

  const filteredTeachers = teachers.filter(t =>
    (t.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Manajemen Guru & Mata Pelajaran Diampu</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Kelola data tenaga pengajar serta tinjau mata pelajaran yang dimasukkan oleh masing-masing guru
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <UserPlus size={16} /> Tambah Akun Guru
        </button>
      </div>

      <div className="card card-padding" style={{ marginBottom: 20 }}>
        <div style={{ maxWidth: 360 }}>
          <SearchInput placeholder="Cari nama guru atau email..." value={search} onChange={setSearch} />
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
      ) : filteredTeachers.length === 0 ? (
        <EmptyState icon={Users} title="Data Guru Tidak Ditemukan" description="Belum ada guru yang terdaftar." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {filteredTeachers.map(t => {
            const isActive = t.is_active !== false;
            return (
              <div key={t.id} className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={t.full_name || t.email} src={t.avatar_url} size={46} />
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{t.full_name || 'Tanpa Nama'}</h3>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.email}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(t)}
                      style={{
                        background: isActive ? '#F0FDF4' : '#FEF2F2',
                        border: `1px solid ${isActive ? '#BBF7D0' : '#FECACA'}`,
                        color: isActive ? '#16A34A' : '#DC2626',
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isActive ? 'Aktif' : 'Non-aktif'}
                    </button>
                  </div>

                  {/* Taught Subjects */}
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 14, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookMarked size={14} color="var(--primary)" /> Mata Pelajaran Diampu:
                    </div>
                    {t.subjectsTaught.length === 0 ? (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', italic: 'true' }}>Belum ada mata pelajaran terkait</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {t.subjectsTaught.map(s => (
                          <span key={s.id} className="badge badge-primary" style={{ fontSize: 11 }}>
                            📘 {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content Upload Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center', background: '#FFFFFF', padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#2563EB' }}>{t.materialCount}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Materi</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#7C3AED' }}>{t.videoCount}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Video</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>{t.quizCount}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Kuis</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 16 }}>
                  <button onClick={() => handleOpenModal(t)} className="btn btn-secondary btn-sm" style={{ flex: 1, gap: 4 }}>
                    <Edit size={14} /> Edit & Map Mapel
                  </button>
                  <button onClick={() => handleDelete(t)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Map Subject Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingTeacher ? `Edit Guru: ${editingTeacher.full_name}` : 'Tambah Guru Baru'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!editingTeacher && (
            <div className="form-group">
              <label className="form-label" htmlFor="tch_email">Alamat Email Guru *</label>
              <input id="tch_email" type="email" required className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contoh: guru@binasejahtera.sch.id" />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="tch_name">Nama Lengkap Guru *</label>
            <input id="tch_name" type="text" required className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Nama lengkap beserta gelar" />
          </div>

          <div className="form-group">
            <label className="form-label">Tugaskan Mata Pelajaran ke Guru Ini</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}>
              {subjects.map(s => {
                const isChecked = form.assigned_subject_ids.includes(s.id);
                return (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm({ ...form, assigned_subject_ids: [...form.assigned_subject_ids, s.id] });
                        } else {
                          setForm({ ...form, assigned_subject_ids: form.assigned_subject_ids.filter(id => id !== s.id) });
                        }
                      }}
                    />
                    <span>📘 {s.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyimpan...' : 'Simpan Data Guru'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
