import React from 'react';

interface LogoutProps {
    className?: string;
}

const Logout: React.FC<LogoutProps> = ({ className }) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M16 17L21 12L16 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M5 3H11C12.1046 3 13 3.89543 13 5V8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M13 16V19C13 20.1046 12.1046 21 11 21H5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default Logout;
