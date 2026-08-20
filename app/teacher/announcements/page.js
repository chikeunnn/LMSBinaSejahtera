'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, Plus, Trash2, Edit, AlertCircle, Calendar, Tag } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

export default function TeacherAnnouncementsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    class_id: '',
    priority: 'normal' // 'normal' | 'important' | 'urgent'
  });

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [{ data: annData }, { data: clsData }] = await Promise.all([
        supabase.from('announcements').select('*, classes(name)').order('created_at', { ascending: false }),
        supabase.from('classes').select('*').order('name', { ascending: true })
      ]);
      
      // Deduplicate classes by unique name so options don't duplicate
      const uniqueClasses = (clsData || []).filter((c, idx, self) =>
        idx === self.findIndex((t) => t.name === c.name)
      );
      uniqueClasses.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      setAnnouncements(annData || []);
      setClasses(uniqueClasses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingAnn(null);
    setForm({
      title: '',
      description: '',
      class_id: '',
      priority: 'normal'
    });
    setSaveError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (ann) => {
    setEditingAnn(ann);
    setForm({
      title: ann.title || '',
      description: ann.description || '',
      class_id: ann.class_id || '',
      priority: ann.priority || 'normal'
    });
    setSaveError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setSaveError('Judul dan isi pengumuman wajib diisi.');
      return;
    }
    setSaving(true);
    setSaveError('');
    const supabase = createClient();

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        class_id: form.class_id || null,
        priority: form.priority,
        teacher_id: profile.id
      };

      if (editingAnn) {
        let { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingAnn.id);

        // Fallback if 'priority' column doesn't exist in Supabase DB schema
        if (error && error.message.includes('priority')) {
          delete payload.priority;
          const { error: retryErr } = await supabase
            .from('announcements')
            .update(payload)
            .eq('id', editingAnn.id);
          if (retryErr) throw new Error(retryErr.message);
        } else if (error) {
          throw new Error(error.message);
        }
      } else {
        let { error } = await supabase
          .from('announcements')
          .insert(payload);

        // Fallback if 'priority' column doesn't exist in Supabase DB schema
        if (error && error.message.includes('priority')) {
          delete payload.priority;
          const { error: retryErr } = await supabase
            .from('announcements')
            .insert(payload);
          if (retryErr) throw new Error(retryErr.message);
        } else if (error) {
          throw new Error(error.message);
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setSaveError(err.message || 'Gagal menyimpan pengumuman.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    const supabase = createClient();
    await supabase.from('announcements').delete().eq('id', id);
    fetchData();
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Papan Pengumuman Sekolah</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Buat dan sebarkan pengumuman atau informasi penting untuk seluruh siswa
          </p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <Plus size={16} /> Buat Pengumuman Baru
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      ) : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="Belum Ada Pengumuman" description="Buat pengumuman pertama untuk menyampaikan kabar penting kepada siswa." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {announcements.map(ann => {
            const isUrgent = ann.priority === 'urgent';
            const isImportant = ann.priority === 'important';

            return (
              <div
                key={ann.id}
                className="card card-padding"
                style={{
                  borderLeft: isUrgent ? '4px solid #EF4444' : isImportant ? '4px solid #F59E0B' : '4px solid var(--primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      className={`badge ${isUrgent ? 'badge-error' : isImportant ? 'badge-warning' : 'badge-primary'}`}
                      style={{ fontSize: 11 }}
                    >
                      {isUrgent ? '🔴 MENDESAK' : isImportant ? '🟡 PENTING' : '🔵 INFORMASI'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} /> {formatDateShort(ann.created_at)}
                    </span>
                    {ann.classes?.name && (
                      <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                        🏫 {ann.classes.name}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleOpenEditModal(ann)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                      <Edit size={14} /> Edit
                    </button>
                    <button onClick={() => handleDelete(ann.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                      <Trash2 size={16} /> Hapus
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{ann.title}</h3>
                
                <div style={{
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: 'var(--bg-main)',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)'
                }}>
                  {ann.description}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Announcement */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAnn ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {saveError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'var(--error-light)', borderRadius: 8, border: '1px solid #FECACA' }}>
              <AlertCircle size={16} color="var(--error)" />
              <span style={{ fontSize: 13, color: 'var(--error)' }}>{saveError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="ann_title">Judul Pengumuman</label>
            <input
              id="ann_title"
              type="text"
              required
              className="form-input"
              placeholder="Contoh: Jadwal Ujian Akhir Semester Genap"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ann_desc">Isi Pengumuman</label>
            <textarea
              id="ann_desc"
              rows={5}
              required
              className="form-input"
              placeholder="Ketik isi pesan atau pengumuman lengkap di sini..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ann_class">Target Kelas (Opsional)</label>
              <select
                id="ann_class"
                className="form-input"
                value={form.class_id}
                onChange={e => setForm({ ...form, class_id: e.target.value })}
              >
                <option value="">Semua Kelas & Siswa</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ann_priority">Tingkat Prioritas</label>
              <select
                id="ann_priority"
                className="form-input"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
              >
                <option value="normal">🔵 Informasi Normal</option>
                <option value="important">🟡 Penting</option>
                <option value="urgent">🔴 Mendesak (Urgent)</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyimpan...' : editingAnn ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
