import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Internal Workspace Project Manager',
  description: 'Secure multi-user project management for internal team collaboration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
