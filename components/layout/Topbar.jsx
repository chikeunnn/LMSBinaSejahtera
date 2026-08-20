'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';

export default function Topbar({ profile: propProfile, unreadCount = 0, onMenuClick }) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { profile: hookProfile } = useProfile();

  const profile = propProfile || hookProfile;
  const role = profile?.role || 'student';
  const notifHref = `/${role}/notifications`;
  const profileHref = `/${role}/profile`;

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_admin_login');
      document.cookie = 'lms_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="app-topbar">
      {/* Hamburger / Sidebar toggle button */}
      <button
        onClick={onMenuClick}
        aria-label="Toggle Navigation Sidebar"
        title="Buka / Tutup Sidebar Navigasi"
        style={{
          background: '#F8FAFC', border: '1px solid var(--border)', cursor: 'pointer',
          color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '8px', borderRadius: 'var(--radius-md)', transition: 'all 0.15s'
        }}
      >
        <Menu size={20} />
      </button>

      <div style={{ flex: 1 }} />

      {/* Notification Button */}
      <Link href={notifHref}>
        <button className="notif-badge" aria-label={`${unreadCount} notifikasi belum dibaca`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', display: 'flex', position: 'relative' }}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notif-dot" style={{
              position: 'absolute', top: 4, right: 4, background: '#EF4444', color: '#fff',
              borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Link>

      {/* Profile dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 'var(--radius-md)', transition: 'background var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          aria-label="Menu profil"
          aria-expanded={dropdownOpen}
        >
          <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.email} size="sm" />
          <div style={{ textAlign: 'left', display: 'none' }} className="desktop-only">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{profile?.full_name || 'Pengguna'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{profile?.role === 'teacher' ? 'Guru' : profile?.role === 'admin' ? 'Admin' : 'Siswa'}</div>
          </div>
          <ChevronDown size={14} color="var(--text-muted)" />
        </button>

        {dropdownOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setDropdownOpen(false)} />
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-elevated)', minWidth: 200, zIndex: 50, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{profile?.full_name || 'Pengguna'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{profile?.email}</div>
              </div>
              <Link href={profileHref} onClick={() => setDropdownOpen(false)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', transition: 'background var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <User size={15} /> Profil Saya
                </div>
              </Link>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: 'var(--error)', cursor: 'pointer', background: 'none', border: 'none', width: '100%', transition: 'background var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--error-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <LogOut size={15} /> Keluar
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
