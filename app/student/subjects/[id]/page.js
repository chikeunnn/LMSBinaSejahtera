'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookMarked, FileText, Video, HelpCircle, ClipboardList,
  ChevronRight, ArrowLeft, CheckCircle2, PlayCircle, Clock
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ProgressBar } from '@/components/ui/Progress';
import EmptyState from '@/components/ui/EmptyState';
import Tabs from '@/components/ui/Tabs';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { formatDateShort } from '@/lib/utils';

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id;
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [videos, setVideos] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [materialProgressMap, setMaterialProgressMap] = useState({});
  const [videoProgressMap, setVideoProgressMap] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || !subjectId) return;
    fetchSubjectData();
  }, [profile, subjectId]);

  async function fetchSubjectData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [
        { data: subData },
        { data: chapData },
        { data: matData },
        { data: vidData },
        { data: quizData },
        { data: asnData },
        { data: progData },
        { data: matProgData },
        { data: vidProgData }
      ] = await Promise.all([
        supabase.from('subjects').select('*, profiles(full_name)').eq('id', subjectId).single(),
        supabase.from('chapters').select('*').eq('subject_id', subjectId).order('order_number', { ascending: true }),
        supabase.from('materials').select('*').eq('subject_id', subjectId).order('created_at', { ascending: true }),
        supabase.from('videos').select('*').eq('subject_id', subjectId).order('created_at', { ascending: true }),
        supabase.from('quizzes').select('*').eq('subject_id', subjectId),
        supabase.from('assignments').select('*').eq('subject_id', subjectId).order('deadline', { ascending: true }),
        supabase.from('student_progress').select('*').eq('student_id', profile.id).eq('subject_id', subjectId).maybeSingle(),
        supabase.from('material_progress').select('*').eq('student_id', profile.id),
        supabase.from('video_progress').select('*').eq('student_id', profile.id)
      ]);

      setSubject(subData);
      setChapters(chapData || []);
      setMaterials(matData || []);
      setVideos(vidData || []);
      setQuizzes(quizData || []);
      setAssignments(asnData || []);
      setProgress(progData || null);

      const mMap = {};
      (matProgData || []).forEach(p => { 
        if (p.status === 'completed' || p.progress_percentage === 100) {
          mMap[p.material_id] = true;
        }
      });
      setMaterialProgressMap(mMap);

      const vMap = {};
      (vidProgData || []).forEach(p => { 
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

  // Get Video Thumbnail helper
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

  // Dynamic progress calculation
  const totalContentCount = materials.length + videos.length;
  const completedMaterialsCount = Object.keys(materialProgressMap).filter(id => materials.some(m => String(m.id) === String(id) && materialProgressMap[id])).length;
  const completedVideosCount = Object.keys(videoProgressMap).filter(id => videos.some(v => String(v.id) === String(id) && videoProgressMap[id])).length;
  const totalCompleted = completedMaterialsCount + completedVideosCount;
  
  const calculatedPercentage = totalContentCount > 0
    ? Math.min(100, Math.round((totalCompleted / totalContentCount) * 100))
    : (progress?.progress_percentage || 0);

  const tabs = [
    { key: 'all', label: 'Semua Konten' },
    { key: 'materials', label: `Materi (${materials.length})` },
    { key: 'videos', label: `Video (${videos.length})` },
    { key: 'quizzes', label: `Kuis (${quizzes.length})` },
    { key: 'assignments', label: `Tugas (${assignments.length})` },
  ];

  if (loading) {
    return (
      <DashboardLayout profile={profile} unreadCount={unreadCount}>
        <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 160, borderRadius: 16, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </DashboardLayout>
    );
  }

  if (!subject) {
    return (
      <DashboardLayout profile={profile} unreadCount={unreadCount}>
        <EmptyState
          icon={BookMarked}
          title="Mata Pelajaran Tidak Ditemukan"
          description="Mata pelajaran ini mungkin tidak aktif atau telah dihapus."
          action={<Link href="/student/subjects"><button className="btn btn-primary btn-sm">Kembali ke Pelajaran</button></Link>}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      {/* Back link */}
      <Link href="/student/subjects" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 500 }}>
        <ArrowLeft size={16} /> Kembali ke Mata Pelajaran
      </Link>

      {/* Subject Header Banner */}
      <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', color: 'white', borderRadius: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="badge badge-glass" style={{ marginBottom: 12 }}>
              📘 Mata Pelajaran
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 6 }}>{subject.name}</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', maxWidth: 500 }}>
              Pengajar: <strong>{subject.profiles?.full_name || 'Guru Bina Sejahtera'}</strong>
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', minWidth: 200 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Progress Pembelajaran</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 6 }}>
              {calculatedPercentage}%
            </div>
            <ProgressBar value={calculatedPercentage} color="#34D399" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <Tabs tabs={tabs} defaultTab="all" onChange={setActiveTab} />
      </div>

      {/* Content Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* MATERIALS SECTION */}
        {(activeTab === 'all' || activeTab === 'materials') && (
          <div className="card card-padding">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="var(--primary)" /> Materi Pembelajaran ({materials.length})
            </h2>
            {materials.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada materi untuk mata pelajaran ini.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {materials.map(m => {
                  const isDone = materialProgressMap[m.id];
                  return (
                    <Link href={`/student/materials/${m.id}`} key={m.id}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', background: isDone ? '#F0FDF4' : 'var(--bg)', borderRadius: 10,
                        border: isDone ? '1px solid #BBF7D0' : '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer'
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = isDone ? '#BBF7D0' : 'var(--border)'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: isDone ? '#D1FAE5' : '#DBEAFE',
                            color: isDone ? '#059669' : '#2563EB',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {isDone ? <CheckCircle2 size={18} color="#059669" /> : <FileText size={18} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 10, marginTop: 2 }}>
                              <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{m.content_type || 'PDF/LINK'}</span>
                              <span>• {formatDateShort(m.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isDone ? (
                            <span style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={13} /> Selesai Dibaca
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Buka Materi</span>
                          )}
                          <ChevronRight size={16} color="var(--text-muted)" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIDEOS SECTION */}
        {(activeTab === 'all' || activeTab === 'videos') && (
          <div className="card card-padding">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Video size={18} color="#7C3AED" /> Video Pembelajaran ({videos.length})
            </h2>
            {videos.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada video pembelajaran.</p>
            ) : (
              <div className="grid grid-3">
                {videos.map(v => {
                  const isDone = videoProgressMap[v.id];
                  const durationDisplay = (v.duration && v.duration > 0) ? `${v.duration} menit` : '10-15 menit';
                  const thumbUrl = getThumbnail(v);
                  
                  return (
                    <Link href={`/student/videos/${v.id}`} key={v.id}>
                      <div style={{
                        background: isDone ? '#F0FDF4' : 'var(--bg)', borderRadius: 12, border: isDone ? '1px solid #BBF7D0' : '1px solid var(--border)',
                        overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#7C3AED'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = isDone ? '#BBF7D0' : 'var(--border)'}>
                        
                        {/* Video Thumbnail Box */}
                        <div style={{ height: 160, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {thumbUrl ? (
                            <>
                              <img
                                src={thumbUrl}
                                alt={v.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                              />
                              {/* Dark Overlay for play button readability */}
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.6)' }}>
                                  <PlayCircle size={32} color="#FFFFFF" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ textAlignment: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, width: '100%', height: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)' }}>
                              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.5)' }}>
                                <PlayCircle size={30} color="#FFFFFF" />
                              </div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                                Video Pembelajaran
                              </div>
                            </div>
                          )}

                          {/* Top-Right Badge: Selesai Ditonton */}
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
                              zIndex: 2
                            }}>
                              <CheckCircle2 size={13} strokeWidth={2.5} /> Selesai Ditonton
                            </div>
                          )}
                        </div>

                        {/* Card Info */}
                        <div style={{ padding: 14 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.4 }}>{v.title}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                              <Clock size={12} /> {durationDisplay}
                            </div>
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
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* QUIZZES SECTION */}
        {(activeTab === 'all' || activeTab === 'quizzes') && (
          <div className="card card-padding">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={18} color="#059669" /> Kuis & Ujian ({quizzes.length})
            </h2>
            {quizzes.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada kuis yang dipublikasikan.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {quizzes.map(q => (
                  <Link href={`/student/quizzes/${q.id}`} key={q.id}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', background: 'var(--bg)', borderRadius: 10,
                      border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#059669'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <HelpCircle size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{q.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, marginTop: 2 }}>
                            <span>⏱️ {q.duration || 15} Menit</span>
                            <span>🎯 Nilai Lulus: {q.passing_score || 70}</span>
                          </div>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm">Kerjakan Kuis</button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ASSIGNMENTS SECTION */}
        {(activeTab === 'all' || activeTab === 'assignments') && (
          <div className="card card-padding">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={18} color="#D97706" /> Tugas Pembelajaran ({assignments.length})
            </h2>
            {assignments.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada tugas yang diberikan.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {assignments.map(a => (
                  <Link href={`/student/assignments/${a.id}`} key={a.id}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', background: 'var(--bg)', borderRadius: 10,
                      border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#D97706'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ClipboardList size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, marginTop: 2 }}>
                            <span>📅 Tenggat: {a.deadline ? formatDateShort(a.deadline) : 'Tidak Ada Limit'}</span>
                          </div>
                        </div>
                      </div>
                      <button className="btn btn-secondary btn-sm">Lihat Detail Tugas</button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
