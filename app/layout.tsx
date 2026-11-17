import type { Metadata } from 'next';
import './globals.css';
import SmoothScroll from '../components/SmoothScroll';

export const metadata: Metadata = {
  title: 'YoutubeADwords | YouTube & Google Ads Services',
  description: 'YouTube views, subscribers, likes, watch hours and Google Ads campaigns.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><SmoothScroll />{children}</body></html>;
}
