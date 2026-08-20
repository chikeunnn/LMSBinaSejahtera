'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookMarked, ChevronRight, ArrowRight, Megaphone, Key
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import { CircularProgress, ProgressBar } from '@/components/ui/Progress';
import Modal from '@/components/ui/Modal';
import { HeroIllustration } from '@/components/ui/Illustrations';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { formatDateShort, getSubjectGraphic } from '@/lib/utils';

export default function StudentDashboardPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [activeClass, setActiveClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal Join Class
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  useEffect(() => {
    if (!profile) return;
    fetchDashboardData();
  }, [profile]);

  async function fetchDashboardData() {
    const supabase = createClient();
    setLoading(true);
    try {
      // 1. Fetch available classes list for fallback selection
      const { data: classList } = await supabase.from('classes').select('id, name, code').order('name', { ascending: true });
      setClasses(classList || []);

      // 2. Fetch student's profile class info
      let activeClassData = null;
      if (profile.class_id) {
        const { data: cData } = await supabase.from('classes').select('*').eq('id', profile.class_id).single();
        activeClassData = cData || null;
      }
      setActiveClass(activeClassData);

      // 3. Fetch subjects according to class or fallback
      let subQuery = supabase.from('subjects').select('*, profiles(full_name)');
      if (profile.class_id) {
        subQuery = subQuery.eq('class_id', profile.class_id);
      }
      const { data: subData } = await subQuery.order('name', { ascending: true });
      
      let finalSubjects = subData || [];
      if (finalSubjects.length === 0) {
        const { data: allSubs } = await supabase.from('subjects').select('*, profiles(full_name)').order('name', { ascending: true });
        finalSubjects = allSubs || [];
      }
      setSubjects(finalSubjects);

      // 4. Fetch announcements
      const { data: annData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3);
      setAnnouncements(annData || []);

      // 5. Fetch recent progress / activities
      const { data: progData } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', profile.id);

      if (progData && progData.length > 0) {
        const total = progData.reduce((acc, p) => acc + (p.progress_percentage || 0), 0);
        setOverallProgress(Math.round(total / progData.length));
      } else {
        setOverallProgress(0);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setJoining(true);
    setJoinError('');
    setJoinSuccess('');

    const supabase = createClient();
    try {
      let targetClassId = null;
      let matchedName = '';

      if (classCodeInput.trim()) {
        const cleanCode = classCodeInput.trim().toUpperCase();
        
        // Match by class code
        const { data: matchedClass } = await supabase
          .from('classes')
          .select('id, name')
          .ilike('code', cleanCode)
          .maybeSingle();

        if (matchedClass) {
          targetClassId = matchedClass.id;
          matchedName = matchedClass.name;
        } else {
          // Match by subject code or name
          const { data: matchedSubject } = await supabase
            .from('subjects')
            .select('id, name, class_id')
            .or(`code.ilike.${cleanCode},name.ilike.${cleanCode}`)
            .maybeSingle();

          if (matchedSubject && matchedSubject.class_id) {
            targetClassId = matchedSubject.class_id;
            matchedName = matchedSubject.name;
          }
        }
      } else if (selectedClassId) {
        const clsObj = classes.find(c => String(c.id) === String(selectedClassId));
        targetClassId = selectedClassId;
        matchedName = clsObj?.name || 'Kelas Terpilih';
      }

      if (!targetClassId) {
        setJoinError('Kode Kelas / Kode Mapel tidak ditemukan. Pastikan memasukkan kode resmi dari guru.');
        setJoining(false);
        return;
      }

      // Update student profile class_id
      const { error: updateErr } = await supabase.from('profiles').update({
        class_id: targetClassId,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);

      if (updateErr) throw updateErr;

      setJoinSuccess(`Berhasil bergabung ke ${matchedName}! Memperbarui halaman...`);
      setTimeout(() => {
        setJoinModalOpen(false);
        window.location.reload();
      }, 1200);

    } catch (err) {
      console.error(err);
      setJoinError('Gagal memperbarui kelas: ' + err.message);
    } finally {
      setJoining(false);
    }
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Siswa';
  const activeClassName = activeClass?.name || profile?.class_name || null;

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      {/* Header welcome */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            Hallo, {firstName} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            {activeClassName ? (
              <span className="badge badge-primary" style={{ fontSize: 12 }}>
                🏫 Kelas Terdaftar: {activeClassName}
              </span>
            ) : (
              <span style={{ color: 'var(--error)', fontWeight: 600 }}>
                ⚠️ Belum terdaftar di kelas manapun
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => { setJoinError(''); setJoinSuccess(''); setJoinModalOpen(true); }}
          className="btn btn-primary btn-sm"
          style={{ gap: 6 }}
        >
          <Key size={15} /> {activeClassName ? 'Ubah Kelas / Kode' : '🔑 Gabung Kelas Pakai Kode'}
        </button>
      </div>

      {/* Hero + Progress Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, marginBottom: 28 }} className="hero-progress-grid">
        {/* Hero Banner with Illustration */}
        <div className="hero-banner" style={{ minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, overflow: 'hidden', position: 'relative', borderRadius: 16, padding: '24px 28px', background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)' }}>
          <div style={{ flex: 1, zIndex: 2 }}>
            <div className="badge badge-glass" style={{ marginBottom: 12 }}>
              🎓 Belajar Menjadi Lebih Menyenangkan
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8, lineHeight: 1.3 }}>
              Akses Materi, Video, dan Kuis Kapan Saja di Mana Saja
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 18, maxWidth: 440, lineHeight: 1.5 }}>
              Mata pelajaran dan tugas disesuaikan khusus untuk tingkat kelas Anda ({activeClassName || 'Bina Sejahtera'}).
            </p>
            <Link href="/student/subjects">
              <button className="btn btn-primary" style={{ background: '#FFFFFF', color: '#1D4ED8', border: 'none', fontWeight: 800, gap: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                Mulai Belajar <ArrowRight size={16} />
              </button>
            </Link>
          </div>
          <div style={{ zIndex: 1, flexShrink: 0, marginTop: -15, marginBottom: -15, marginRight: -10 }} className="desktop-only">
            <HeroIllustration width={250} height={200} />
          </div>
        </div>

        {/* Circular Progress Card */}
        <div className="card card-padding" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', borderRadius: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Progress Belajar</div>
          <CircularProgress value={overallProgress} size={84} />
          <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#DCFCE7', padding: '4px 10px', borderRadius: 12 }}>
            {overallProgress >= 70 ? '🏆 Kamu Hebat!' : overallProgress >= 40 ? '⚡ Terus Tingkatkan' : '📖 Ayo Mulai'}
          </div>
          <Link href="/student/progress" style={{ width: '100%' }}>
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>Lihat Detail</button>
          </Link>
        </div>
      </div>

      {/* Mata Pelajaran Saya Grid */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Mata Pelajaran Saya ({subjects.length})</h2>
          <Link href="/student/subjects" className="section-link" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Lihat Semua <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-3">{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}</div>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="Mata Pelajaran Belum Tersedia"
            description="Silakan klik 'Gabung Kelas Pakai Kode' di atas untuk memastikan mata pelajaran kelas Anda dapat dimuat."
          />
        ) : (
          <div className="grid grid-3">
            {subjects.slice(0, 6).map((sub) => {
              const graphic = getSubjectGraphic(sub.name);
              return (
                <Link href={`/student/subjects/${sub.id}`} key={sub.id}>
                  <div className="card card-hover" style={{ padding: 18, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14, height: '100%', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: graphic.gradient, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {graphic.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{sub.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                          {sub.profiles?.full_name ? `Guru: ${sub.profiles.full_name}` : 'Mata Pelajaran Resmi'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        <span>Progress Modul</span>
                        <span>50%</span>
                      </div>
                      <ProgressBar value={50} color={graphic.color} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Pengumuman & Info Sekolah */}
      {announcements.length > 0 && (
        <div className="card card-padding" style={{ marginBottom: 28, borderRadius: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={18} color="var(--primary)" /> Pengumuman Sekolah Terbaru
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.map(ann => (
              <div key={ann.id} style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{ann.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ann.content}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>📅 {formatDateShort(ann.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Join Class */}
      <Modal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="🔑 Gabung Ke Kelas Pembelajaran">
        <form onSubmit={handleJoinClass} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            Setiap kelas / mata pelajaran memiliki <strong>Kode Unik Guru</strong> (misal: <code>K7-2026</code>, <code>K8-2026</code>, <code>MTK-7A</code>). Masukkan kode tersebut atau pilih kelas dari daftar di bawah.
          </div>

          {joinError && (
            <div style={{ padding: 10, borderRadius: 8, background: '#FEF2F2', color: '#DC2626', fontSize: 13 }}>
              {joinError}
            </div>
          )}

          {joinSuccess && (
            <div style={{ padding: 10, borderRadius: 8, background: '#F0FDF4', color: '#166534', fontSize: 13, fontWeight: 600 }}>
              {joinSuccess}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Masukkan Kode Kelas / Kode Mapel:</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: K7-2026 atau MTK-7A"
              value={classCodeInput}
              onChange={e => setClassCodeInput(e.target.value)}
              style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
            />
          </div>

          {classes.length > 0 && (
            <div className="form-group">
              <label className="form-label">Atau Pilih Kelas Dari Daftar Sekolah:</label>
              <select
                className="form-input"
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
              >
                <option value="">-- Pilih Kelas Sekolah --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.code ? `(${c.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setJoinModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={joining}>
              {joining ? 'Memproses...' : 'Gabung Kelas Sekarang'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
