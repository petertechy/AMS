type IconProps = { className?: string };

const base = "h-5 w-5 shrink-0";

export function IconGrid({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  );
}

export function IconClipboard({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <rect x="5" y="3.5" width="10" height="14" rx="1.5" />
      <path d="M7.5 3.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v.5" />
      <path d="M7 8.5h6M7 11.5h6M7 14.5h3.5" />
    </svg>
  );
}

export function IconBox({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M3 6.5 10 3l7 3.5-7 3.5-7-3.5Z" />
      <path d="M3 6.5v7L10 17l7-3.5v-7" />
      <path d="M10 10v7" />
    </svg>
  );
}

export function IconSwap({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M4 7h10.5M14.5 7 11.5 4M14.5 7l-3 3" />
      <path d="M16 13H5.5M5.5 13l3 3M5.5 13l3-3" />
    </svg>
  );
}

export function IconInbox({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M3 11.5 5.5 4h9l2.5 7.5" />
      <path d="M3 11.5v3a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-3" />
      <path d="M3 11.5h4.2a1 1 0 0 1 .9.55l.4.8a1 1 0 0 0 .9.55h1.2a1 1 0 0 0 .9-.55l.4-.8a1 1 0 0 1 .9-.55H17" />
    </svg>
  );
}

export function IconUsers({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <circle cx="7" cy="6.5" r="2.25" />
      <path d="M2.75 16v-.75A3.25 3.25 0 0 1 6 12h2a3.25 3.25 0 0 1 3.25 3.25V16" />
      <circle cx="14" cy="7" r="1.85" />
      <path d="M12.5 12.15A3.25 3.25 0 0 1 15 12h.25A2.75 2.75 0 0 1 18 14.75V16" />
    </svg>
  );
}

export function IconSettings({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 3v1.6M10 15.4V17M17 10h-1.6M4.6 10H3M14.8 5.2l-1.13 1.13M6.33 13.67 5.2 14.8M14.8 14.8l-1.13-1.13M6.33 6.33 5.2 5.2" />
    </svg>
  );
}

export function IconLogout({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M8 3.5H5.5A1.5 1.5 0 0 0 4 5v10a1.5 1.5 0 0 0 1.5 1.5H8" />
      <path d="M13 13.5 17 10l-4-3.5M17 10H8" />
    </svg>
  );
}

export function IconMenu({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  );
}

export function IconClose({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}

export function IconBuilding({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <rect x="4" y="2.5" width="9" height="15" rx="1" />
      <path d="M6.5 5.5h1M11 5.5h1M6.5 8.5h1M11 8.5h1M6.5 11.5h1M11 11.5h1" />
      <path d="M13 8v9.5h3.5V10a1 1 0 0 0-1-1H13Z" />
      <path d="M7.5 17.5V15h2v2.5" />
    </svg>
  );
}

export function IconHistory({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M10 5.5V10l3 2" />
      <path d="M3.5 9.5a6.5 6.5 0 1 1 1.8 4.5" />
      <path d="M2.5 12v-3h3" />
    </svg>
  );
}

export function IconBell({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M5 8.5a5 5 0 0 1 10 0c0 3 1 4.5 1.5 5H3.5c.5-.5 1.5-2 1.5-5Z" />
      <path d="M8.2 16a1.8 1.8 0 0 0 3.6 0" />
    </svg>
  );
}

export function IconWrench({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M13.4 3.3a3.5 3.5 0 0 0-4.6 4.2L3.6 12.7a1.5 1.5 0 0 0 2.1 2.1l5.2-5.2a3.5 3.5 0 0 0 4.2-4.6l-2.1 2.1-1.7-.4-.4-1.7 2.1-2.1Z" />
    </svg>
  );
}

export function IconArrowsRightLeft({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M4 6.5h11M11.5 3l3.5 3.5-3.5 3.5" />
      <path d="M16 13.5H5M8.5 10 5 13.5 8.5 17" />
    </svg>
  );
}
