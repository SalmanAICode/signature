import { SVGProps } from 'react';

const MathOperators = (props: SVGProps<SVGSVGElement>) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        {/* Plus sign (+) - Top left */}
        <path d="M4 8h6" />
        <path d="M7 5v6" />
        
        {/* Minus sign (-) - Top right */}
        <path d="M14 8h6" />
        
        {/* Multiplication sign (×) - Bottom left */}
        <path d="M4.5 14.5l5 5" />
        <path d="M9.5 14.5l-5 5" />
        
        {/* Equals sign (=) - Bottom right */}
        <path d="M14 15h6" />
        <path d="M14 19h6" />
    </svg>
);

export default MathOperators; 