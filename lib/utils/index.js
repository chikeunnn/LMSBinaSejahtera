/**
 * Format tanggal ke format Indonesia
 */
export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format tanggal singkat
 */
export function formatDateShort(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format "X waktu lalu"
 */
export function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDateShort(date);
}

/**
 * Format durasi detik ke MM:SS
 */
export function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format bytes ke readable
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get initials dari nama
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/**
 * Clamp progress percentage
 */
export function clampProgress(value) {
  return Math.min(100, Math.max(0, Math.round(value || 0)));
}

/**
 * Get content type label
 */
export function getContentTypeLabel(type) {
  const labels = {
    text: 'Teks',
    pdf: 'PDF',
    video: 'Video',
    image: 'Gambar',
    document: 'Dokumen',
    link: 'Tautan',
    ppt: 'Presentasi',
    excel: 'Spreadsheet',
  };
  return labels[type] || type;
}

/**
 * Get role label
 */
export function getRoleLabel(role) {
  const labels = {
    student: 'Siswa',
    teacher: 'Guru',
    admin: 'Admin',
  };
  return labels[role] || role;
}

/**
 * Get assignment status label & color
 */
export function getAssignmentStatus(submission, deadline) {
  if (!submission) {
    const isLate = deadline && new Date(deadline) < new Date();
    return isLate
      ? { label: 'Terlambat', color: 'error' }
      : { label: 'Belum Dikerjakan', color: 'default' };
  }
  if (submission.score !== null && submission.score !== undefined) {
    return { label: 'Dinilai', color: 'success' };
  }
  return { label: 'Sudah Dikumpulkan', color: 'warning' };
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate avatar URL dari nama
 */
export function getAvatarUrl(avatarUrl, name) {
  if (avatarUrl) return avatarUrl;
  const initials = getInitials(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=2563EB&color=fff&size=128&bold=true`;
}

/**
 * Validate file type
 */
export function validateFileType(file, allowedTypes) {
  return allowedTypes.some((type) => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type);
    }
    return file.type === type || file.type.startsWith(type);
  });
}

/**
 * Validate file size (bytes)
 */
export function validateFileSize(file, maxBytes) {
  return file.size <= maxBytes;
}

/**
 * Helper aman untuk membuka / mengunduh berkas (termasuk Data URL base64) tanpa error about:blank#blocked
 */
export function openOrDownloadFile(url, fileName = 'berkas_materi') {
  if (!url) return;

  // Jika URL HTTP/HTTPS standar
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Jika Data URI (data:application/pdf;base64,...)
  if (url.startsWith('data:')) {
    try {
      const parts = url.split(';base64,');
      const contentType = parts[0].replace('data:', '');
      const base64Str = parts[1];

      const binaryStr = window.atob(base64Str);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      // Buka PDF / Gambar di tab baru atau iframe window
      if (contentType.includes('pdf') || contentType.includes('image')) {
        const win = window.open();
        if (win) {
          win.document.write(`
            <!DOCTYPE html>
            <html>
              <head><title>${fileName}</title></head>
              <body style="margin:0; background:#0F172A; display:flex; justify-content:center; align-items:center; height:100vh; overflow:hidden;">
                ${contentType.includes('image')
                  ? `<img src="${blobUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" />`
                  : `<iframe src="${blobUrl}" style="width:100%; height:100%; border:none;"></iframe>`
                }
              </body>
            </html>
          `);
          return;
        }
      }

      // Fallback: Trigger unduh otomatis
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'dokumen_materi';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (e) {
      console.error('Error opening file blob:', e);
      alert('Gagal membuka berkas. Format file tidak didukung.');
    }
  }
}

/**
 * Subject Graphic Theme Helper
 */
export function getSubjectGraphic(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('matematika') || lower.includes('mtk')) {
    return {
      icon: '📐',
      symbol: 'π + x',
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      bg: '#EEF2FF',
      color: '#4F46E5',
      badge: 'Matematika'
    };
  }
  if (lower.includes('ipa') || lower.includes('sains') || lower.includes('fisika') || lower.includes('biologi') || lower.includes('kimia')) {
    return {
      icon: '🧪',
      symbol: '🔬',
      gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      bg: '#ECFDF5',
      color: '#059669',
      badge: 'IPA / Sains'
    };
  }
  if (lower.includes('indonesia') || lower.includes('indo') || lower.includes('bahasa')) {
    return {
      icon: '📖',
      symbol: '📚',
      gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
      bg: '#FFFBEB',
      color: '#D97706',
      badge: 'Bahasa Indonesia'
    };
  }
  if (lower.includes('inggris') || lower.includes('english') || lower.includes('bing')) {
    return {
      icon: '🌐',
      symbol: 'EN',
      gradient: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
      bg: '#E0F2FE',
      color: '#0284C7',
      badge: 'Bahasa Inggris'
    };
  }
  if (lower.includes('ips') || lower.includes('sejarah') || lower.includes('geografi') || lower.includes('ekonomi')) {
    return {
      icon: '🌍',
      symbol: '🗺️',
      gradient: 'linear-gradient(135deg, #E11D48 0%, #FB7185 100%)',
      bg: '#FFE4E6',
      color: '#E11D48',
      badge: 'IPS'
    };
  }
  return {
    icon: '📚',
    symbol: '📘',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
    bg: '#EFF6FF',
    color: '#2563EB',
    badge: 'Mata Pelajaran'
  };
}

