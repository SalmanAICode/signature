import React from 'react';

interface IconProps {
    className?: string;
}

const Home: React.FC<IconProps> = ({ className }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
            fill="currentColor"
        />
    </svg>
);

export default Home;
