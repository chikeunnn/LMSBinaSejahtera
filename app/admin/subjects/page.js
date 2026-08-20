'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { BookMarked, Plus, Edit, Trash2, User, Search } from 'lucide-react';

export default function AdminSubjectsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    teacher_id: ''
  });

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [{ data: subjData }, { data: tData }] = await Promise.all([
        supabase.from('subjects').select('*, profiles:teacher_id(full_name, email)').order('name', { ascending: true }),
        supabase.from('profiles').select('id, full_name, email').eq('role', 'teacher').order('full_name', { ascending: true })
      ]);

      setSubjects(subjData || []);
      setTeachers(tData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (s = null) => {
    if (s) {
      setEditingSubject(s);
      setForm({
        name: s.name || '',
        code: s.code || '',
        description: s.description || '',
        teacher_id: s.teacher_id || ''
      });
    } else {
      setEditingSubject(null);
      setForm({
        name: '',
        code: '',
        description: '',
        teacher_id: teachers[0]?.id || ''
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const supabase = createClient();

    try {
      if (editingSubject) {
        await supabase.from('subjects').update({
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim(),
          teacher_id: form.teacher_id || null,
          updated_at: new Date().toISOString()
        }).eq('id', editingSubject.id);
      } else {
        await supabase.from('subjects').insert({
          name: form.name.trim(),
          code: form.code.trim() || form.name.substring(0, 3).toUpperCase(),
          description: form.description.trim(),
          teacher_id: form.teacher_id || null,
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

  const handleDelete = async (id) => {
    if (!confirm('Hapus mata pelajaran ini?')) return;
    const supabase = createClient();
    await supabase.from('subjects').delete().eq('id', id);
    fetchData();
  };

  const filteredSubjects = subjects.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Manajemen Mata Pelajaran & Pengampu Guru</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Tinjau mata pelajaran serta guru yang ditugaskan atau memasukkan kurikulum tersebut
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <Plus size={16} /> Tambah Mata Pelajaran
        </button>
      </div>

      <div className="card card-padding" style={{ marginBottom: 20 }}>
        <div style={{ maxWidth: 360 }}>
          <SearchInput placeholder="Cari nama mata pelajaran atau nama guru..." value={search} onChange={setSearch} />
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
      ) : filteredSubjects.length === 0 ? (
        <EmptyState icon={BookMarked} title="Tidak Ada Mata Pelajaran" description="Belum ada mata pelajaran yang dibuat." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {filteredSubjects.map(s => {
            const teacherName = s.profiles?.full_name || 'Belum Ditugaskan';
            return (
              <div key={s.id} className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span className="badge badge-primary" style={{ fontSize: 11, fontWeight: 700 }}>
                      KODE: {s.code || 'MAPEL'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{s.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, minHeight: 38 }}>
                    {s.description || 'Tidak ada deskripsi mata pelajaran.'}
                  </p>

                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Guru Pengampu</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{teacherName}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 16 }}>
                  <button onClick={() => handleOpenModal(s)} className="btn btn-secondary btn-sm" style={{ flex: 1, gap: 4 }}>
                    <Edit size={14} /> Edit & Assign Guru
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Subject */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="sb_name">Nama Mata Pelajaran *</label>
            <input id="sb_name" type="text" required className="form-input" placeholder="Contoh: Matematika, Bahasa Indonesia" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sb_code">Kode Mapel</label>
            <input id="sb_code" type="text" className="form-input" placeholder="Contoh: MTK, BIN" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sb_teacher">Guru Pengampu</label>
            <select id="sb_teacher" className="form-input" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
              <option value="">-- Pilih Guru Pengampu --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sb_desc">Deskripsi Ringkas</label>
            <textarea id="sb_desc" rows={3} className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Penjelasan singkat mata pelajaran" />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyimpan...' : 'Simpan Mata Pelajaran'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
