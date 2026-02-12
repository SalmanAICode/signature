import React from 'react';

interface SyndicatorProps {
  className?: string;
}

const Syndicator: React.FC<SyndicatorProps> = ({ className }) => {
  return (
<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="3"/>
  <path d="M12 10v4"/>
  <path d="M11 11h2a1 1 0 1 1 0 2h-2a1 1 0 1 1 0-2z"/>
  <circle cx="5" cy="7" r="2"/>
  <circle cx="19" cy="7" r="2"/>
  <circle cx="12" cy="20" r="2"/>
  <path d="M7 8.5c1.5 2 4.5 2 6 0"/>
  <path d="M17 8.5c-1.5 2-4.5 2-6 0"/>
  <path d="M7 8.5L12 18"/>
  <path d="M17 8.5L12 18"/>
</svg>
  );
};

export default Syndicator; 