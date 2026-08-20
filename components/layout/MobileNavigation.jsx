'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookMarked, ClipboardList, TrendingUp, User,
  LayoutGrid, FileText, HelpCircle, Users,
} from 'lucide-react';

const MOBILE_NAV = {
  student: [
    { href: '/student/dashboard', icon: LayoutDashboard, label: 'Beranda' },
    { href: '/student/subjects', icon: BookMarked, label: 'Pelajaran' },
    { href: '/student/assignments', icon: ClipboardList, label: 'Tugas' },
    { href: '/student/progress', icon: TrendingUp, label: 'Progress' },
    { href: '/student/profile', icon: User, label: 'Profil' },
  ],
  teacher: [
    { href: '/teacher/dashboard', icon: LayoutDashboard, label: 'Beranda' },
    { href: '/teacher/subjects', icon: BookMarked, label: 'Pelajaran' },
    { href: '/teacher/assignments', icon: ClipboardList, label: 'Tugas' },
    { href: '/teacher/students', icon: Users, label: 'Siswa' },
    { href: '/teacher/profile', icon: User, label: 'Profil' },
  ],
  admin: [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/subjects', icon: BookMarked, label: 'Pelajaran' },
    { href: '/admin/content', icon: FileText, label: 'Konten' },
    { href: '/admin/settings', icon: LayoutGrid, label: 'Lainnya' },
  ],
};

export default function MobileNavigation({ role }) {
  const pathname = usePathname();
  const items = MOBILE_NAV[role] || [];

  return (
    <nav className="mobile-nav" aria-label="Navigasi mobile">
      <div className="mobile-nav-inner">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <div className={`mobile-nav-item ${isActive ? 'active' : ''}`} aria-current={isActive ? 'page' : undefined}>
                <item.icon size={22} className="icon" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
