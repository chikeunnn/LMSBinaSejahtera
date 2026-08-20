'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, Calendar } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

export default function StudentAnnouncementsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchAnnouncements();
  }, [profile]);

  async function fetchAnnouncements() {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*, classes(name), profiles(full_name)')
        .order('created_at', { ascending: false });

      setAnnouncements(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Papan Pengumuman Sekolah</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Informasi dan kabar terbaru dari sekolah serta bapak/ibu guru pengajar
        </p>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      ) : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="Belum Ada Pengumuman" description="Saat ini belum ada pengumuman terbaru." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {announcements.map(ann => {
            const isUrgent = ann.priority === 'urgent';
            const isImportant = ann.priority === 'important';

            return (
              <div
                key={ann.id}
                className="card card-padding"
                style={{
                  borderLeft: isUrgent ? '4px solid #EF4444' : isImportant ? '4px solid #F59E0B' : '4px solid var(--primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    className={`badge ${isUrgent ? 'badge-error' : isImportant ? 'badge-warning' : 'badge-primary'}`}
                    style={{ fontSize: 11 }}
                  >
                    {isUrgent ? '🔴 MENDESAK' : isImportant ? '🟡 PENTING' : '🔵 INFORMASI'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> {formatDateShort(ann.created_at)}
                  </span>
                  {ann.classes?.name && (
                    <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                      🏫 {ann.classes.name}
                    </span>
                  )}
                  {ann.profiles?.full_name && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      Oleh: {ann.profiles.full_name}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{ann.title}</h3>

                <div style={{
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: 'var(--bg-main)',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)'
                }}>
                  {ann.description}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
