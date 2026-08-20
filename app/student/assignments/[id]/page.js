'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, ArrowLeft, Clock, Send, FileText, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { formatDateShort } from '@/lib/utils';

export default function StudentAssignmentPage() {
  const params = useParams();
  const assignmentId = params.id;
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!profile || !assignmentId) return;
    fetchAssignment();
  }, [profile, assignmentId]);

  async function fetchAssignment() {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data: asn } = await supabase
        .from('assignments')
        .select('*, subjects(id, name)')
        .eq('id', assignmentId)
        .single();

      if (asn) {
        setAssignment(asn);

        // Fetch existing student submission
        const { data: sub } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('assignment_id', assignmentId)
          .eq('student_id', profile.id)
          .maybeSingle();

        if (sub) {
          setSubmission(sub);
          setFileUrl(sub.file_url || '');
          setNotes(sub.notes || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!fileUrl && !notes) {
      alert('Isi tautan berkas/catatan tugas Anda terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setSuccessMsg('');
    const supabase = createClient();

    try {
      const { data: newSub } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: profile.id,
          file_url: fileUrl.trim(),
          notes: notes.trim(),
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        }, { onConflict: 'assignment_id,student_id' })
        .select()
        .single();

      setSubmission(newSub);
      setSuccessMsg('Tugas berhasil dikumpulkan!');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout profile={profile} unreadCount={unreadCount}>
        <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 350, borderRadius: 16 }} />
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout profile={profile} unreadCount={unreadCount}>
        <div className="card card-padding" style={{ textAlign: 'center' }}>
          <h2>Tugas Tidak Ditemukan</h2>
        </div>
      </DashboardLayout>
    );
  }

  const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <Link
        href={assignment.subject_id ? `/student/subjects/${assignment.subject_id}` : '/student/subjects'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Kembali ke {assignment.subjects?.name || 'Mata Pelajaran'}
      </Link>

      <div className="grid grid-2" style={{ gap: 24, alignItems: 'start' }}>
        {/* Assignment Details */}
        <div className="card card-padding">
          <span className="badge badge-warning" style={{ marginBottom: 10 }}>📋 Tugas Kelas</span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
            {assignment.title}
          </h1>

          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            <span style={{ color: isOverdue ? 'var(--error)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} /> Tenggat: {formatDateShort(assignment.deadline)}
            </span>
            <span>Skor Maksimal: {assignment.max_score || 100}</span>
          </div>

          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            marginTop: 10
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>
              📝 Soal & Instruksi Pengerjaan:
            </div>
            {assignment.description || 'Tidak ada instruksi khusus.'}
          </div>

          {assignment.attachment_url && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                📎 Lampiran Dokumen Soal dari Guru:
              </div>
              <a
                href={assignment.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ gap: 8 }}
              >
                <FileText size={16} /> Unduh / Buka Dokumen Soal (Word / PDF / PPT)
              </a>
            </div>
          )}
        </div>

        {/* Submission Form / Status */}
        <div className="card card-padding">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={18} color="var(--primary)" /> Pengumpulan Tugas
          </h2>

          {submission?.status === 'graded' ? (
            <div style={{ padding: 20, background: '#D1FAE5', borderRadius: 12, border: '1px solid #A7F3D0', textAlign: 'center' }}>
              <Award size={48} color="#059669" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 18, color: '#065F46', marginBottom: 4 }}>Tugas Sudah Dinilai!</h3>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#047857', margin: '8px 0' }}>
                {submission.score} / {assignment.max_score || 100}
              </div>
              {submission.feedback && (
                <div style={{ fontSize: 13, color: '#065F46', marginTop: 12, padding: 10, background: 'rgba(255,255,255,0.6)', borderRadius: 8, textAlign: 'left' }}>
                  💬 <strong>Catatan Guru:</strong> {submission.feedback}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {submission && (
                <div style={{ padding: '10px 14px', background: '#D1FAE5', borderRadius: 8, color: '#065F46', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} /> Tugas sudah dikumpulkan pada {formatDateShort(submission.submitted_at)}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="fileUrl">Tautan Berkas Tugas (Google Drive / OneDrive / Supabase URL)</label>
                <input
                  id="fileUrl"
                  type="url"
                  className="form-input"
                  placeholder="https://drive.google.com/..."
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes">Catatan Tambahan untuk Guru</label>
                <textarea
                  id="notes"
                  rows={4}
                  className="form-input"
                  placeholder="Tuliskan catatan atau penjelasan singkat tugas Anda..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {successMsg && (
                <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                  {successMsg}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                {submitting ? 'Mengirim...' : submission ? 'Perbarui Pengumpulan Tugas' : 'Kumpulkan Tugas'}
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
