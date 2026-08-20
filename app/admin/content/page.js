'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { FileText, Video, Trash2, Eye, User, BookMarked } from 'lucide-react';

export default function AdminContentPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [materials, setMaterials] = useState([]);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('materials');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [{ data: matData }, { data: vidData }] = await Promise.all([
        supabase.from('materials').select('*, subjects(name), profiles:teacher_id(full_name)').order('created_at', { ascending: false }),
        supabase.from('videos').select('*, subjects(name), profiles:teacher_id(full_name)').order('created_at', { ascending: false })
      ]);

      setMaterials(matData || []);
      setVideos(vidData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteMaterial = async (id) => {
    if (!confirm('Hapus materi ini secara permanen?')) return;
    const supabase = createClient();
    await supabase.from('materials').delete().eq('id', id);
    fetchData();
  };

  const handleDeleteVideo = async (id) => {
    if (!confirm('Hapus video ini secara permanen?')) return;
    const supabase = createClient();
    await supabase.from('videos').delete().eq('id', id);
    fetchData();
  };

  const filteredMaterials = materials.filter(m =>
    (m.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.subjects?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredVideos = videos.filter(v =>
    (v.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.subjects?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Monitoring Konten Pembelajaran Guru</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Pantau dan moderasi seluruh dokumen materi dan video pembelajaran yang di-upload guru
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: 8, background: '#F1F5F9', padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => setActiveTab('materials')}
            className={`btn btn-sm ${activeTab === 'materials' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ gap: 6 }}
          >
            <FileText size={15} /> Materi PDF & Dokumen ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`btn btn-sm ${activeTab === 'videos' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ gap: 6 }}
          >
            <Video size={15} /> Video Pembelajaran ({videos.length})
          </button>
        </div>
      </div>

      <div className="card card-padding" style={{ marginBottom: 20 }}>
        <div style={{ maxWidth: 360 }}>
          <SearchInput placeholder="Cari judul, mata pelajaran, atau guru..." value={search} onChange={setSearch} />
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 280, borderRadius: 16 }} />
      ) : activeTab === 'materials' ? (
        filteredMaterials.length === 0 ? (
          <EmptyState icon={FileText} title="Belum Ada Materi" description="Belum ada materi pembelajaran yang di-upload." />
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Judul Materi</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Mata Pelajaran</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Di-upload Oleh</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      📄 {m.title}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-primary" style={{ fontSize: 11 }}>
                        {m.subjects?.name || 'Umum'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      👨‍🏫 {m.profiles?.full_name || 'Guru'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteMaterial(m.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                        <Trash2 size={16} /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        filteredVideos.length === 0 ? (
          <EmptyState icon={Video} title="Belum Ada Video" description="Belum ada video pembelajaran yang di-upload." />
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Judul Video</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Mata Pelajaran</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Di-upload Oleh</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      🎬 {v.title}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-primary" style={{ fontSize: 11 }}>
                        {v.subjects?.name || 'Umum'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      👨‍🏫 {v.profiles?.full_name || 'Guru'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteVideo(v.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                        <Trash2 size={16} /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </DashboardLayout>
  );
}
