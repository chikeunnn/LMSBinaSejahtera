'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { BookMarked, Search, Key, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { debounce, getSubjectGraphic } from '@/lib/utils';

export default function StudentSubjectsPage() {
  const { profile, refreshProfile } = useProfile();
  const { unreadCount } = useNotifications();

  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal join class state
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const searchRef = useRef(debounce((val) => setSearch(val), 300));

  useEffect(() => {
    if (!profile) return;
    fetchSubjects();
    fetchClasses();
  }, [profile]);

  async function fetchClasses() {
    const supabase = createClient();
    try {
      const { data } = await supabase.from('classes').select('id, name, code').order('name', { ascending: true });
      setClasses(data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchSubjects() {
    const supabase = createClient();
    setLoading(true);
    try {
      let query = supabase.from('subjects').select('*, profiles(full_name)');
      
      if (profile.class_id) {
        query = query.eq('class_id', profile.class_id);
      }

      let { data } = await query.order('name', { ascending: true });

      if (!data || data.length === 0) {
        const { data: fallbackData } = await supabase
          .from('subjects')
          .select('*, profiles(full_name)')
          .order('name', { ascending: true });
        data = fallbackData || [];
      }

      setSubjects(data || []);
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

        const { data: matchedClass } = await supabase
          .from('classes')
          .select('id, name')
          .ilike('code', cleanCode)
          .maybeSingle();

        if (matchedClass) {
          targetClassId = matchedClass.id;
          matchedName = matchedClass.name;
        } else {
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

      const { error: updateErr } = await supabase.from('profiles').update({
        class_id: targetClassId,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);

      if (updateErr) throw updateErr;

      setJoinSuccess(`Berhasil bergabung dengan ${matchedName || 'Kelas Pembelajaran'}!`);
      
      setTimeout(() => {
        setJoinModalOpen(false);
        if (refreshProfile) refreshProfile();
        fetchSubjects();
      }, 1200);

    } catch (err) {
      console.error(err);
      setJoinError('Gagal bergabung ke kelas: ' + err.message);
    } finally {
      setJoining(false);
    }
  };

  const filtered = subjects.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeClassName = profile?.classes?.name || classes.find(c => String(c.id) === String(profile?.class_id))?.name;

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Mata Pelajaran Kelas Saya</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            {activeClassName ? `Menampilkan mata pelajaran resmi untuk ${activeClassName}` : `${subjects.length} mata pelajaran tersedia`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setJoinError(''); setJoinSuccess(''); setJoinModalOpen(true); }}
            className="btn btn-outline btn-sm"
            style={{ gap: 6 }}
          >
            <Key size={15} /> Gabung / Ubah Kode Kelas
          </button>

          <div className="input-wrapper" style={{ maxWidth: 260, width: '100%' }}>
            <Search size={16} className="input-icon" />
            <input
              type="search" className="form-input input-with-icon"
              placeholder="Cari mata pelajaran..."
              onChange={e => searchRef.current(e.target.value)}
              aria-label="Cari mata pelajaran"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookMarked} title="Tidak Ada Mata Pelajaran" description="Belum ada mata pelajaran untuk kelas Anda." />
      ) : (
        <div className="grid grid-3">
          {filtered.map((sub) => {
            const graphic = getSubjectGraphic(sub.name);
            return (
              <Link href={`/student/subjects/${sub.id}`} key={sub.id}>
                <div className="card card-hover" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: graphic.gradient, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}>
                      {graphic.icon}
                    </div>
                    <div>
                      <div className="badge" style={{ background: graphic.bg, color: graphic.color, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                        {graphic.badge}
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>{sub.name}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {sub.description || `Materi lengkap, video tutorial, dan kuis terstruktur untuk kelas ${activeClassName || 'Bina Sejahtera'}.`}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {sub.profiles?.full_name ? `Guru: ${sub.profiles.full_name}` : 'Mata Pelajaran Resmi'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Buka Pelajaran <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal Join Class */}
      <Modal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="🔑 Gabung Ke Kelas Pembelajaran">
        <form onSubmit={handleJoinClass} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <label className="form-label">Atau Pilih Dari Daftar Kelas Sekolah:</label>
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
