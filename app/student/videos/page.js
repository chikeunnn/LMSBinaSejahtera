'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { debounce, openOrDownloadFile } from '@/lib/utils';
import { Video, PlayCircle, ExternalLink, Search, Clock, Maximize2, CheckCircle2, Play } from 'lucide-react';

export default function StudentVideosPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [videos, setVideos] = useState([]);
  const [videoProgressMap, setVideoProgressMap] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);
  const searchRef = useRef(debounce((val) => setSearch(val), 300));

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [{ data: vidData }, { data: vProgData }] = await Promise.all([
        supabase.from('videos').select('*, subjects(name)').order('created_at', { ascending: false }),
        supabase.from('video_progress').select('*').eq('student_id', profile.id)
      ]);

      let finalData = vidData || [];
      if (finalData.length === 0) {
        const { data: rawData } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
        finalData = rawData || [];
      }

      setVideos(finalData);

      const vMap = {};
      (vProgData || []).forEach(p => {
        if (p.is_completed || p.progress_percentage === 100) {
          vMap[p.video_id] = true;
        }
      });
      setVideoProgressMap(vMap);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const getEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return url;
  };

  const isDirectVideo = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg') || lower.startsWith('data:video');
  };

  const getThumbnail = (v) => {
    if (v.thumbnail_url) return v.thumbnail_url;
    const url = v.video_url || '';
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
  };

  const filtered = videos.filter(v =>
    (v.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.description && v.description.toLowerCase().includes(search.toLowerCase())) ||
    (v.subjects?.name && v.subjects.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Video size={24} color="var(--primary)" /> Video Pembelajaran
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Tonton penjelasan video interaktif dari guru sekolah Anda
          </p>
        </div>

        <div className="input-wrapper" style={{ maxWidth: 300, width: '100%' }}>
          <Search size={16} className="input-icon" />
          <input
            type="search"
            className="form-input input-with-icon"
            placeholder="Cari video..."
            onChange={e => searchRef.current(e.target.value)}
            aria-label="Cari video pembelajaran"
          />
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ height: 280, borderRadius: 16, overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 180, width: '100%' }} />
              <div style={{ padding: 16 }}>
                <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Video}
          title={search ? 'Video tidak ditemukan' : 'Belum Ada Video Pembelajaran'}
          description={search ? `Tidak ada hasil video untuk "${search}"` : 'Guru Anda belum mengunggah video pembelajaran saat ini.'}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(v => {
            const isDone = videoProgressMap[v.id];
            const durationDisplay = (v.duration && v.duration > 0) ? `${v.duration} Menit` : '10-15 Menit';
            const thumbUrl = getThumbnail(v);

            return (
              <div key={v.id} className="card card-hover" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: isDone ? '1px solid #BBF7D0' : '1px solid var(--border)', background: isDone ? '#F0FDF4' : 'var(--bg)' }}>
                {/* Media / Thumbnail Container */}
                <div style={{ height: 170, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {thumbUrl ? (
                    <>
                      <img
                        src={thumbUrl}
                        alt={v.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setPlayingVideo(v)}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.6)' }}>
                          <PlayCircle size={32} color="#FFFFFF" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, width: '100%', height: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)', cursor: 'pointer' }} onClick={() => setPlayingVideo(v)}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.5)' }}>
                        <PlayCircle size={30} color="#FFFFFF" />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                        Video Pembelajaran
                      </div>
                    </div>
                  )}

                  {/* Top Right Badge */}
                  {isDone && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'rgba(16, 185, 129, 0.95)',
                      color: '#FFFFFF',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: 20,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                      zIndex: 10
                    }}>
                      <CheckCircle2 size={13} strokeWidth={2.5} /> Selesai Ditonton
                    </div>
                  )}
                </div>

                {/* Card Information */}
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📘 {v.subjects?.name || 'Mata Pelajaran'} • {durationDisplay}</span>
                      {isDone && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#059669',
                          background: '#E6F4EA',
                          border: '1px solid #A7F3D0',
                          padding: '2px 8px',
                          borderRadius: 12
                        }}>
                          <CheckCircle2 size={12} strokeWidth={2.5} /> Selesai
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                      {v.title}
                    </h3>

                    {v.description && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                        {v.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)', gap: 8 }}>
                    <Link href={`/student/videos/${v.id}`} style={{ flex: 1 }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', justifyContent: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}
                      >
                        <Play size={13} /> Tonton Video
                      </button>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setPlayingVideo(v)}
                      className="btn btn-outline btn-sm"
                      style={{ gap: 4, fontSize: 12, padding: '6px 10px' }}
                      title="Putar Pop-up"
                    >
                      <Maximize2 size={13} /> Pop-up
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Modal Player */}
      <Modal open={!!playingVideo} onClose={() => setPlayingVideo(null)} title={playingVideo?.title || 'Tonton Video'}>
        {playingVideo && (
          <div style={{ width: '100%', height: 420, background: '#000', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isDirectVideo(playingVideo.video_url) ? (
              <video
                src={playingVideo.video_url}
                controls
                autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : getEmbedUrl(playingVideo.video_url) ? (
              <iframe
                src={getEmbedUrl(playingVideo.video_url)}
                title={playingVideo.title}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div style={{ color: 'white', textAlign: 'center', padding: 20 }}>
                <p style={{ marginBottom: 14, fontSize: 14 }}>Tautan video tidak dapat diputar dalam bingkai pop-up.</p>
                <Link href={`/student/videos/${playingVideo.id}`}>
                  <button className="btn btn-primary btn-sm">Buka Halaman Pemutar Video</button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
