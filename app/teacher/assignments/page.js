'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { ClipboardList, Plus, Trash2, Award, ExternalLink, AlertCircle, CheckCircle2, FileText, Edit } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

export default function TeacherAssignmentsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'submissions'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileUploadType, setFileUploadType] = useState('file'); // 'file' | 'url'

  const [asnForm, setAsnForm] = useState({
    subject_id: '',
    title: '',
    description: '',
    attachment_url: '',
    deadline: '',
    max_score: 100
  });

  const [gradeForm, setGradeForm] = useState({
    score: 85,
    feedback: ''
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
      const [{ data: subData }, { data: asnData }, { data: submissData }] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase.from('assignments').select('*, subjects(name)').order('created_at', { ascending: false }),
        supabase.from('assignment_submissions').select('*, profiles(full_name, email), assignments(title)').order('submitted_at', { ascending: false })
      ]);
      setSubjects(subData || []);
      setAssignments(asnData || []);
      setSubmissions(submissData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setSaveError('Ukuran file berkas soal terlalu besar. Maksimal 20MB.');
      return;
    }

    setSaveError('');
    setSelectedFile(file);
    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');

    const reader = new FileReader();
    reader.onload = () => {
      setAsnForm(prev => ({ ...prev, attachment_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = () => {
    setEditingAssignment(null);
    setAsnForm({
      subject_id: subjects[0]?.id || '',
      title: '',
      description: '',
      attachment_url: '',
      deadline: '',
      max_score: 100
    });
    setFileUploadType('file');
    setSelectedFile(null);
    setFileName('');
    setFileSize('');
    setSaveError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (asn) => {
    setEditingAssignment(asn);
    setAsnForm({
      subject_id: asn.subject_id || subjects[0]?.id || '',
      title: asn.title || '',
      description: asn.description || '',
      attachment_url: asn.attachment_url || '',
      deadline: asn.deadline ? new Date(asn.deadline).toISOString().slice(0, 16) : '',
      max_score: asn.max_score || 100
    });
    setFileUploadType(asn.attachment_url?.startsWith('data:') ? 'file' : 'url');
    setSelectedFile(null);
    setFileName(asn.attachment_url ? 'Berkas Soal Terlampir' : '');
    setFileSize('');
    setSaveError('');
    setModalOpen(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!asnForm.title.trim()) {
      setSaveError('Judul tugas wajib diisi.');
      return;
    }
    setSaving(true);
    setSaveError('');
    const supabase = createClient();

    try {
      let targetSubjectId = asnForm.subject_id;
      if (!targetSubjectId && subjects.length > 0) targetSubjectId = subjects[0].id;

      if (!targetSubjectId) {
        const { data: newSub } = await supabase.from('subjects').insert({
          name: 'Mata Pelajaran Umum',
          teacher_id: profile.id,
          status: 'active'
        }).select('id').single();
        targetSubjectId = newSub?.id;
      }

      const payload = {
        subject_id: targetSubjectId,
        title: asnForm.title.trim(),
        description: asnForm.description,
        attachment_url: asnForm.attachment_url || null,
        deadline: asnForm.deadline || null,
        max_score: parseInt(asnForm.max_score) || 100,
        created_by: profile.id
      };

      if (editingAssignment) {
        const { error: asnErr } = await supabase
          .from('assignments')
          .update(payload)
          .eq('id', editingAssignment.id);

        if (asnErr) throw new Error(asnErr.message);
      } else {
        const { error: asnErr } = await supabase
          .from('assignments')
          .insert(payload);

        if (asnErr) throw new Error(asnErr.message);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setSaveError(err.message || 'Gagal menyimpan tugas.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenGradeModal = (sub) => {
    setActiveSubmission(sub);
    setGradeForm({
      score: sub.score || 85,
      feedback: sub.feedback || ''
    });
    setGradeModalOpen(true);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!activeSubmission) return;
    setSaving(true);
    const supabase = createClient();

    try {
      await supabase.from('assignment_submissions').update({
        score: parseInt(gradeForm.score),
        feedback: gradeForm.feedback,
        status: 'graded'
      }).eq('id', activeSubmission.id);

      setGradeModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!confirm('Hapus tugas ini?')) return;
    const supabase = createClient();
    await supabase.from('assignments').delete().eq('id', id);
    fetchData();
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Kelola Tugas & Penilaian Siswa</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Buat tugas baru, tentukan tenggat waktu (*deadline*), dan berikan penilaian pada hasil pengerjaan siswa
          </p>
        </div>
        <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
          <Plus size={16} /> Buat Tugas Baru
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`btn ${activeTab === 'assignments' ? 'btn-primary' : 'btn-outline'} btn-sm`}
        >
          Daftar Tugas ({assignments.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`btn ${activeTab === 'submissions' ? 'btn-primary' : 'btn-outline'} btn-sm`}
        >
          Pengumpulan Siswa ({submissions.length})
        </button>
      </div>

      {/* Assignments tab */}
      {activeTab === 'assignments' && (
        loading ? (
          <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        ) : assignments.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Belum Ada Tugas" description="Buat tugas sekolah pertama untuk dikerjakan siswa Anda." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {assignments.map(a => (
              <div key={a.id} className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
                    📘 {a.subjects?.name || 'Mata Pelajaran'}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{a.title}</h3>
                  {a.description ? (
                    <div style={{
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 12,
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        📝 Soal / Instruksi Tugas:
                      </div>
                      {a.description}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, italic: 'true' }}>Tidak ada instruksi tertulis.</p>
                  )}
                  
                  {a.attachment_url && (
                    <div style={{ marginBottom: 12 }}>
                      <a
                        href={a.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ gap: 6, fontSize: 12, color: 'var(--primary)' }}
                      >
                        <FileText size={14} /> Buka / Unduh Berkas Soal
                      </a>
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    ⏰ Tenggat: {formatDateShort(a.deadline)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 12 }}>
                  <button onClick={() => handleOpenEditModal(a)} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => handleDeleteAssignment(a.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                    <Trash2 size={16} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Submissions tab */}
      {activeTab === 'submissions' && (
        submissions.length === 0 ? (
          <EmptyState icon={Award} title="Belum Ada Pengumpulan" description="Belum ada siswa yang mengumpulkan tugas." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {submissions.map(sub => (
              <div key={sub.id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    🎓 {sub.profiles?.full_name || 'Siswa'} ({sub.assignments?.title})
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>📅 Dikumpulkan: {formatDateShort(sub.submitted_at)}</span>
                    {sub.file_url && (
                      <a href={sub.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ExternalLink size={12} /> Buka Berkas Siswa
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {sub.status === 'graded' ? (
                    <span className="badge badge-success" style={{ fontSize: 12 }}>
                      Nilai: {sub.score} / 100
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ fontSize: 12 }}>Belum Dinilai</span>
                  )}
                  <button onClick={() => handleOpenGradeModal(sub)} className="btn btn-secondary btn-sm">
                    {sub.status === 'graded' ? 'Edit Nilai' : 'Beri Nilai'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal Add / Edit Assignment */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAssignment ? 'Edit Tugas Sekolah' : 'Buat Tugas Sekolah Baru'}>
        <form onSubmit={handleSaveAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {saveError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'var(--error-light)', borderRadius: 8, border: '1px solid #FECACA' }}>
              <AlertCircle size={16} color="var(--error)" />
              <span style={{ fontSize: 13, color: 'var(--error)' }}>{saveError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="asn_sub_id">Pilih Mata Pelajaran</label>
            <select id="asn_sub_id" className="form-input" value={asnForm.subject_id} onChange={e => setAsnForm({ ...asnForm, subject_id: e.target.value })}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="asn_title">Judul Tugas</label>
            <input id="asn_title" type="text" required className="form-input" placeholder="Contoh: Tugas Mandiri Bab 2 - Aljabar" value={asnForm.title} onChange={e => setAsnForm({ ...asnForm, title: e.target.value })} />
          </div>

          {/* Opsi 1: Ketik Soal Langsung */}
          <div className="form-group">
            <label className="form-label" htmlFor="asn_desc">Deskripsi & Soal Tugas (Ketik Langsung di Sini)</label>
            <textarea id="asn_desc" rows={4} className="form-input" placeholder="Ketik instruksi atau daftar soal langsung di sini...&#10;Contoh:&#10;1. Apa yang dimaksud dengan persamaan linear?&#10;2. Selesaikan 2x + 5 = 15." value={asnForm.description} onChange={e => setAsnForm({ ...asnForm, description: e.target.value })} />
          </div>

          {/* Opsi 2: Unggah Berkas Dokumen (Word, PDF, PPT, Excel) */}
          <div className="form-group">
            <label className="form-label">Lampiran Berkas Soal / Dokumen (Word, PDF, PPT, Excel - Opsional)</label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                className={`btn ${fileUploadType === 'file' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setFileUploadType('file')}
                style={{ flexDirection: 'column', padding: '10px', height: 'auto', textAlign: 'center' }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>Unggah Berkas Dokumen</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>(Word / PDF / PPT / HP)</div>
              </button>
              <button
                type="button"
                className={`btn ${fileUploadType === 'url' ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setFileUploadType('url')}
                style={{ flexDirection: 'column', padding: '10px', height: 'auto', textAlign: 'center' }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>Sematkan Tautan Link</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>(Google Drive / Website)</div>
              </button>
            </div>

            {fileUploadType === 'file' ? (
              <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 16, textAlign: 'center', background: 'var(--bg-main)' }}>
                <input
                  type="file"
                  id="asn_file_input"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="asn_file_input" style={{ cursor: 'pointer', display: 'block' }}>
                  <FileText size={32} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>Klik untuk Pilih Berkas Soal</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Mendukung PDF, Word (.docx), PPT, Excel (Maks 20MB)</div>
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
                placeholder="https://drive.google.com/file/d/..."
                value={asnForm.attachment_url}
                onChange={e => setAsnForm({ ...asnForm, attachment_url: e.target.value })}
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="asn_deadline">Tenggat Waktu (Deadline)</label>
            <input id="asn_deadline" type="datetime-local" className="form-input" value={asnForm.deadline} onChange={e => setAsnForm({ ...asnForm, deadline: e.target.value })} />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyimpan...' : editingAssignment ? 'Simpan Perubahan Tugas' : 'Terbitkan Tugas'}
          </button>
        </form>
      </Modal>

      {/* Modal Grade Submission */}
      <Modal open={gradeModalOpen} onClose={() => setGradeModalOpen(false)} title={`Penilaian Tugas: ${activeSubmission?.profiles?.full_name}`}>
        <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="grd_score">Berikan Nilai (0 - 100)</label>
            <input id="grd_score" type="number" min={0} max={100} required className="form-input" value={gradeForm.score} onChange={e => setGradeForm({ ...gradeForm, score: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="grd_feedback">Catatan / Umpan Balik Guru</label>
            <textarea id="grd_feedback" rows={3} className="form-input" placeholder="Bagus sekali, kerja bagus! / Perbaiki bagian..." value={gradeForm.feedback} onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? 'Menyimpan Nilai...' : 'Simpan & Kirim Nilai'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
