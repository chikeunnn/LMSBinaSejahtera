'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, Plus, Trash2, Calendar, User } from 'lucide-react';

export default function AdminAnnouncementsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    target_role: 'all'
  });

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data } = await supabase.from('announcements').select('*, profiles(full_name)').order('created_at', { ascending: false });
      setAnnouncements(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = () => {
    setForm({ title: '', content: '', target_role: 'all' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const supabase = createClient();

    try {
      await supabase.from('announcements').insert({
        title: form.title.trim(),
        content: form.content.trim(),
        target_role: form.target_role,
        author_id: profile?.id || null,
        created_at: new Date().toISOString()
      });

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
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
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Manajemen Pengumuman Sekolah</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Buat dan sebarkan pengumuman ke seluruh portal guru dan siswa
          </p>
        </div>
        <button onClick={handleOpenModal} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <Plus size={16} /> Buat Pengumuman Baru
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
      ) : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="Belum Ada Pengumuman" description="Buat pengumuman pertama Anda untuk dibagikan ke siswa dan guru." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {announcements.map(a => (
            <div key={a.id} className="card card-padding" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span className="badge badge-primary" style={{ fontSize: 11 }}>
                    📢 Target: {a.target_role === 'all' ? 'Semua (Guru & Siswa)' : a.target_role}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{a.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{a.content}</p>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={13} /> Oleh: {a.profiles?.full_name || 'Admin'}
                </div>
              </div>

              <button onClick={() => handleDelete(a.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Announcement */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Buat Pengumuman Sekolah Baru">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="anc_title">Judul Pengumuman *</label>
            <input id="anc_title" type="text" required className="form-input" placeholder="Judul pengumuman singkat" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="anc_target">Target Penerima *</label>
            <select id="anc_target" className="form-input" value={form.target_role} onChange={e => setForm({ ...form, target_role: e.target.value })}>
              <option value="all">Semua Pengguna (Guru & Siswa)</option>
              <option value="student">Hanya Siswa</option>
              <option value="teacher">Hanya Guru</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="anc_content">Isi Pengumuman *</label>
            <textarea id="anc_content" rows={5} required className="form-input" placeholder="Tuliskan pengumuman secara lengkap..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyiarkan...' : 'Siarkan Pengumuman'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
