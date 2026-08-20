'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { FileText, Search, BookMarked, ArrowRight, Clock, FileDown, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { debounce, formatDateShort } from '@/lib/utils';

export default function StudentMaterialsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchRef = useRef(debounce((val) => setSearch(val), 300));

  useEffect(() => {
    if (!profile) return;
    fetchMaterials();
  }, [profile]);

  async function fetchMaterials() {
    const supabase = createClient();
    setLoading(true);
    try {
      let { data } = await supabase
        .from('materials')
        .select('*, subjects(name)')
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) {
        const { data: rawData } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
        data = rawData || [];
      }

      setMaterials(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    (m.description && m.description.toLowerCase().includes(search.toLowerCase())) ||
    (m.subjects?.name && m.subjects.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Materi Pembelajaran</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Pelajari modul, dokumen, dan bahan ajar yang diunggah oleh guru Anda
          </p>
        </div>

        <div className="input-wrapper" style={{ maxWidth: 300, width: '100%' }}>
          <Search size={16} className="input-icon" />
          <input
            type="search"
            className="form-input input-with-icon"
            placeholder="Cari materi..."
            onChange={e => searchRef.current(e.target.value)}
            aria-label="Cari materi"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card card-padding">
              <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 14 }} />
              <div className="skeleton" style={{ height: 36, width: '100%', borderRadius: 10 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search ? 'Materi tidak ditemukan' : 'Belum ada materi pembelajaran'}
          description={search ? `Tidak ada materi dengan kata kunci "${search}"` : 'Materi yang diunggah oleh guru akan tampil di sini.'}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(m => (
            <div key={m.id} className="card card-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="badge badge-primary" style={{ fontSize: 11 }}>
                    📘 {m.subjects?.name || 'Mata Pelajaran'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> {formatDateShort(m.created_at)}
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {m.title}
                </h3>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                  {m.description || 'Klik tombol di bawah untuk melihat isi materi lengkap.'}
                </p>
              </div>

              <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                <Link href={`/student/materials/${m.id}`} style={{ flex: 1 }}>
                  <button className="btn btn-primary btn-full btn-sm" style={{ gap: 6, fontSize: 13 }}>
                    <FileText size={15} /> Baca Materi <ArrowRight size={14} />
                  </button>
                </Link>
                {m.file_url && (
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                    <button className="btn btn-outline btn-sm" title="Unduh Berkas" style={{ padding: '8px 12px' }}>
                      <FileDown size={16} />
                    </button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
