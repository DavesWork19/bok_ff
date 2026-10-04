export function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M4 10l6 5 6-9 6 9 6-5-2.5 14h-19L4 10z" />
      <rect x="6.5" y="25.5" width="19" height="2.5" rx="1" />
    </svg>
  );
}
