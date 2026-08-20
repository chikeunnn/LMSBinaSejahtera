'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import { useProfile } from '@/hooks/useProfile';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/lib/supabase/client';
import {
  User, Save, CheckCircle, Lock, Camera, AlertCircle, KeyRound, ShieldCheck,
  GraduationCap, Award, Sliders, RotateCcw, ZoomIn, ZoomOut, Move, ArrowUpDown, ArrowLeftRight
} from 'lucide-react';

export default function ProfileView() {
  const { profile, refetch } = useProfile();
  const { unreadCount } = useNotifications();

  const [fullName, setFullName] = useState('');
  const [nisNip, setNisNip] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [rawImage, setRawImage] = useState(null);

  // Manual Photo Adjuster Controls
  const [showAdjuster, setShowAdjuster] = useState(false);
  const [offsetY, setOffsetY] = useState(0); // -50 to +50 (% vertical shift)
  const [offsetX, setOffsetX] = useState(0); // -50 to +50 (% horizontal shift)
  const [photoZoom, setPhotoZoom] = useState(1.0); // 1.0 to 2.5 (Zoom scale)

  // Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status States
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setNisNip(profile.nis || profile.nip || '');
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem(`lms_avatar_${profile.id}`) : null;
      setAvatarUrl(profile.avatar_url || savedLocal || '');
    }
  }, [profile]);

  // Function to process & crop canvas with manual X/Y offsets and zoom
  const processCroppedImage = (imgSrc, shiftX, shiftY, zoom) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 300; // 300x300 optimized square avatar
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Fill background white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        // Aspect ratio fitting logic
        const imgAspect = img.width / img.height;
        let renderW, renderH, baseOffsetX, baseOffsetY;

        if (imgAspect > 1) {
          renderH = size * zoom;
          renderW = size * imgAspect * zoom;
        } else {
          renderW = size * zoom;
          renderH = (size / imgAspect) * zoom;
        }

        // Center position + manual offsets
        baseOffsetX = (size - renderW) / 2 + (shiftX / 100) * (size / 2);
        baseOffsetY = (size - renderH) / 2 + (shiftY / 100) * (size / 2);

        ctx.drawImage(img, baseOffsetX, baseOffsetY, renderW, renderH);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = imgSrc;
    });
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Ukuran foto maksimal 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setRawImage(reader.result);
      setShowAdjuster(true);
      setOffsetX(0);
      setOffsetY(0);
      setPhotoZoom(1.0);
      const cropped = await processCroppedImage(reader.result, 0, 0, 1.0);
      setAvatarUrl(cropped);
      setProfileMsg({ type: 'success', text: 'Foto dipilih. Geser slider manual di bawah agar posisi foto pas, lalu klik Simpan.' });
    };
    reader.readAsDataURL(file);
  };

  // Update Cropped Image when sliders change
  const applyManualAdjustment = async (newX, newY, newZoom) => {
    setOffsetX(newX);
    setOffsetY(newY);
    setPhotoZoom(newZoom);

    const baseImg = rawImage || avatarUrl;
    if (baseImg) {
      const cropped = await processCroppedImage(baseImg, newX, newY, newZoom);
      setAvatarUrl(cropped);
    }
  };

  const handleResetAdjustments = () => {
    applyManualAdjustment(0, 0, 1.0);
  };

  // Handle Save Profile Info
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    const supabase = createClient();

    try {
      // 1. Save to local storage for instant persistent caching
      if (typeof window !== 'undefined' && profile?.id && avatarUrl) {
        localStorage.setItem(`lms_avatar_${profile.id}`, avatarUrl);
      }

      const updatePayload = {
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };

      if (profile.role === 'teacher') {
        updatePayload.nip = nisNip.trim();
      } else {
        updatePayload.nis = nisNip.trim();
      }

      // 2. Save to Supabase DB
      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', profile.id);

      if (error) {
        console.warn('Supabase DB save note:', error.message);
      }

      setProfileMsg({ type: 'success', text: 'Profil & foto berhasil diperbarui!' });
      setShowAdjuster(false);
      if (refetch) refetch();
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: 'error', text: err.message || 'Gagal menyimpan profil.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Update / Change
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Silakan isi kata sandi baru dan konfirmasinya.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);

      setPasswordMsg({ type: 'success', text: 'Kata sandi berhasil diperbarui!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setPasswordMsg({ type: 'error', text: err.message || 'Gagal memperbarui kata sandi.' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout profile={profile} unreadCount={unreadCount}>
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Profil Saya</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          Kelola informasi akun, foto profil, dan kata sandi Anda dalam satu tempat
        </p>
      </div>

      {/* Wadah Kartu Utama disusun 1 Kolom ke Bawah & Posisinya di Tengah */}
      <div className="card card-padding" style={{ maxWidth: 640, margin: '0 auto' }}>
        
        {/* Header Avatar & Informasi Pengguna */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Avatar name={fullName || profile?.email || 'User'} src={avatarUrl} size={90} />
            <label
              htmlFor="avatar_file_input"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'var(--primary)',
                color: '#fff',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                border: '2px solid #fff'
              }}
              title="Ganti Foto Profil"
            >
              <Camera size={16} />
            </label>
            <input
              id="avatar_file_input"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
            {fullName || 'Tanpa Nama'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{profile?.email}</div>

          {/* Badge Peran Pengguna dengan Icon Lucide Profesional */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            padding: '5px 14px',
            borderRadius: 20,
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: 12,
            fontWeight: 700
          }}>
            {profile?.role === 'teacher' ? (
              <Award size={15} color="var(--primary)" />
            ) : profile?.role === 'admin' ? (
              <ShieldCheck size={15} color="var(--primary)" />
            ) : (
              <GraduationCap size={15} color="var(--primary)" />
            )}
            <span>{profile?.role === 'teacher' ? 'Guru Pengajar' : profile?.role === 'admin' ? 'Administrator' : 'Siswa'}</span>
          </div>

          {/* Tombol Buka Pengatur Foto Manual */}
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setShowAdjuster(!showAdjuster)}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 14, gap: 6, fontSize: 12 }}
            >
              <Sliders size={14} /> {showAdjuster ? 'Tutup Pengatur Manual' : 'Atur Geser Manual Foto'}
            </button>
          )}

          {/* Panel Slider Geser Manual Foto */}
          {showAdjuster && (
            <div style={{
              width: '100%',
              maxWidth: 480,
              marginTop: 14,
              padding: 16,
              background: 'var(--bg-main)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Move size={15} color="var(--primary)" /> Pengaturan Geser Manual Foto
                </div>
                <button
                  type="button"
                  onClick={handleResetAdjustments}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11, padding: '2px 8px', gap: 4 }}
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>

              {/* Slider 1: Geser Vertikal (Atas / Bawah) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ArrowUpDown size={12} color="var(--primary)" /> Geser Atas / Bawah:
                  </span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{offsetY > 0 ? `+${offsetY}%` : `${offsetY}%`}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={offsetY}
                  onChange={(e) => applyManualAdjustment(offsetX, parseInt(e.target.value), photoZoom)}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Slider 2: Geser Horizontal (Kiri / Kanan) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ArrowLeftRight size={12} color="var(--primary)" /> Geser Kiri / Kanan:
                  </span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{offsetX > 0 ? `+${offsetX}%` : `${offsetX}%`}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={offsetX}
                  onChange={(e) => applyManualAdjustment(parseInt(e.target.value), offsetY, photoZoom)}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Slider 3: Skala Pembesaran (Zoom) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ZoomIn size={12} color="var(--primary)" /> Perbesar / Zoom:
                  </span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{Math.round(photoZoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.05"
                  value={photoZoom}
                  onChange={(e) => applyManualAdjustment(offsetX, offsetY, parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Bagian 1: Form Informasi Akun & Foto */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <User size={16} color="var(--primary)" /> Informasi Profil
          </h2>

          {profileMsg.text && (
            <div style={{
              padding: '10px 14px',
              background: profileMsg.type === 'error' ? 'var(--error-light)' : '#D1FAE5',
              borderRadius: 8,
              color: profileMsg.type === 'error' ? 'var(--error)' : '#065F46',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {profileMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="prf_full_name">Nama Lengkap</label>
            <input
              id="prf_full_name"
              type="text"
              required
              className="form-input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="prf_nis">
              {profile?.role === 'teacher' ? 'NIP (Nomor Induk Pegawai)' : 'NIS / NISN'}
            </label>
            <input
              id="prf_nis"
              type="text"
              className="form-input"
              placeholder={profile?.role === 'teacher' ? 'Masukkan NIP...' : 'Masukkan NIS / NISN...'}
              value={nisNip}
              onChange={e => setNisNip(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="prf_email">Alamat Email (Akun)</label>
            <input
              id="prf_email"
              type="email"
              disabled
              className="form-input"
              value={profile?.email || ''}
              style={{ background: 'var(--bg-main)', opacity: 0.7 }}
            />
          </div>

          <button type="submit" disabled={savingProfile} className="btn btn-primary" style={{ gap: 6, alignSelf: 'flex-start' }}>
            <Save size={16} /> {savingProfile ? 'Menyimpan...' : 'Simpan Profil & Foto'}
          </button>
        </form>

        {/* Garis Pembatas Rapi */}
        <div style={{ margin: '24px 0', borderTop: '1px solid var(--border)' }} />

        {/* Bagian 2: Form Keamanan & Ganti Password */}
        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <KeyRound size={16} color="var(--primary)" /> Keamanan & Ganti Password
          </h2>

          {passwordMsg.text && (
            <div style={{
              padding: '10px 14px',
              background: passwordMsg.type === 'error' ? 'var(--error-light)' : '#D1FAE5',
              borderRadius: 8,
              color: passwordMsg.type === 'error' ? 'var(--error)' : '#065F46',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {passwordMsg.type === 'error' ? <AlertCircle size={16} /> : <ShieldCheck size={16} />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="new_pass">Kata Sandi Baru</label>
            <input
              id="new_pass"
              type="password"
              required
              minLength={6}
              className="form-input"
              placeholder="Masukkan kata sandi baru (Minimal 6 karakter)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="confirm_pass">Konfirmasi Kata Sandi Baru</label>
            <input
              id="confirm_pass"
              type="password"
              required
              minLength={6}
              className="form-input"
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={savingPassword} className="btn btn-outline" style={{ gap: 6, alignSelf: 'flex-start' }}>
            <Lock size={16} /> {savingPassword ? 'Memproses...' : 'Perbarui Kata Sandi'}
          </button>
        </form>

      </div>
    </DashboardLayout>
  );
}
