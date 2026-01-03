import shastraLabLogo from '@/assets/shastralab-logo.png';

interface ShastraLabLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
};

export default function ShastraLabLogo({ 
  className = '', 
  showText = true,
  size = 'md' 
}: ShastraLabLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={shastraLabLogo} 
        alt="ShastraLab" 
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
      {!showText && null}
    </div>
  );
}

export function ShastraLabIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <img 
      src={shastraLabLogo} 
      alt="ShastraLab" 
      className={className}
      style={{ height: size, width: 'auto' }}
    />
  );
}
