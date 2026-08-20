'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, ArrowLeft, CheckCircle2, Download, AlertCircle, Lightbulb
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StudyIllustration } from '@/components/ui/Illustrations';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { formatDateShort, openOrDownloadFile } from '@/lib/utils';

export default function MaterialViewerPage() {
  const params = useParams();
  const materialId = params.id;
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [material, setMaterial] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!profile || !materialId) return;
    fetchMaterial();
  }, [profile, materialId]);

  async function fetchMaterial() {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data: mat } = await supabase
        .from('materials')
        .select('*, subjects(id, name)')
        .eq('id', materialId)
        .single();

      if (mat) {
        setMaterial(mat);

        // Check completion
        const { data: prog } = await supabase
          .from('material_progress')
          .select('status')
          .eq('student_id', profile.id)
          .eq('material_id', materialId)
          .maybeSingle();

        if (prog?.status === 'completed') {
          setIsCompleted(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleComplete() {
    if (!profile || !material) return;
    const supabase = createClient();
    setUpdating(true);
    try {
      const nextState = !isCompleted;

      await supabase.from('material_progress').upsert({
        student_id: profile.id,
        material_id: material.id,
        status: nextState ? 'completed' : 'in_progress',
        progress_percentage: nextState ? 100 : 50,
        completed_at: nextState ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id,material_id' });

      setIsCompleted(nextState);

      // Recalculate subject progress
      if (material.subject_id) {
        const [{ count: totalMat }, { count: completedMat }] = await Promise.all([
          supabase.from('materials').select('*', { count: 'exact', head: true }).eq('subject_id', material.subject_id),
          supabase.from('material_progress').select('*', { count: 'exact', head: true }).eq('student_id', profile.id).eq('status', 'completed')
        ]);

        const pct = totalMat > 0 ? Math.round(((completedMat || 0) / totalMat) * 100) : 0;

        await supabase.from('student_progress').upsert({
          student_id: profile.id,
          subject_id: material.subject_id,
          progress_percentage: Math.min(100, pct),
          completed_materials: completedMat || 0,
          total_materials: totalMat || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,subject_id' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout profile={profile} unreadCount={unreadCount}>
        <div className="skeleton" style={{ height: 24, width: 240, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </DashboardLayout>
    );
  }

  if (!material) {
    return (
      <DashboardLayout profile={profile} unreadCount={unreadCount}>
        <div className="card card-padding" style={{ textAlign: 'center', padding: 48 }}>
          <AlertCircle size={48} color="var(--error)" style={{ margin: '0 auto 16px' }} />
          <h2>Materi Tidak Ditemukan</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Materi ini mungkin telah dihapus atau tidak tersedia.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      {/* Back button */}
      <Link
        href={material.subject_id ? `/student/subjects/${material.subject_id}` : '/student/subjects'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Kembali ke {material.subjects?.name || 'Mata Pelajaran'}
      </Link>

      <div className="card card-padding" style={{ marginBottom: 24, borderRadius: 16 }}>
        {/* Header info */}
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <span className="badge badge-primary" style={{ textTransform: 'uppercase', padding: '6px 14px' }}>
              {material.content_type === 'article_website' ? '🌐 Artikel / Website' : `📄 ${material.content_type}`}
            </span>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Dipublikasikan: {formatDateShort(material.created_at)}
            </div>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            {material.title}
          </h1>
          {material.description && (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {material.description}
            </p>
          )}
        </div>

        {/* 2-Column Content Layout (Text + Teacher Infographic Card) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginBottom: 32 }} className="landing-grid-responsive">
          {/* Main Text Content & File */}
          <div style={{ minHeight: 200, lineHeight: 1.8, fontSize: 15, color: 'var(--text-primary)' }}>
            {material.content ? (
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: '#F8FAFC', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                {material.content}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 20 }}>
                {material.content_type === 'article_website'
                  ? 'Materi ini berupa Tautan Artikel / Website Eksternal. Silakan klik tombol di bawah untuk membukanya.'
                  : 'Materi ini berbentuk lampiran berkas. Silakan lihat atau unduh berkas di bawah ini.'}
              </p>
            )}

            {/* Downloadable / Embed File / External Website Link */}
            {material.file_url && (
              <div style={{ padding: 18, background: '#EFF6FF', borderRadius: 12, border: '1.5px solid #BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1E4ED8' }}>
                        {material.content_type === 'article_website' ? 'Tautan Artikel / Website Materi' : 'Lampiran Berkas Dokumen'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {material.content_type === 'article_website' ? 'Klik tombol untuk membaca artikel selengkapnya' : 'Klik untuk mengunduh / membaca dokumen materi PDF'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openOrDownloadFile(material.file_url, material.title)}
                    className="btn btn-primary btn-sm"
                    style={{ gap: 6, fontWeight: 700 }}
                  >
                    <Download size={15} /> {material.content_type === 'article_website' ? 'Buka Artikel' : 'Unduh Dokumen'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Teacher Infographic & Study Tips Card */}
          <div style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', borderRadius: 16, padding: 20, border: '1px solid #BAE6FD', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ marginBottom: 10 }}>
              <StudyIllustration width={200} height={170} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#0369A1', marginBottom: 6 }}>
              <Lightbulb size={16} color="#D97706" /> Tips Belajar Efektif
            </div>

            <p style={{ fontSize: 12, color: '#0C4A6E', lineHeight: 1.5, marginBottom: 14 }}>
              Pahami poin utama materi ini sebelum melanjutkan ke kuis atau tugas. Tandai selesai jika sudah siap!
            </p>

            {isCompleted && (
              <div style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Modul Selesai Dibaca
              </div>
            )}
          </div>
        </div>

        {/* Completion Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid var(--border)', paddingTop: 20, flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {isCompleted ? (
              <span style={{ color: 'var(--success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Modul ini telah ditandai selesai.
              </span>
            ) : (
              'Sudah selesai membaca materi ini?'
            )}
          </div>

          <button
            onClick={handleToggleComplete}
            disabled={updating}
            className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
            style={{ gap: 8 }}
          >
            <CheckCircle2 size={18} />
            {updating ? 'Memproses...' : isCompleted ? 'Batalkan Tandai Selesai' : 'Tandai Selesai Dibaca'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
