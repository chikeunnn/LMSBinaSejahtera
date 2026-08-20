'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { FileText, Plus, Trash2, Edit, Upload, CheckCircle2, AlertCircle, ExternalLink, Download } from 'lucide-react';
import { openOrDownloadFile } from '@/lib/utils';

export default function TeacherMaterialsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [subjects, setSubjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const [fileUploadType, setFileUploadType] = useState('file'); // 'file' or 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  const [form, setForm] = useState({
    subject_id: '',
    new_subject_name: '',
    title: '',
    content_type: 'document',
    description: '',
    content: '',
    file_url: '',
    is_published: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      const [{ data: subData }, { data: matData }] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase.from('materials').select('*, subjects(name)').order('created_at', { ascending: false })
      ]);
      setSubjects(subData || []);
      setMaterials(matData || []);
    } catch (e) {
      console.error('Error fetching materials:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingMaterial(null);
    setForm({
      subject_id: subjects[0]?.id || 'NEW_SUBJECT',
      new_subject_name: '',
      title: '',
      content_type: 'document',
      description: '',
      content: '',
      file_url: '',
      is_published: true
    });
    setFileUploadType('file');
    setSelectedFile(null);
    setFileName('');
    setFileSize('');
    setSaveError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (mat) => {
    setEditingMaterial(mat);
    setForm({
      subject_id: mat.subject_id || '',
      new_subject_name: '',
      title: mat.title || '',
      content_type: mat.content_type === 'link' ? 'article_website' : (mat.content_type || 'document'),
      description: mat.description || '',
      content: mat.content || '',
      file_url: mat.file_url || '',
      is_published: mat.is_published !== false
    });
    setFileUploadType(mat.file_url?.startsWith('data:') ? 'file' : 'url');
    setSelectedFile(null);
    setFileName(mat.file_url ? 'Berkas Terlampir' : '');
    setFileSize('');
    setSaveError('');
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setSaveError('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    setSaveError('');
    setSelectedFile(file);
    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');

    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, file_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setSaveError('Judul materi wajib diisi.');
      return;
    }

    setSaving(true);
    setSaveError('');
    const supabase = createClient();

    try {
      let targetSubjectId = form.subject_id;

      if (form.subject_id === 'NEW_SUBJECT' || !targetSubjectId) {
        const subjectName = form.new_subject_name.trim() || 'Mata Pelajaran Umum';

        const { data: existingSub } = await supabase
          .from('subjects')
          .select('id')
          .eq('teacher_id', profile.id)
          .eq('name', subjectName)
          .maybeSingle();

        if (existingSub) {
          targetSubjectId = existingSub.id;
        } else {
          const { data: newSub, error: subErr } = await supabase
            .from('subjects')
            .insert({
              name: subjectName,
              teacher_id: profile.id,
              status: 'active'
            })
            .select('id')
            .single();

          if (subErr) {
            throw new Error('Gagal membuat Mata Pelajaran baru.');
          }
          targetSubjectId = newSub.id;
        }
      }

      const materialPayload = {
        subject_id: targetSubjectId,
        title: form.title.trim(),
        content_type: form.content_type === 'article_website' ? 'link' : form.content_type,
        description: form.description,
        content: form.content,
        file_url: form.file_url,
        is_published: form.is_published,
        created_by: profile.id
      };

      if (editingMaterial) {
        const { error: updateErr } = await supabase
          .from('materials')
          .update({
            ...materialPayload,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMaterial.id);

        if (updateErr) throw new Error(updateErr.message);
      } else {
        const { error: insertErr } = await supabase
          .from('materials')
          .insert(materialPayload);

        if (insertErr) throw new Error(insertErr.message);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setSaveError(err.message || 'Gagal menyimpan materi. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;
    const supabase = createClient();
    await supabase.from('materials').delete().eq('id', id);
    fetchData();
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Kelola Materi Pembelajaran</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Unggah modul, dokumen PDF, teks bacaan, dan berkas pembelajaran untuk siswa
          </p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <Plus size={16} /> Tambah Materi Baru
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum Ada Materi"
          description="Klik tombol 'Tambah Materi Baru' di atas untuk mengunggah berkas atau teks bacaan."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {materials.map(m => (
            <div key={m.id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>📘 {m.subjects?.name || 'Mata Pelajaran'}</span>
                    <span>• Tipe: {m.content_type === 'link' ? 'ARTIKEL / WEBSITE' : m.content_type?.toUpperCase()}</span>
                    {m.file_url && (
                      <button
                        type="button"
                        onClick={() => openOrDownloadFile(m.file_url, m.title)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--primary)',
                          fontWeight: 700, display: 'inline-flex', alignItems: 'center',
                          gap: 4, cursor: 'pointer', padding: 0, fontSize: 12
                        }}
                      >
                        <ExternalLink size={13} /> Buka Berkas
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${m.is_published ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                  {m.is_published ? 'Publik' : 'Draft'}
                </span>
                <button
                  onClick={() => handleOpenEditModal(m)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 4 }}
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--error)' }}
                  title="Hapus Materi"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Material Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingMaterial ? 'Edit Materi Pembelajaran' : 'Tambah Materi Pembelajaran Baru'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {saveError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'var(--error-light)', borderRadius: 8, border: '1px solid #FECACA' }}>
              <AlertCircle size={16} color="var(--error)" />
              <span style={{ fontSize: 13, color: 'var(--error)' }}>{saveError}</span>
            </div>
          )}

          {/* Subject selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="mat_subject_id">Pilih Mata Pelajaran</label>
            <select
              id="mat_subject_id"
              className="form-input"
              value={form.subject_id}
              onChange={e => setForm({ ...form, subject_id: e.target.value })}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
              <option value="NEW_SUBJECT">+ Buat Mata Pelajaran Baru...</option>
            </select>
          </div>

          {(form.subject_id === 'NEW_SUBJECT' || subjects.length === 0) && (
            <div className="form-group" style={{ background: '#EFF6FF', padding: 12, borderRadius: 8, border: '1px solid #BFDBFE' }}>
              <label className="form-label" htmlFor="mat_new_subject_name" style={{ color: '#1E40AF' }}>Nama Mata Pelajaran Baru</label>
              <input
                id="mat_new_subject_name"
                type="text"
                className="form-input"
                placeholder="Contoh: Matematika Kelas 8"
                value={form.new_subject_name}
                onChange={e => setForm({ ...form, new_subject_name: e.target.value })}
              />
            </div>
          )}

          {/* Material Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="mat_title">Judul Materi</label>
            <input
              id="mat_title"
              type="text"
              required
              className="form-input"
              placeholder="Contoh: Modul 1 - Bab Trigonometri Dasar"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Content Type */}
          <div className="form-group">
            <label className="form-label" htmlFor="mat_content_type">Tipe Konten</label>
            <select
              id="mat_content_type"
              className="form-input"
              value={form.content_type}
              onChange={e => {
                const val = e.target.value;
                setForm({ ...form, content_type: val });
                if (val === 'article_website') {
                  setFileUploadType('url');
                }
              }}
            >
              <option value="document">Dokumen / PDF / Word / Excel</option>
              <option value="presentation">Slide Presentasi (PPT)</option>
              <option value="article_website">Artikel / Website (URL Eksternal)</option>
              <option value="image">Gambar / Infografis</option>
              <option value="text">Teks Bacaan Langsung</option>
            </select>
          </div>

          {/* File Upload Option Tab */}
          <div className="form-group">
            <label className="form-label">Metode Unggah Berkas Materi</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                className={`btn ${fileUploadType === 'file' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFileUploadType('file')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '10px 8px', textAlign: 'center', height: '100%', borderRadius: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                  <Upload size={16} />
                  <span>Unggah Berkas</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 3 }}>
                  (HP / Laptop)
                </div>
              </button>

              <button
                type="button"
                className={`btn ${fileUploadType === 'url' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFileUploadType('url')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '10px 8px', textAlign: 'center', height: '100%', borderRadius: 10
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                  <ExternalLink size={16} />
                  <span>Tautan URL Web</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 3 }}>
                  (Website / Drive)
                </div>
              </button>
            </div>

            {fileUploadType === 'file' ? (
              <div style={{ border: '2px dashed var(--border)', padding: '20px 16px', borderRadius: 12, textAlign: 'center', background: '#F8FAFC' }}>
                <input
                  type="file"
                  id="file-upload-input"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
                <label htmlFor="file-upload-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 44, height: 44, background: '#DBEAFE', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                    <Upload size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>Klik untuk Pilih Berkas</span>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>PDF, Word, PPT, Excel, atau Gambar (Maks 10MB)</div>
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
                type="url"
                className="form-input"
                placeholder="Paste tautan URL dokumen (https://...)"
                value={form.file_url}
                onChange={e => setForm({ ...form, file_url: e.target.value })}
              />
            )}
          </div>

          {/* Text Content (Optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="mat_content">Isi Catatan / Ringkasan Teks (Opsional)</label>
            <textarea
              id="mat_content"
              rows={3}
              className="form-input"
              placeholder="Ketik ringkasan atau catatan penjelasan untuk siswa..."
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">Batal</button>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ gap: 6 }}>
              {saving ? 'Menyimpan Materi...' : <><CheckCircle2 size={16} /> {editingMaterial ? 'Simpan Perubahan' : 'Terbitkan Materi'}</>}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
