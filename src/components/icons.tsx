type IconProps = {
  className?: string;
  size?: number;
};

// Equipment Icons - Minimal Industrial Pictogram Style
export function DozerIcon({ className = "", size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="10" width="3" height="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="6" y="8" width="14" height="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="8" y="4" width="8" height="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="6" y1="16" x2="10" y2="16" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="14" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="16" cy="18" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

export function LoaderIcon({ className = "", size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8 L6 7 L8 9 L7 11 L4 11 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="7" y1="10" x2="10" y2="13" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="11" width="12" height="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="11" y="6" width="6" height="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

export function ExcavatorIcon({ className = "", size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="16" width="10" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="7" cy="17.5" r="0.8" fill="currentColor"/>
      <circle cx="9.5" cy="17.5" r="0.8" fill="currentColor"/>
      <circle cx="12.5" cy="17.5" r="0.8" fill="currentColor"/>
      <rect x="7" y="10" width="6" height="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="3" y="13" width="3" height="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="12" y1="13" x2="17" y2="8" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="13" r="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="17" cy="8" r="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="17" y1="8" x2="20" y2="5" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="20" cy="5" r="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M20 4 L22 5 L21 7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

export function TractorIcon({ className = "", size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="4" height="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="8" y="8" width="6" height="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M7 8 L15 8 L16 6 L6 6 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="8" y1="6" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="14" y1="6" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="17" cy="18" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="17" cy="18" r="2.5" stroke="currentColor" strokeWidth="1"/>
      <line x1="13" y1="18" x2="11" y2="18" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="21" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

// Navigation Icons
export function HomeIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

export function DashboardIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

export function HistoryIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export function CheckIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export function AlertIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

export function XIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export function InfoIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

export function PlusIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

export function MenuIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

export function BookIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

export function ClipboardIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <path d="M9 14l2 2 4-4"/>
    </svg>
  );
}

export function SearchIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

export function ArrowLeftIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}

export function ScanIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="7" y1="12" x2="17" y2="12"/>
    </svg>
  );
}

export function UsersIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

export function ClockIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
