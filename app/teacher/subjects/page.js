'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { BookMarked, Plus, Edit, Trash2, GraduationCap, Hash, Filter } from 'lucide-react';

const STANDARD_SUBJECTS_BY_GRADE = {
  '7': [
    'Matematika',
    'Al Jabar',
    'Bilangan & Pecahan',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Ilmu Pengetahuan Alam (IPA)',
    'Ilmu Pengetahuan Sosial (IPS)',
    'Pendidikan Agama Islam (PAI)',
    'Pendidikan Pancasila (PPKn)',
    'Informatika',
    'Seni Budaya',
    'PJOK'
  ],
  '8': [
    'Matematika',
    'Al Jabar & Persamaan Linear',
    'Teorema Pythagoras',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Ilmu Pengetahuan Alam (IPA)',
    'Ilmu Pengetahuan Sosial (IPS)',
    'Pendidikan Agama Islam (PAI)',
    'Pendidikan Pancasila (PPKn)',
    'Informatika',
    'Seni Budaya',
    'PJOK'
  ],
  '9': [
    'Matematika',
    'Persamaan Kuadrat',
    'Bangun Ruang Sisi Lengkung',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Ilmu Pengetahuan Alam (IPA)',
    'Ilmu Pengetahuan Sosial (IPS)',
    'Pendidikan Agama Islam (PAI)',
    'Pendidikan Pancasila (PPKn)',
    'Informatika',
    'Seni Budaya',
    'PJOK'
  ]
};

const generateCode = (name, className) => {
  if (!name) return '';
  const cleanName = name.trim();

  const CUSTOM_MAPPINGS = [
    { pattern: /al\s*jabar/i, code: 'AJB' },
    { pattern: /pecahan/i, code: 'PCH' },
    { pattern: /bilangan/i, code: 'BLG' },
    { pattern: /pythagoras/i, code: 'PYT' },
    { pattern: /persamaan/i, code: 'PSM' },
    { pattern: /geometri/i, code: 'GEO' },
    { pattern: /matematika/i, code: 'MTK' },
    { pattern: /bahasa\s+indonesia/i, code: 'BIN' },
    { pattern: /bahasa\s+inggris/i, code: 'BIG' },
    { pattern: /ilmu\s+pengetahuan\s+alam|ipa/i, code: 'IPA' },
    { pattern: /ilmu\s+pengetahuan\s+sosial|ips/i, code: 'IPS' },
    { pattern: /pendidikan\s+agama|pai/i, code: 'PAI' },
    { pattern: /pancasila|ppkn|pkn/i, code: 'PKN' },
    { pattern: /informatika|komputer/i, code: 'INF' },
    { pattern: /seni\s+budaya/i, code: 'SBD' },
    { pattern: /pjok|jasmani/i, code: 'PJK' },
    { pattern: /prakarya/i, code: 'PRK' },
  ];

  let prefix = '';
  for (const item of CUSTOM_MAPPINGS) {
    if (item.pattern.test(cleanName)) {
      prefix = item.code;
      break;
    }
  }

  if (!prefix) {
    const words = cleanName.split(/\s+/);
    if (words.length === 1) {
      prefix = words[0].substring(0, 3).toUpperCase();
    } else {
      prefix = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
    }
  }

  let classTag = '7A';
  if (className) {
    const match = className.match(/\d+[A-Za-z]?/);
    if (match) {
      classTag = match[0].toUpperCase();
    } else {
      classTag = className.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
  }

  return `${prefix}-${classTag}`;
};

export default function TeacherSubjectsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState({ name: '', class_id: '', code: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      // Fetch subjects (teacher specific + general subjects + fallback)
      let { data: subData } = await supabase
        .from('subjects')
        .select('*, classes(name, grade)')
        .or(`teacher_id.eq.${profile.id},teacher_id.is.null`);

      if (!subData || subData.length === 0) {
        const { data: allSubData } = await supabase
          .from('subjects')
          .select('*, classes(name, grade)');
        subData = allSubData || [];
      }

      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });

      let currentClasses = classData || [];

      // Deduplicate classes by name to fix database duplicates
      const uniqueClasses = [];
      const seen = new Set();
      currentClasses.forEach(c => {
        if (!seen.has(c.name)) {
          seen.add(c.name);
          uniqueClasses.push(c);
        }
      });

      // Sort naturally (Kelas 7A, 7B, 8A, 8B, 9A, 9B)
      uniqueClasses.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      setSubjects(subData || []);
      setClasses(uniqueClasses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (sub = null) => {
    if (sub) {
      setEditingSubject(sub);
      let matchedClass = classes.find(c => String(c.id) === String(sub.class_id));
      if (!matchedClass && sub.classes?.name) {
        matchedClass = classes.find(c => c.name === sub.classes.name);
      }

      setForm({
        name: sub.name || '',
        class_id: matchedClass ? matchedClass.id : '',
        code: sub.code || '',
        description: sub.description || ''
      });
    } else {
      setEditingSubject(null);
      const defaultClass = classes[0];
      const autoCode = generateCode('', defaultClass?.name);
      setForm({
        name: '',
        class_id: defaultClass?.id || '',
        code: autoCode,
        description: ''
      });
    }
    setModalOpen(true);
  };

  const handleNameChange = (val) => {
    const selectedClass = classes.find(c => String(c.id) === String(form.class_id));
    const autoCode = generateCode(val, selectedClass?.name);
    setForm(prev => ({
      ...prev,
      name: val,
      code: autoCode
    }));
  };

  const handleClassChange = (classId) => {
    const selectedClass = classes.find(c => String(c.id) === String(classId));
    const autoCode = generateCode(form.name, selectedClass?.name);
    setForm(prev => ({
      ...prev,
      class_id: classId,
      code: autoCode || prev.code
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.class_id) {
      alert('Harap isi Nama Mata Pelajaran dan Pilih Kelas Target!');
      return;
    }
    setSaving(true);
    const supabase = createClient();

    try {
      const selectedClass = classes.find(c => String(c.id) === String(form.class_id));
      const finalCode = form.code || generateCode(form.name, selectedClass?.name);

      let payload = {
        name: form.name,
        class_id: form.class_id,
        code: finalCode,
        description: form.description,
        updated_at: new Date().toISOString()
      };

      if (editingSubject) {
        let { error } = await supabase.from('subjects').update(payload).eq('id', editingSubject.id);
        if (error && (error.message?.includes('code') || error.code === 'PGRST204')) {
          delete payload.code;
          const retry = await supabase.from('subjects').update(payload).eq('id', editingSubject.id);
          if (retry.error) throw retry.error;
        } else if (error) {
          throw error;
        }
      } else {
        let { error } = await supabase.from('subjects').insert({
          ...payload,
          teacher_id: profile.id,
          status: 'active'
        });
        if (error && (error.message?.includes('code') || error.code === 'PGRST204')) {
          delete payload.code;
          const retry = await supabase.from('subjects').insert({
            ...payload,
            teacher_id: profile.id,
            status: 'active'
          });
          if (retry.error) throw retry.error;
        } else if (error) {
          throw error;
        }
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(`Gagal menyimpan: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) return;
    const supabase = createClient();
    await supabase.from('subjects').delete().eq('id', id);
    fetchData();
  };

  const filteredSubjects = subjects.filter(s => {
    const className = s.classes?.name || '';
    const classGrade = String(s.classes?.grade || '');

    // Filter by grade tab
    if (selectedGradeFilter !== 'ALL') {
      const matchGrade = className.includes(`Kelas ${selectedGradeFilter}`) || className.includes(selectedGradeFilter) || classGrade === selectedGradeFilter;
      if (!matchGrade) return false;
    }

    // Filter by specific sub-class dropdown
    if (selectedClassFilter !== 'ALL') {
      if (String(s.class_id) !== String(selectedClassFilter)) return false;
    }

    return true;
  });

  const dropdownClasses = selectedGradeFilter === 'ALL'
    ? classes
    : classes.filter(c => c.name?.includes(selectedGradeFilter) || String(c.grade) === selectedGradeFilter);

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Kelola Mata Pelajaran</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Atur dan kategorikan mata pelajaran sesuai tingkatan kelas siswa
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <Plus size={16} /> Tambah Pelajaran Baru
        </button>
      </div>

      {/* Ringkas Filter Tabs (Grade Level + Dropdown Sub-Kelas) */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20, background: '#F8FAFC', padding: '10px 14px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={15} /> Filter Tingkatan:
        </div>

        {/* Grade Pills */}
        <div style={{ display: 'flex', gap: 4, background: '#E2E8F0', padding: 3, borderRadius: 10 }}>
          {['ALL', '7', '8', '9'].map(grade => {
            const label = grade === 'ALL' ? 'Semua Kelas' : `Kelas ${grade}`;
            const isActive = selectedGradeFilter === grade;
            return (
              <button
                key={grade}
                type="button"
                onClick={() => {
                  setSelectedGradeFilter(grade);
                  setSelectedClassFilter('ALL');
                }}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: isActive ? 'white' : 'transparent',
                  color: isActive ? 'var(--primary)' : '#475569',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Specific Class Dropdown */}
        <div style={{ marginLeft: 'auto', minWidth: 170 }}>
          <select
            value={selectedClassFilter}
            onChange={e => setSelectedClassFilter(e.target.value)}
            className="form-input"
            style={{ padding: '6px 12px', fontSize: 13, borderRadius: 8, background: 'white' }}
          >
            <option value="ALL">Semua Sub-Kelas ({dropdownClasses.length})</option>
            {dropdownClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="Belum ada mata pelajaran"
          description={selectedClassFilter === 'ALL' ? 'Klik tombol di atas untuk menambah mata pelajaran baru.' : 'Belum ada mata pelajaran untuk kelas ini.'}
        />
      ) : (
        <div className="grid grid-3">
          {filteredSubjects.map(s => (
            <div key={s.id} className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE',
                    padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700
                  }}>
                    <GraduationCap size={13} /> {s.classes?.name || 'Tanpa Kelas'}
                  </span>
                  {s.code && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1',
                      padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700
                    }}>
                      <Hash size={13} /> {s.code}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {s.name}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                  {s.description || 'Tidak ada deskripsi.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <button onClick={() => handleOpenModal(s)} className="btn btn-secondary btn-sm" style={{ flex: 1, gap: 4 }}>
                  <Edit size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(s.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', padding: '6px 10px' }} title="Hapus">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subject Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="class_id">Target Kelas <span style={{ color: 'var(--error)' }}>*</span></label>
            <select
              id="class_id"
              required
              className="form-input"
              value={form.class_id}
              onChange={e => handleClassChange(e.target.value)}
            >
              <option value="">-- Pilih Tingkatan Kelas --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Quick preset selector for standard subjects */}
          {(() => {
            const selObj = classes.find(c => String(c.id) === String(form.class_id));
            const gMatch = selObj?.name?.match(/\d+/);
            const gKey = gMatch ? gMatch[0] : '7';
            const presets = STANDARD_SUBJECTS_BY_GRADE[gKey] || STANDARD_SUBJECTS_BY_GRADE['7'];

            return (
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Pilih dari Kurikulum Standar (Kelas {gKey})</span>
                  <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>Otomatis Isi</span>
                </label>
                <select
                  className="form-input"
                  style={{ background: '#F8FAFC', color: '#1E293B', fontWeight: 600, borderColor: '#CBD5E1' }}
                  onChange={e => {
                    if (e.target.value) {
                      handleNameChange(e.target.value);
                    }
                  }}
                  value={presets.includes(form.name) ? form.name : ''}
                >
                  <option value="">-- Pilih Pelajaran Standar Kelas {gKey} --</option>
                  {presets.map((subj, idx) => (
                    <option key={idx} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>
            );
          })()}

          <div className="form-group">
            <label className="form-label" htmlFor="name">Nama Mata Pelajaran / Bab <span style={{ color: 'var(--error)' }}>*</span></label>
            <input
              id="name"
              type="text"
              required
              className="form-input"
              placeholder="Contoh: Matematika, Al Jabar, Pecahan"
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="code">Kode Unik Mata Pelajaran</label>
            <input
              id="code"
              type="text"
              className="form-input"
              placeholder="Contoh: AJB-7A, MTK-8A"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
              Kode unik otomatis dibuat berdasarkan nama & kelas (Contoh: Al Jabar + Kelas 7A = <strong>AJB-7A</strong>).
            </span>
          </div>

          <div style={{
            background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 'var(--radius-md)',
            padding: '10px 14px', fontSize: 12, color: '#0369A1', lineHeight: 1.5
          }}>
            <strong>💡 Panduan Kategorisasi Topik/Bab:</strong><br />
            Untuk memisahkan materi seperti <em>Al Jabar</em>, <em>Pecahan</em>, atau <em>Geometri</em> di dalam subjek Matematika, Anda dapat mendaftarkannya sebagai nama pelajaran spesifik atau mengelompokkan materi per Bab saat mengunggah modul.
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Deskripsi Pelajaran</label>
            <textarea
              id="description"
              rows={3}
              className="form-input"
              placeholder="Deskripsi singkat materi pelajaran..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">Batal</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan Pelajaran'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
