import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sienvi Nexus',
  description: 'Project management for teams',
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
