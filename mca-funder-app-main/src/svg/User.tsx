import React from 'react';

interface UserProps {
  className?: string;
}

const User: React.FC<UserProps> = ({ className }) => {
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
        d="M12 5.25C12 7.32106 10.3211 9 8.25 9C6.17894 9 4.5 7.32106 4.5 5.25C4.5 3.17894 6.17894 1.5 8.25 1.5C10.3211 1.5 12 3.17894 12 5.25Z"
        fill="currentColor"
      />
      <path
        d="M4.5 12C2.01472 12 0 14.0147 0 16.5V22.5H12V12H4.5Z"
        fill="currentColor"
      />
      <path
        d="M19.5 12H15V22.5H24V16.5C24 14.0147 21.9854 12 19.5 12Z"
        fill="currentColor"
      />
      <path
        d="M18 9C19.6569 9 21 7.65686 21 6C21 4.34314 19.6569 3 18 3C16.3431 3 15 4.34314 15 6C15 7.65686 16.3431 9 18 9Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default User; 