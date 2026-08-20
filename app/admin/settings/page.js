'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { Settings, Save, CheckCircle, ShieldCheck, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [settings, setSettings] = useState({
    school_name: 'SMP Bina Sejahtera',
    academic_year: '2026/2027',
    semester: 'Ganjil',
    allow_registration: true,
    enable_notifications: true
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Pengaturan Sistem</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Konfigurasi identitas sekolah dan opsi platform LMS
        </p>
      </div>

      <div className="card card-padding" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {saved && (
            <div style={{ padding: '12px 16px', background: '#D1FAE5', borderRadius: 10, color: '#065F46', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} /> Pengaturan berhasil disimpan!
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="school_name">Nama Sekolah / Instansi</label>
            <input
              id="school_name"
              type="text"
              className="form-input"
              value={settings.school_name}
              onChange={e => setSettings({ ...settings, school_name: e.target.value })}
            />
          </div>

          <div className="grid grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="acad_yr">Tahun Ajaran Aktif</label>
              <input
                id="acad_yr"
                type="text"
                className="form-input"
                value={settings.academic_year}
                onChange={e => setSettings({ ...settings, academic_year: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sem">Semester Aktif</label>
              <select
                id="sem"
                className="form-input"
                value={settings.semester}
                onChange={e => setSettings({ ...settings, semester: e.target.value })}
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Fitur & Keamanan</div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={settings.allow_registration}
                onChange={e => setSettings({ ...settings, allow_registration: e.target.checked })}
              />
              Izinkan siswa membuat akun mandiri via registrasi
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={settings.enable_notifications}
                onChange={e => setSettings({ ...settings, enable_notifications: e.target.checked })}
              />
              Aktifkan sistem notifikasi pengumuman sekolah
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ gap: 8, marginTop: 10, alignSelf: 'flex-start' }}>
            <Save size={18} /> Simpan Pengaturan
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
