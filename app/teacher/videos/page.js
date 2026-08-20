'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { Video, Plus, Trash2, Edit, PlayCircle, ExternalLink, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { openOrDownloadFile } from '@/lib/utils';

export default function TeacherVideosPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [subjects, setSubjects] = useState([]);
  const [videos, setVideos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  const [videoSourceType, setVideoSourceType] = useState('file'); // 'file' or 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [form, setForm] = useState({
    subject_id: '',
    title: '',
    description: '',
    video_url: '',
    duration: '10 Menit',
    is_published: true
  });

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      // 1. Fetch subjects safely (teacher subjects + general subjects)
      let { data: subData } = await supabase
        .from('subjects')
        .select('*');

      setSubjects(subData || []);

      // 2. Fetch videos safely without throwing database exceptions
      const { data: vidData, error: vidErr } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (vidErr) {
        console.warn('Video fetch handled safely:', vidErr.message);
        setVideos([]);
      } else {
        // Map subject names cleanly
        const mapped = (vidData || []).map(v => {
          const sub = (subData || []).find(s => s.id === v.subject_id);
          return { ...v, subjects: sub ? { name: sub.name } : { name: 'Mata Pelajaran' } };
        });
        setVideos(mapped);
      }
    } catch (e) {
      console.warn('fetchData error handled gracefully:', e.message);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingVideo(null);
    setForm({
      subject_id: subjects[0]?.id || '',
      title: '',
      description: '',
      video_url: '',
      duration: '10 Menit',
      is_published: true
    });
    setVideoSourceType('file');
    setSelectedFile(null);
    setFileName('');
    setFileSize('');
    setSaveError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (vid) => {
    setEditingVideo(vid);
    setForm({
      subject_id: vid.subject_id || subjects[0]?.id || '',
      title: vid.title || '',
      description: vid.description || '',
      video_url: vid.video_url || '',
      duration: vid.duration || '10 Menit',
      is_published: vid.is_published !== false
    });
    setVideoSourceType(vid.video_url?.startsWith('data:') ? 'file' : 'url');
    setSelectedFile(null);
    setFileName(vid.video_url?.startsWith('data:') ? 'Berkas Video Terlampir' : '');
    setFileSize('');
    setSaveError('');
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setSaveError('Ukuran file video terlalu besar. Maksimal 100MB.');
      return;
    }

    setSaveError('');
    setSelectedFile(file);
    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');

    // Create instant object URL preview without memory overhead
    const objectUrl = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, video_url: objectUrl }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setSaveError('Judul video wajib diisi.');
      return;
    }
    if (videoSourceType === 'url' && !form.video_url.trim()) {
      setSaveError('Tautan URL video wajib diisi.');
      return;
    }
    if (videoSourceType === 'file' && !selectedFile && !form.video_url) {
      setSaveError('Silakan pilih berkas video dari HP/Laptop Anda.');
      return;
    }

    setSaving(true);
    setSaveError('');
    const supabase = createClient();

    try {
      let targetSubjectId = form.subject_id;
      if (!targetSubjectId && subjects.length > 0) {
        targetSubjectId = subjects[0].id;
      }

      if (!targetSubjectId) {
        const { data: newSub } = await supabase.from('subjects').insert({
          name: 'Mata Pelajaran Umum',
          teacher_id: profile.id,
          status: 'active'
        }).select('id').single();
        targetSubjectId = newSub?.id;
      }

      let finalVideoUrl = form.video_url;

      // Attempt Supabase storage upload if uploading file
      if (videoSourceType === 'file' && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileNameStr = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
        const filePath = `videos/${fileNameStr}`;

        let uploadSuccess = false;
        const bucketNames = ['lms_media', 'videos', 'materials', 'public'];

        for (const bName of bucketNames) {
          try {
            const { data: upData, error: upErr } = await supabase.storage
              .from(bName)
              .upload(filePath, selectedFile, { upsert: true });

            if (!upErr && upData) {
              const { data: pubData } = supabase.storage.from(bName).getPublicUrl(filePath);
              if (pubData?.publicUrl) {
                finalVideoUrl = pubData.publicUrl;
                uploadSuccess = true;
                break;
              }
            }
          } catch (stgErr) {
            console.warn(`Storage bucket ${bName} error:`, stgErr);
          }
        }

        if (!uploadSuccess) {
          try {
            finalVideoUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(selectedFile);
            });
          } catch (rErr) {
            console.warn('FileReader fallback error:', rErr);
          }
        }
      }

      const parseMinutes = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 10;
        const match = String(val).match(/\d+/);
        return match ? parseInt(match[0], 10) : 10;
      };

      const payload = {
        subject_id: targetSubjectId,
        title: form.title.trim(),
        description: form.description,
        video_url: finalVideoUrl,
        duration: parseMinutes(form.duration),
        is_published: form.is_published,
        created_by: profile.id
      };

      if (editingVideo) {
        const { error: updateErr } = await supabase
          .from('videos')
          .update(payload)
          .eq('id', editingVideo.id);

        if (updateErr) throw new Error(updateErr.message);
      } else {
        const { error: insertErr } = await supabase
          .from('videos')
          .insert(payload);

        if (insertErr) throw new Error(insertErr.message);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setSaveError(err.message || 'Gagal menyimpan video. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus video pembelajaran ini?')) return;
    const supabase = createClient();
    await supabase.from('videos').delete().eq('id', id);
    fetchData();
  };

  // Convert YouTube link to embed helper
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Kelola Video Pembelajaran</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Unggah berkas video (MP4/WebM) dari HP/Laptop atau sematkan tautan YouTube untuk siswa Anda
          </p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <Plus size={16} /> Tambah Video Baru
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      ) : videos.length === 0 ? (
        <EmptyState
          icon={Video}
          title="Belum Ada Video Pembelajaran"
          description="Tambahkan video pertama Anda agar siswa dapat menonton materi secara visual."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {videos.map(v => {
            const isLocalVideo = v.video_url?.startsWith('data:video') || v.video_url?.endsWith('.mp4');
            const isYouTube = v.video_url?.includes('youtube') || v.video_url?.includes('youtu.be');
            return (
              <div key={v.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 180, background: '#0F172A', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isYouTube ? (
                    <iframe
                      src={getEmbedUrl(v.video_url)}
                      title={v.title}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                    />
                  ) : isLocalVideo ? (
                    <video
                      src={v.video_url}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'white' }}>
                      <PlayCircle size={48} color="#60A5FA" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 12 }}>{v.duration || 'Video Stream'}</div>
                    </div>
                  )}
                </div>

                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{v.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                      📘 {v.subjects?.name || 'Mata Pelajaran'} • {typeof v.duration === 'number' ? `${v.duration} Menit` : (v.duration || '10 Menit')}
                    </div>
                    {v.description && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                        {v.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => openOrDownloadFile(v.video_url, v.title)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--primary)',
                        fontWeight: 700, display: 'inline-flex', alignItems: 'center',
                        gap: 4, cursor: 'pointer', padding: 0, fontSize: 12
                      }}
                    >
                      <ExternalLink size={13} /> Buka / Putar Link
                    </button>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleOpenEditModal(v)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(v.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Video Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingVideo ? 'Edit Video Pembelajaran' : 'Tambah Video Pembelajaran Baru'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {saveError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'var(--error-light)', borderRadius: 8, border: '1px solid #FECACA' }}>
              <AlertCircle size={16} color="var(--error)" />
              <span style={{ fontSize: 13, color: 'var(--error)' }}>{saveError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="vid_subject_id">Pilih Mata Pelajaran</label>
            <select
              id="vid_subject_id"
              className="form-input"
              value={form.subject_id}
              onChange={e => setForm({ ...form, subject_id: e.target.value })}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="vid_title">Judul Video</label>
            <input
              id="vid_title"
              type="text"
              required
              className="form-input"
              placeholder="Contoh: Penjelasan Bab 1 Trigonometri"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Video Source Option Tab */}
          <div className="form-group">
            <label className="form-label">Metode Unggah / Sematkan Video</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                className={`btn ${videoSourceType === 'file' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setVideoSourceType('file')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '10px 8px', textAlign: 'center', height: '100%', borderRadius: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                  <Upload size={16} />
                  <span>Unggah Berkas Video</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 3 }}>
                  (HP / Laptop)
                </div>
              </button>

              <button
                type="button"
                className={`btn ${videoSourceType === 'url' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setVideoSourceType('url')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '10px 8px', textAlign: 'center', height: '100%', borderRadius: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                  <ExternalLink size={16} />
                  <span>Sematkan Tautan URL</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 3 }}>
                  (YouTube / Vimeo / Web)
                </div>
              </button>
            </div>

            {videoSourceType === 'file' ? (
              <div style={{ border: '2px dashed var(--border)', padding: '20px 16px', borderRadius: 12, textAlign: 'center', background: '#F8FAFC' }}>
                <input
                  type="file"
                  id="video-file-upload-input"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                />
                <label htmlFor="video-file-upload-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 44, height: 44, background: '#DBEAFE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                    <Upload size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>Klik untuk Pilih Berkas Video</span>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>MP4, WebM, MOV, atau OGG (Maks 50MB)</div>
                  </div>
                </label>

                {fileName && (
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#D1FAE5', borderRadius: 8, border: '1px solid #6EE7B7', maxWidth: '100%', wordBreak: 'break-all' }}>
                    <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>{fileName} {fileSize ? `(${fileSize})` : ''}</span>
                  </div>
                )}
              </div>
            ) : (
              <input
                id="vid_url"
                type="url"
                required
                className="form-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.video_url}
                onChange={e => setForm({ ...form, video_url: e.target.value })}
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="vid_duration">Estimasi Durasi Video</label>
            <input
              id="vid_duration"
              type="text"
              className="form-input"
              placeholder="Contoh: 15 Menit"
              value={form.duration}
              onChange={e => setForm({ ...form, duration: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="vid_desc">Deskripsi Singkat (Opsional)</label>
            <textarea
              id="vid_desc"
              rows={3}
              className="form-input"
              placeholder="Ketik ringkasan mengenai poin utama video..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">Batal</button>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ gap: 6 }}>
              {saving ? 'Menyimpan...' : <><CheckCircle2 size={16} /> {editingVideo ? 'Simpan Perubahan' : 'Simpan Video'}</>}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
