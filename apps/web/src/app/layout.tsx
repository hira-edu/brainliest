import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brainliest - Exam Prep Platform',
  description: 'Master your exams with curated past exam practice and AI-powered explanations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
