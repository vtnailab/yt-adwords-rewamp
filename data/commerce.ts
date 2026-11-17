// Service metadata for the purchase flow, mirroring the original YoutubeADwords product pages
// (tier tab labels, feature checklist, info banner). Prices come from youtubeadwords-catalog.json.
import catalog from './youtubeadwords-catalog.json';

export type Pkg = { quantity: string; price: string; originalPrice?: string | null; discount?: string | null };
export type Tier = { key: 'regular' | 'fast' | 'ads'; label: string; packages: Pkg[] };
export type Service = {
  slug: string; name: string; platform: 'YouTube' | 'Google'; unit: string;
  linkLabel: string; linkPlaceholder: string; features: string[]; banner?: string; tiers: Tier[];
};

const META: Record<string, Omit<Service, 'slug' | 'tiers' | 'unit'> & { tabs: Partial<Record<Tier['key'], string>> }> = {
  'buy-youtube-views': { name: 'YouTube Views', platform: 'YouTube', linkLabel: 'Video link', linkPlaceholder: 'https://youtube.com/watch?v=…', tabs: { regular: 'Regular Views', fast: 'Fast Views', ads: 'Ads Views' }, features: ['Real & Organic Views', 'High Quality', 'Instant start', 'Refill Guaranteed', 'No drops', 'Privacy and safety'], banner: 'We recommend our Fast YouTube Views packages for orders with a high number of views.' },
  'buy-youtube-subscribers': { name: 'YouTube Subscribers', platform: 'YouTube', linkLabel: 'Channel link', linkPlaceholder: 'https://youtube.com/@yourchannel', tabs: { regular: 'Regular Subs.', fast: 'Natural Growth', ads: 'Influencer+' }, features: ['Real & Organic Subscribers', 'High Quality', 'Instant start', 'Refill Guaranteed', 'No drops', 'Privacy and safety'], banner: 'We recommend our Natural Growth packages for orders with a high number of subscribers.' },
  'buy-youtube-likes': { name: 'YouTube Likes', platform: 'YouTube', linkLabel: 'Video link', linkPlaceholder: 'https://youtube.com/watch?v=…', tabs: { regular: 'Slow Likes', fast: 'Turbo Likes' }, features: ['Real & Organic Likes', 'High Quality', 'Instant start', 'Refill Guaranteed', 'No drops', 'Privacy and safety'], banner: 'We recommend our Turbo YouTube Likes packages for orders with a high number of likes.' },
  'buy-youtube-watch-hours': { name: 'YouTube Watch Hours', platform: 'YouTube', linkLabel: 'Channel link', linkPlaceholder: 'https://youtube.com/@yourchannel', tabs: { regular: 'Watch Time' }, features: ['Real & Organic Watch Hours', 'High Quality', 'Instant start', 'Refill Guaranteed', 'No drops', 'Privacy and safety'], banner: 'We recommend our Verified YouTube Watch Hours packages to boost your channel toward monetisation.' },
  'buy-google-skip-ads-views': { name: 'Google Skip Ads Views', platform: 'Google', linkLabel: 'Video link', linkPlaceholder: 'https://youtube.com/watch?v=…', tabs: { regular: 'Regular Views' }, features: ['Real & Organic Skip Ads Views', 'High Quality', 'Instant start', 'Refill Guaranteed', 'No drops', 'Privacy and safety'] },
  'buy-google-display-ads-views': { name: 'Google Display Ads Views', platform: 'Google', linkLabel: 'Video or website link', linkPlaceholder: 'https://…', tabs: { regular: 'Content Targeted Setup', fast: 'Worldwide (WW) Display', ads: 'Country Targeted Display' }, features: ['Real & Organic Display Ads Views', 'High Quality', 'Instant start', 'Refill Guaranteed', 'No drops', 'Privacy and safety'] },
  'buy-google-apps-download': { name: 'Google Apps Download', platform: 'Google', linkLabel: 'App store link', linkPlaceholder: 'https://play.google.com/store/apps/details?id=…', tabs: { regular: 'Worldwide (WW) Installs', fast: 'Tier-1 Country Installs' }, features: ['Real & Organic App Installs', 'High Quality', 'Instant start', 'Refill Guaranteed', 'No drops', 'Privacy and safety'] },
  'buy-google-ads-website-traffic': { name: 'Google Ads Website / App Traffic', platform: 'Google', linkLabel: 'Website or app link', linkPlaceholder: 'https://yourwebsite.com', tabs: { regular: 'Regular' }, features: ['Real & Organic Website Traffic', 'High Quality', 'Instant start', 'Refill Guaranteed', 'No drops', 'Privacy and safety'] },
};

const TIER_KEYS = [['regular', 'regularPackages'], ['fast', 'fastPackages'], ['ads', 'adsPackages']] as const;

export const SERVICES: Service[] = catalog.pricing.map(p => {
  const meta = META[p.slug];
  const tiers = TIER_KEYS
    .map(([key, field]) => ({ key, label: meta.tabs[key] || key, packages: ((p as Record<string, unknown>)[field] as Pkg[] | undefined) || [] }))
    .filter(t => t.packages.length) as Tier[];
  const { tabs: _tabs, ...rest } = meta;
  return { slug: p.slug, unit: p.quantityKey, tiers, ...rest };
});

export const serviceBySlug = (slug: string | null | undefined) => SERVICES.find(s => s.slug === slug);
export const isPriced = (pkg: Pkg) => /^\d+(\.\d+)?$/.test(pkg.price);
export const money = (value: number | string) => `$${Number(value).toFixed(2)}`;
