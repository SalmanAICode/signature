import React from 'react';

interface IconProps {
    className?: string;
}

const Work: React.FC<IconProps> = ({ className }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect x="8" y="3" width="8" height="3" rx="1" ry="1" />
        <rect x="3" y="7" width="18" height="13" rx="2" ry="2" />
    </svg>
);

export default Work;
