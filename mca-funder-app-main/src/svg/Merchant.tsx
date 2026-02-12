import React from 'react';

interface MerchantProps {
  className?: string;
}

const Merchant: React.FC<MerchantProps> = ({ className }) => {
  return (
<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
  <path d="M3 9l1-5h16l1 5"/>
  <path d="M5 22V12H19v10"/>
  <rect x="9" y="16" width="6" height="6"/>
</svg>
  );
};

export default Merchant; 