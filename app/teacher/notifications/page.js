'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmptyState from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import { Bell, CheckCircle, ClipboardList, HelpCircle, Megaphone, Clock, CheckCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function TeacherNotificationsPage() {
  const { profile } = useProfile();
  const { notifications: dbNotifs, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [notifList, setNotifList] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    async function buildLiveTeacherNotifs() {
      const supabase = createClient();
      try {
        const [
          { data: submissions },
          { data: attempts },
          { data: announcements }
        ] = await Promise.all([
          supabase.from('assignment_submissions').select('*, assignments(title), profiles(full_name)').order('submitted_at', { ascending: false }).limit(5),
          supabase.from('quiz_attempts').select('*, quizzes(title), profiles(full_name)').order('completed_at', { ascending: false }).limit(5),
          supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3)
        ]);

        const generated = [];

        (submissions || []).forEach(sub => {
          generated.push({
            id: `sub-${sub.id}`,
            title: 'Pengumpulan Tugas Baru',
            message: `${sub.profiles?.full_name || 'Siswa'} telah mengumpulkan tugas "${sub.assignments?.title || 'Tugas'}".`,
            type: 'assignment',
            created_at: sub.submitted_at || sub.created_at || new Date().toISOString(),
            is_read: false,
            link: '/teacher/assignments'
          });
        });

        (attempts || []).forEach(att => {
          generated.push({
            id: `att-${att.id}`,
            title: 'Pengerjaan Kuis Selesai',
            message: `${att.profiles?.full_name || 'Siswa'} menyelesaikan kuis "${att.quizzes?.title || 'Kuis'}" dengan nilai ${att.score || 0}.`,
            type: 'quiz',
            created_at: att.completed_at || att.created_at || new Date().toISOString(),
            is_read: false,
            link: '/teacher/quizzes'
          });
        });

        (announcements || []).forEach(an => {
          generated.push({
            id: `t-ann-${an.id}`,
            title: `Pengumuman Diterbitkan: ${an.title}`,
            message: an.description || 'Pengumuman sekolah berhasil dipublikasikan ke siswa.',
            type: 'announcement',
            created_at: an.created_at || new Date().toISOString(),
            is_read: true,
            link: '/teacher/announcements'
          });
        });

        const merged = [...dbNotifs, ...generated].filter(
          (v, i, a) => a.findIndex(t => t.id === v.id) === i
        ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setNotifList(merged);
      } catch (err) {
        console.error(err);
      }
    }

    buildLiveTeacherNotifs();
  }, [dbNotifs]);

  const handleMarkItem = (id) => {
    setNotifList(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    markAsRead(id);
  };

  const handleReadAll = () => {
    setNotifList(prev => prev.map(n => ({ ...n, is_read: true })));
    markAllRead();
  };

  const filteredNotifs = notifList.filter(n => filter === 'UNREAD' ? !n.is_read : true);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'assignment': return <ClipboardList size={20} color="#2563EB" />;
      case 'quiz': return <HelpCircle size={20} color="#D97706" />;
      case 'announcement': return <Megaphone size={20} color="#059669" />;
      default: return <Bell size={20} color="var(--primary)" />;
    }
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={24} color="var(--primary)" /> Pusat Notifikasi Guru
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
            Pantau aktivitas pengumpulan tugas, pengerjaan kuis, dan informasi siswa secara real-time
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={handleReadAll} className="btn btn-outline btn-sm" style={{ gap: 6 }}>
            <CheckCheck size={16} /> Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setFilter('ALL')}
          className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Semua ({notifList.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`btn btn-sm ${filter === 'UNREAD' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Belum Dibaca ({notifList.filter(n => !n.is_read).length})
        </button>
      </div>

      {/* List Notifikasi */}
      {filteredNotifs.length === 0 ? (
        <EmptyState icon={Bell} title="Tidak Ada Notifikasi" description="Belum ada pemberitahuan aktivitas siswa terbaru." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredNotifs.map(n => (
            <div
              key={n.id}
              className="card card-padding"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                background: n.is_read ? 'var(--surface)' : 'var(--primary-light)',
                borderLeft: n.is_read ? '1px solid var(--border)' : '4px solid var(--primary)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>
                {getNotifIcon(n.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                  {n.message}
                </div>

                <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                  {n.link && (
                    <Link href={n.link} className="btn btn-primary btn-sm" style={{ fontSize: 12, padding: '3px 10px' }}>
                      Buka Fitur ➔
                    </Link>
                  )}
                  {!n.is_read && (
                    <button onClick={() => handleMarkItem(n.id)} className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Tandai Dibaca
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
