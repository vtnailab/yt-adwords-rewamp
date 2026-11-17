import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import SmoothScroll from '../components/SmoothScroll';

// The original YoutubeADwords wordmark is set in Bricolage Grotesque ExtraBold.
const logoFont = Bricolage_Grotesque({ subsets: ['latin'], weight: ['800'], variable: '--font-logo', display: 'swap' });

export const metadata: Metadata = {
  title: 'YoutubeADwords | YouTube & Google Ads Services',
  description: 'YouTube views, subscribers, likes, watch hours and Google Ads campaigns.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={logoFont.variable}><body><SmoothScroll />{children}</body></html>;
}
