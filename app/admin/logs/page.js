'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { FileBarChart, RefreshCw, Clock } from 'lucide-react';

export default function AdminActivityLogsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchLogs();
  }, [profile]);

  async function fetchLogs() {
    const supabase = createClient();
    setLoading(true);
    try {
      const { data } = await supabase
        .from('activity_logs')
        .select('*, profiles(full_name, role, email)')
        .order('created_at', { ascending: false })
        .limit(50);

      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = logs.filter(l =>
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.profiles?.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Activity Logs & Monitoring Sistem</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Catatan log aktivitas real-time dari seluruh aktivitas siswa, guru, dan admin
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn btn-outline btn-sm" style={{ gap: 6 }}>
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      <div className="card card-padding" style={{ marginBottom: 20 }}>
        <div style={{ maxWidth: 360 }}>
          <SearchInput placeholder="Cari aksi, deskripsi, atau nama user..." value={search} onChange={setSearch} />
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      ) : filteredLogs.length === 0 ? (
        <EmptyState icon={FileBarChart} title="Belum Ada Log Aktivitas" description="Aktivitas sistem akan dicatat di sini secara otomatis." />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Waktu</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Pengguna</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Peran</th>
                  <th style={{ padding: '14px 20px', fontWeight: 600 }}>Aksi Log</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} />
                        {new Date(l.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {l.profiles?.full_name || l.profiles?.email || 'System'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge" style={{
                        background: l.profiles?.role === 'admin' ? '#FEF2F2' : l.profiles?.role === 'teacher' ? '#EDE9FE' : '#EFF6FF',
                        color: l.profiles?.role === 'admin' ? '#DC2626' : l.profiles?.role === 'teacher' ? '#7C3AED' : '#2563EB',
                        fontSize: 11, fontWeight: 700, textTransform: 'capitalize'
                      }}>
                        {l.profiles?.role || 'System'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.action}</div>
                      {l.details && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{l.details}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
