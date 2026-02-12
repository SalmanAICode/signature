import React from 'react';

interface IconProps {
    className?: string;
}

const Mobile: React.FC<IconProps> = ({ className }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />
        <circle cx="12" cy="18" r="1" fill="#fff" />
    </svg>
);

export default Mobile;
