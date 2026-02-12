import { Metadata } from 'next';
import LoginClient from './_components/LoginClient';

export const metadata: Metadata = {
  title: 'Login - Funder CRM',
  description: 'Log in to your funder account',
};

export default function LoginPage() {
  return <LoginClient />;
} 