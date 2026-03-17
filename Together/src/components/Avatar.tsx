interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({ src, name, size = 36, className = '' }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const style = { width: size, height: size, minWidth: size, minHeight: size };

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'avatar'}
        className={`rounded-full object-cover ${className}`}
        style={style}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-semibold ${className}`}
      style={{ ...style, fontSize: Math.max(10, size * 0.38) }}
    >
      {initials}
    </div>
  );
}
