'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Video, ArrowLeft, CheckCircle, Play } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';

export default function VideoPlayerPage() {
  const params = useParams();
  const videoId = params.id;
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [video, setVideo] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!profile || !videoId) return;
    fetchVideo();
  }, [profile, videoId]);

  async function fetchVideo() {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data: vid } = await supabase
        .from('videos')
        .select('*, subjects(id, name)')
        .eq('id', videoId)
        .single();

      if (vid) {
        setVideo(vid);

        const { data: vProg } = await supabase
          .from('video_progress')
          .select('is_completed, progress_percentage')
          .eq('student_id', profile.id)
          .eq('video_id', videoId)
          .maybeSingle();

        if (vProg?.is_completed || vProg?.progress_percentage === 100) {
          setIsCompleted(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteVideo() {
    if (!profile || !video) return;
    const supabase = createClient();
    setUpdating(true);
    try {
      const nextState = !isCompleted;

      await supabase.from('video_progress').upsert({
        student_id: profile.id,
        video_id: video.id,
        watched_seconds: video.duration || 300,
        duration: video.duration || 300,
        progress_percentage: nextState ? 100 : 0,
        is_completed: nextState,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id,video_id' });

      setIsCompleted(nextState);

      // Update subject overall progress
      if (video.subject_id) {
        const [{ count: totalVids }, { count: completedVids }] = await Promise.all([
          supabase.from('videos').select('*', { count: 'exact', head: true }).eq('subject_id', video.subject_id),
          supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('student_id', profile.id).eq('is_completed', true)
        ]);

        const pct = totalVids > 0 ? Math.round(((completedVids || 0) / totalVids) * 100) : 0;

        await supabase.from('student_progress').upsert({
          student_id: profile.id,
          subject_id: video.subject_id,
          progress_percentage: Math.min(100, pct),
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,subject_id' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
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

  if (loading) {
    return (
      <DashboardLayout profile={profile} unreadCount={unreadCount}>
        <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </DashboardLayout>
    );
  }

  if (!video) {
    return (
      <DashboardLayout profile={profile} unreadCount={unreadCount}>
        <div className="card card-padding" style={{ textAlign: 'center' }}>
          <h2>Video Tidak Ditemukan</h2>
        </div>
      </DashboardLayout>
    );
  }

  const embedUrl = getEmbedUrl(video.video_url);
  const isIframe = embedUrl.includes('youtube.com') || embedUrl.includes('vimeo.com');

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <Link
        href={video.subject_id ? `/student/subjects/${video.subject_id}` : '/student/subjects'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Kembali ke {video.subjects?.name || 'Mata Pelajaran'}
      </Link>

      <div className="card" style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        {/* Video Player Box */}
        <div style={{ background: '#0F172A', position: 'relative', width: '100%', paddingTop: '56.25%' }}>
          {isIframe ? (
            <iframe
              src={embedUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <video
              src={video.video_url}
              controls
              onEnded={handleCompleteVideo}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          )}
        </div>

        {/* Video Details */}
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                {video.title}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {video.description || 'Tidak ada deskripsi tambahan untuk video ini.'}
              </p>
            </div>

            <button
              onClick={handleCompleteVideo}
              disabled={updating}
              className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
              style={{ gap: 8 }}
            >
              <CheckCircle size={18} />
              {isCompleted ? 'Sudah Ditonton ✅ (Klik untuk Ubah)' : 'Tandai Selesai Nonton'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
