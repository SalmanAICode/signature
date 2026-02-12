import React from 'react';

interface ProfileProps {
  className?: string;
}

const Profile: React.FC<ProfileProps> = ({ className }) => {
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
        d="M12 10.5C14.4853 10.5 16.5 8.48527 16.5 6C16.5 3.51472 14.4853 1.5 12 1.5C9.51472 1.5 7.5 3.51472 7.5 6C7.5 8.48527 9.51472 10.5 12 10.5Z"
        fill="currentColor"
      />
      <path
        d="M21 18C21 15.5146 18.9853 13.5 16.5 13.5H7.5C5.01472 13.5 3 15.5146 3 18V22.5H21V18Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default Profile; 