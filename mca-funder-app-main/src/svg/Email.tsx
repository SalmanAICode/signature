import { SVGProps } from 'react';

const Email = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v0.2l-10 6.25L2 6.2V6Zm0 2.4v9.6A2 2 0 0 0 4 20h16a2 2 0 0 0 2-2V8.4l-9.4 5.875a1 1 0 0 1-1.2 0L2 8.4Z" />
  </svg>
);

export default Email;
