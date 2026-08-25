'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen, LayoutDashboard, BookMarked, FileText,
  HelpCircle, ClipboardList, TrendingUp, Megaphone,
  MessageCircle, User, LogOut, X, PanelLeftClose, PanelLeft,
  Users, Video, Settings, FileBarChart, GraduationCap, Bell,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import HeaderLogos from '@/components/ui/HeaderLogos';

// Nav items per role
const NAV_ITEMS = {
  student: [
    { href: '/student/dashboard', icon: LayoutDashboard, label: 'Beranda' },
    { href: '/student/subjects', icon: BookMarked, label: 'Mata Pelajaran' },
    { href: '/student/materials', icon: FileText, label: 'Materi' },
    { href: '/student/videos', icon: Video, label: 'Video Pembelajaran' },
    { href: '/student/quizzes', icon: HelpCircle, label: 'Kuis' },
    { href: '/student/assignments', icon: ClipboardList, label: 'Tugas' },
    { href: '/student/progress', icon: TrendingUp, label: 'Progress Belajar' },
    { href: '/student/announcements', icon: Megaphone, label: 'Pengumuman' },
    { href: '/student/profile', icon: User, label: 'Profil' },
  ],
  teacher: [
    { href: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/teacher/classes', icon: BookOpen, label: 'Kelola Kelas' },
    { href: '/teacher/subjects', icon: BookMarked, label: 'Mata Pelajaran' },
    { href: '/teacher/materials', icon: FileText, label: 'Materi' },
    { href: '/teacher/videos', icon: Video, label: 'Video' },
    { href: '/teacher/quizzes', icon: HelpCircle, label: 'Kuis' },
    { href: '/teacher/assignments', icon: ClipboardList, label: 'Tugas' },
    { href: '/teacher/students', icon: Users, label: 'Siswa' },
    { href: '/teacher/progress', icon: TrendingUp, label: 'Progress' },
    { href: '/teacher/announcements', icon: Megaphone, label: 'Pengumuman' },
    { href: '/teacher/profile', icon: User, label: 'Profil' },
  ],
  admin: [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/students', icon: GraduationCap, label: 'Siswa' },
    { href: '/admin/teachers', icon: User, label: 'Guru' },
    { href: '/admin/classes', icon: BookOpen, label: 'Kelas' },
    { href: '/admin/subjects', icon: BookMarked, label: 'Mata Pelajaran' },
    { href: '/admin/content', icon: FileText, label: 'Konten' },
    { href: '/admin/announcements', icon: Megaphone, label: 'Pengumuman' },
    { href: '/admin/logs', icon: FileBarChart, label: 'Activity Logs' },
    { href: '/admin/settings', icon: Settings, label: 'Pengaturan' },
  ],
};

const ROLE_LABELS = { student: 'Siswa', teacher: 'Guru', admin: 'Admin' };

export default function Sidebar({ role, open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = NAV_ITEMS[role] || [];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className={`app-sidebar ${open ? 'open' : ''}`}>
      {/* Logo Header */}
      <div className="sidebar-logo" style={{ height: 'var(--topbar-height)', padding: '0 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(37,99,235,0.25)', flexShrink: 0
          }}>
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <div className="sidebar-logo-text" style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2 }}>LMS Bina Sejahtera</div>
            <div className="sidebar-logo-sub" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{ROLE_LABELS[role]} Portal</div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: '#F1F5F9', border: '1px solid #CBD5E1',
            borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 6, transition: 'all 0.15s', flexShrink: 0
          }}
          title="Tutup Menu Sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* Nav Items (Stay open even when clicked or when main screen is clicked) */}
      <nav className="sidebar-nav" aria-label="Navigasi utama">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon size={18} className="icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
