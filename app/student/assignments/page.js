'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { ClipboardList, Upload, CheckCircle2, Clock, AlertCircle, Send } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

export default function StudentAssignmentsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [assignments, setAssignments] = useState([]);
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [contentNote, setContentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);
    try {
      let { data: asnData } = await supabase.from('assignments').select('*, subjects(name)').order('created_at', { ascending: false });
      if (!asnData || asnData.length === 0) {
        const { data: rawAsn } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
        asnData = rawAsn || [];
      }

      const { data: submissData } = await supabase.from('assignment_submissions').select('*').eq('student_id', profile.id);

      setAssignments(asnData || []);

      const subMap = {};
      (submissData || []).forEach(sub => {
        subMap[sub.assignment_id] = sub;
      });
      setSubmissionsMap(subMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenSubmitModal = (asn) => {
    setActiveAssignment(asn);
    setSelectedFile(null);
    setFileName('');
    setContentNote('');
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!activeAssignment) return;
    setSubmitting(true);
    const supabase = createClient();

    try {
      await supabase.from('assignment_submissions').insert({
        assignment_id: activeAssignment.id,
        student_id: profile.id,
        file_url: typeof selectedFile === 'string' ? selectedFile : null,
        content: contentNote,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      });

      setModalOpen(false);
      fetchData();
      alert('Tugas berhasil dikumpulkan!');
    } catch (err) {
      console.error(err);
      alert('Gagal mengumpulkan tugas. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Tugas Sekolah Siswa</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Kumpulkan berkas tugas Anda dan lihat penilaian langsung dari guru
        </p>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum Ada Tugas Sekolah"
          description="Saat ini belum ada tugas yang diberikan oleh guru Anda."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {assignments.map(a => {
            const submission = submissionsMap[a.id];
            return (
              <div key={a.id} className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
                    📘 {a.subjects?.name || 'Mata Pelajaran'}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{a.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                    {a.description || 'Kerjakan tugas sesuai instruksi guru.'}
                  </p>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                    ⏰ Tenggat Waktu: {formatDateShort(a.deadline)}
                  </div>
                </div>

                <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  {submission ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className="badge badge-success" style={{ fontSize: 12 }}>
                          ✓ Sudah Dikumpulkan
                        </span>
                        {submission.status === 'graded' && (
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>
                            Nilai: {submission.score} / 100
                          </span>
                        )}
                      </div>
                      {submission.feedback && (
                        <div style={{ fontSize: 12, background: '#EFF6FF', padding: 8, borderRadius: 6, color: '#1E40AF', marginTop: 6 }}>
                          💬 Feedback Guru: "{submission.feedback}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => handleOpenSubmitModal(a)} className="btn btn-primary btn-full" style={{ gap: 6 }}>
                      <Upload size={16} /> Kumpulkan Tugas Sekarang
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Assignment Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Pengumpulan Tugas: ${activeAssignment?.title}`}>
        <form onSubmit={handleSubmitAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Unggah Berkas Tugas (PDF/Word/Gambar)</label>
            <div style={{ border: '2px dashed var(--border)', padding: '20px', borderRadius: 12, textAlign: 'center', background: '#F8FAFC' }}>
              <input type="file" id="stu-file" style={{ display: 'none' }} onChange={handleFileChange} />
              <label htmlFor="stu-file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Upload size={24} color="var(--primary)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>Pilih Berkas Dari Perangkat</span>
              </label>
              {fileName && (
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: '#065F46' }}>
                  ✓ {fileName}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="stu_note">Catatan / Jawaban Teks (Opsional)</label>
            <textarea id="stu_note" rows={3} className="form-input" placeholder="Tuliskan catatan tambahan untuk guru di sini..." value={contentNote} onChange={e => setContentNote(e.target.value)} />
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ marginTop: 10 }}>
            {submitting ? 'Mengirim...' : <><Send size={16} /> Kirimkan Tugas</>}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
