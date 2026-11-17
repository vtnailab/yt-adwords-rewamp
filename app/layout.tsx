import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import SmoothScroll from '../components/SmoothScroll';

// The original YoutubeADwords wordmark is set in Bricolage Grotesque ExtraBold.
const logoFont = Bricolage_Grotesque({ subsets: ['latin'], weight: ['800'], variable: '--font-logo', display: 'swap' });

export const metadata: Metadata = {
  title: 'YoutubeADwords | YouTube & Google Ads Services',
  description: 'YouTube views, subscribers, likes, watch hours and Google Ads campaigns.',
};

// viewport-fit=cover lets the tab bar and sticky buy bars sit above the iPhone home indicator.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f3e9e0' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={logoFont.variable}><body><SmoothScroll />{children}</body></html>;
}
