import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YoutubeADwords | YouTube & Google Ads Services',
  description: 'YouTube views, subscribers, likes, watch hours and Google Ads campaigns.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
