import { SVGProps } from 'react';

const Funding = (props: SVGProps<SVGSVGElement>) => (
<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
  <ellipse cx="12" cy="6" rx="8" ry="3"/>
  <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/>
  <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>
</svg>
);

export default Funding; 