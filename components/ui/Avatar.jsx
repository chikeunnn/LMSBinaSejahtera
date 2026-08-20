import { getInitials } from '@/lib/utils';

export default function Avatar({ src, name, size = 'md', className = '', objectPosition = 'center' }) {
  const sizeMap = { sm: 32, md: 40, lg: 56, xl: 80 };
  const px = typeof size === 'number' ? size : (sizeMap[size] || 40);
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        width={px}
        height={px}
        style={{
          width: px,
          height: px,
          minWidth: px,
          minHeight: px,
          maxWidth: px,
          maxHeight: px,
          borderRadius: '50%',
          objectFit: 'cover',
          objectPosition: objectPosition,
          flexShrink: 0,
          aspectRatio: '1 / 1'
        }}
        className={`avatar avatar-${size} ${className}`}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }

  const fontSize = px < 36 ? 12 : px < 50 ? 14 : px < 70 ? 18 : 24;
  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{
        width: px,
        height: px,
        minWidth: px,
        minHeight: px,
        maxWidth: px,
        maxHeight: px,
        fontSize,
        background: 'var(--primary-light)',
        color: 'var(--primary)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        flexShrink: 0,
        aspectRatio: '1 / 1'
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
