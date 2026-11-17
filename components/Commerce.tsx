'use client';

// Purchase flow copied from the original YoutubeADwords site, rebuilt phone-first:
//   product page: tier tabs → pick a package → "Buy now" (→ /get-started → /checkout) or "Add to cart" (→ cart drawer)
//   cart drawer: items, total, "Proceed to Checkout" / "Continue Shopping"
//   checkout: email, "Where should we deliver?" links, payment method, order summary, share payment link
// Components mount into placeholders in the template HTML ([data-yaw-purchase], [data-yaw-mount]) and the nav.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { SERVICES, serviceBySlug, isPriced, money, type Service, type Tier, type Pkg } from '../data/commerce';

/* ---------------- cart store (localStorage, shared across tabs) ---------------- */
export type CartItem = { id: string; slug: string; service: string; platform: string; tier: Tier['key']; tierLabel: string; quantity: string; unit: string; price: string; link?: string };
const CART_KEY = 'yaw-cart';
const DIRECT_KEY = 'yaw-direct';
const EMPTY: CartItem[] = [];
let cache: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };
const safeGet = (store: 'local' | 'session', key: string) => { try { return (store === 'local' ? localStorage : sessionStorage).getItem(key); } catch { return null; } };
const safeSet = (store: 'local' | 'session', key: string, value: string | null) => { try { const s = store === 'local' ? localStorage : sessionStorage; value === null ? s.removeItem(key) : s.setItem(key, value); } catch { /* storage blocked */ } };
function readCart(): CartItem[] {
  const raw = safeGet('local', CART_KEY);
  if (raw !== cache.raw) { let items = EMPTY; try { items = raw ? JSON.parse(raw) : EMPTY; } catch { items = EMPTY; } cache = { raw, items }; }
  return cache.items;
}
function writeCart(items: CartItem[]) { safeSet('local', CART_KEY, JSON.stringify(items)); window.dispatchEvent(new Event('yaw-cart')); }
function subscribe(cb: () => void) { window.addEventListener('yaw-cart', cb); window.addEventListener('storage', cb); return () => { window.removeEventListener('yaw-cart', cb); window.removeEventListener('storage', cb); }; }
const useCart = () => useSyncExternalStore(subscribe, readCart, () => EMPTY);
const openDrawer = () => window.dispatchEvent(new Event('yaw-cart-open'));
const makeItem = (service: Service, tier: Tier, pkg: Pkg, link?: string): CartItem => ({
  id: `${service.slug}-${tier.key}-${pkg.quantity}-${Date.now()}`, slug: service.slug, service: service.name, platform: service.platform,
  tier: tier.key, tierLabel: tier.label, quantity: pkg.quantity, unit: service.unit, price: pkg.price, link,
});
const total = (items: CartItem[]) => items.reduce((sum, i) => sum + Number(i.price), 0);

/* ---------------- small UI pieces ---------------- */
const Check = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3-4.2 4.2a1 1 0 0 1-1.4 0L6.3 11a1 1 0 1 1 1.4-1.4l1.1 1.1 3.5-3.5a1 1 0 0 1 1.4 1.4Z" /></svg>;
const BagIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l1 13H5L6 7Zm3 0V6a3 3 0 0 1 6 0v1" /></svg>;
const qtyLabel = (item: Pick<CartItem, 'quantity' | 'unit'>) => `${item.quantity} ${item.unit}`;

/* ---------------- product page: tier tabs + package picker ---------------- */
function PurchasePanel({ service }: { service: Service }) {
  const [tierKey, setTierKey] = useState(service.tiers[0]?.key);
  const [selected, setSelected] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const tier = service.tiers.find(t => t.key === tierKey) || service.tiers[0];
  const pkg = selected !== null ? tier.packages[selected] : null;
  const priced = pkg ? isPriced(pkg) : false;

  // Sticky mobile buy bar appears once a package is chosen and the inline buttons scroll away.
  useEffect(() => {
    const el = actionsRef.current; if (!el) return;
    const io = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting), { threshold: 0 });
    io.observe(el); return () => io.disconnect();
  }, []);

  const buyNow = () => {
    if (!pkg) return;
    if (!priced) { window.location.assign('/contact/'); return; }
    window.location.assign(`/get-started/?service=${service.slug}&tier=${tier.key}&package=${selected}`);
  };
  const addToCart = () => {
    if (!pkg || !priced) return;
    writeCart([...readCart(), makeItem(service, tier, pkg)]);
    setAdded(true); setTimeout(() => setAdded(false), 1600); openDrawer();
  };
  const buyLabel = pkg && !priced ? 'Contact Us' : 'Buy now';

  return <div className="yaw-buy">
    {service.tiers.length > 1 && <div className="yaw-tabs" role="tablist" aria-label="Package type">
      {service.tiers.map(t => <button key={t.key} type="button" role="tab" aria-selected={t.key === tier.key} className="yaw-tab" onClick={() => { setTierKey(t.key); setSelected(null); }}>{t.label}</button>)}
    </div>}
    {service.banner && <p className="yaw-banner"><strong>Information:</strong> {service.banner}</p>}
    <div className="yaw-packages" role="radiogroup" aria-label={`${tier.label} packages`}>
      {tier.packages.map((p, i) => {
        const on = selected === i; const hasPrice = isPriced(p);
        return <button key={p.quantity + i} type="button" role="radio" aria-checked={on} className={`yaw-pkg${on ? ' is-on' : ''}`} onClick={() => setSelected(i)}>
          <span className="yaw-pkg-qty">{p.quantity}</span>
          <span className="yaw-pkg-unit">{service.unit}</span>
          <span className="yaw-pkg-price">
            {hasPrice && p.originalPrice && <s>{money(p.originalPrice)}</s>}
            <b>{hasPrice ? money(p.price) : p.price}</b>
          </span>
          {hasPrice && p.discount && <span className="yaw-pkg-save">Save {p.discount}</span>}
        </button>;
      })}
    </div>
    <div className="yaw-actions-row" ref={actionsRef}>
      <button type="button" className="yaw-btn yaw-btn--red" disabled={!pkg} onClick={buyNow}>{buyLabel}</button>
      <button type="button" className="yaw-btn yaw-btn--dark" disabled={!pkg || !priced} onClick={addToCart}>{added ? 'Added ✓' : 'Add to cart'}</button>
    </div>
    {!pkg && <p className="yaw-hint">Select a package to continue.</p>}
    <ul className="yaw-features">{service.features.map(f => <li key={f}><Check />{f}</li>)}</ul>
    <div className={`yaw-buybar${pkg && barVisible ? ' is-on' : ''}`} aria-hidden={!(pkg && barVisible)}>
      <div className="yaw-buybar-info"><b>{pkg ? (priced ? money(pkg.price) : 'Custom') : ''}</b><span>{pkg ? `${pkg.quantity} ${service.unit} · ${tier.label}` : ''}</span></div>
      {priced && <button type="button" className="yaw-icon-btn" aria-label="Add to cart" onClick={addToCart}><BagIcon /></button>}
      <button type="button" className="yaw-btn yaw-btn--red" onClick={buyNow}>{buyLabel}</button>
    </div>
  </div>;
}

/* ---------------- nav cart button + drawer ---------------- */
function CartButton() {
  const items = useCart();
  return <button type="button" className="yaw-cart-btn" aria-label={`Open cart (${items.length})`} onClick={openDrawer}>
    <BagIcon />{items.length > 0 && <span className="yaw-cart-count">{items.length}</span>}
  </button>;
}

function CartDrawer() {
  const items = useCart();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true); const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('yaw-cart-open', show); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('yaw-cart-open', show); window.removeEventListener('keydown', key); };
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('yaw-locked', open); }, [open]);
  return <div className={`yaw-drawer${open ? ' is-open' : ''}`} aria-hidden={!open}>
    <div className="yaw-drawer-scrim" onClick={() => setOpen(false)} />
    <aside className="yaw-drawer-panel" role="dialog" aria-modal="true" aria-label="Your cart" data-lenis-prevent>
      <div className="yaw-sheet-grip" aria-hidden="true" />
      <header className="yaw-drawer-head"><h2>Your cart</h2><button type="button" className="yaw-close" aria-label="Close cart" onClick={() => setOpen(false)}>×</button></header>
      {items.length === 0 ? <div className="yaw-drawer-empty">
        <p>Your cart is empty.</p>
        <a className="yaw-btn yaw-btn--dark" href="/service/">Browse Services</a>
      </div> : <>
        <ul className="yaw-lines">{items.map(item => <li key={item.id} className="yaw-line">
          <div><b>{item.service}</b><span>Type: {item.tierLabel}</span><span>Quantity: {qtyLabel(item)}</span>{item.link && <span>URL: {item.link}</span>}</div>
          <div className="yaw-line-end"><b>{money(item.price)}</b><button type="button" onClick={() => writeCart(readCart().filter(i => i.id !== item.id))}>Remove</button></div>
        </li>)}</ul>
        <footer className="yaw-drawer-foot">
          <div className="yaw-total"><span>Total:</span><b>{money(total(items))}</b></div>
          <a className="yaw-btn yaw-btn--red yaw-btn--block" href="/checkout/">Proceed to Checkout</a>
          <button type="button" className="yaw-link-btn" onClick={() => setOpen(false)}>Continue Shopping</button>
        </footer>
      </>}
    </aside>
  </div>;
}

/* ---------------- /get-started: link, email, package, promo opt-in ---------------- */
function GetStarted() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const service = serviceBySlug(params.get('service')) || SERVICES[0];
  const [slug, setSlug] = useState(service.slug);
  const current = serviceBySlug(slug) || service;
  const initial = `${params.get('tier') || current.tiers[0].key}:${params.get('package') ?? ''}`;
  const [choice, setChoice] = useState(initial);
  const [link, setLink] = useState(''); const [email, setEmail] = useState(''); const [promo, setPromo] = useState(false);
  const [error, setError] = useState('');
  const [tierKey, index] = choice.split(':');
  const tier = current.tiers.find(t => t.key === tierKey);
  const pkg = tier && index !== '' ? tier.packages[Number(index)] : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg || !tier) { setError('Please choose a package.'); return; }
    if (!isPriced(pkg)) { window.location.assign('/contact/'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)) { setError('Please enter a valid email address.'); return; }
    if (!validLink(link)) { setError(`Please enter a valid ${current.linkLabel.toLowerCase()}.`); return; }
    safeSet('session', DIRECT_KEY, JSON.stringify({ items: [makeItem(current, tier, pkg, link.trim())], email, promo }));
    window.location.assign('/checkout/?direct=1');
  };

  return <form className="yaw-flow" onSubmit={submit} noValidate>
    <div className="yaw-flow-head"><span className="yaw-live"><i />204 users online</span><h2>Get started</h2><p>{current.name}</p></div>
    <label className="yaw-field"><span>Service</span>
      <select value={slug} onChange={e => { setSlug(e.target.value); setChoice(`${serviceBySlug(e.target.value)!.tiers[0].key}:`); }}>
        {SERVICES.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
      </select>
    </label>
    <label className="yaw-field"><span>Select Package *</span>
      <select value={choice} onChange={e => setChoice(e.target.value)} required>
        <option value={`${current.tiers[0].key}:`} disabled>Select package</option>
        {current.tiers.map(t => <optgroup key={t.key} label={t.label}>{t.packages.map((p, i) => <option key={i} value={`${t.key}:${i}`}>{p.quantity} {current.unit} · {isPriced(p) ? money(p.price) : p.price}</option>)}</optgroup>)}
      </select>
    </label>
    <label className="yaw-field"><span>Your Link *</span><input type="url" inputMode="url" autoComplete="url" placeholder={current.linkPlaceholder} value={link} onChange={e => setLink(e.target.value)} required /><small>{current.linkLabel}. A public link only, never a password.</small></label>
    <label className="yaw-field"><span>Email address *</span><input type="email" inputMode="email" autoComplete="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></label>
    <label className="yaw-check"><input type="checkbox" checked={promo} onChange={e => setPromo(e.target.checked)} /><span>Send me special promotions and discounts</span></label>
    {error && <p className="yaw-error" role="alert">{error}</p>}
    <div className="yaw-sticky-cta">
      <div className="yaw-sticky-sum"><span>{pkg ? `${pkg.quantity} ${current.unit}` : 'Select a package first'}</span><b>{pkg && isPriced(pkg) ? money(pkg.price) : ''}</b></div>
      <button type="submit" className="yaw-btn yaw-btn--red yaw-btn--block">{pkg && !isPriced(pkg) ? 'Contact Us' : 'Buy now'}</button>
    </div>
  </form>;
}

/* ---------------- /checkout ---------------- */
const validLink = (value: string) => { const v = value.trim(); if (!v) return false; if (/^@[\w.-]{2,}$/.test(v)) return true; try { const u = new URL(v); return /^https?:$/.test(u.protocol) && u.hostname.includes('.'); } catch { return false; } };
const encodeShare = (items: CartItem[]) => btoa(unescape(encodeURIComponent(JSON.stringify(items.map(({ slug, tier, quantity, link }) => ({ slug, tier, quantity, link }))))));
function decodeShare(value: string): CartItem[] {
  try {
    const raw = JSON.parse(decodeURIComponent(escape(atob(value)))) as { slug: string; tier: Tier['key']; quantity: string; link?: string }[];
    return raw.flatMap(r => { const s = serviceBySlug(r.slug); const t = s?.tiers.find(x => x.key === r.tier); const p = t?.packages.find(x => x.quantity === r.quantity); return s && t && p && isPriced(p) ? [makeItem(s, t, p, r.link)] : []; });
  } catch { return []; }
}

function Checkout() {
  const cart = useCart();
  const [mode, setMode] = useState<{ kind: 'cart' } | { kind: 'direct'; items: CartItem[] }>({ kind: 'cart' });
  const [email, setEmail] = useState('');
  const [links, setLinks] = useState<Record<string, string>>({});
  const [payment, setPayment] = useState<'crypto' | 'card'>('crypto');
  const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false); const [touched, setTouched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let items: CartItem[] = [];
    if (params.get('share')) items = decodeShare(params.get('share')!);
    else if (params.get('direct')) { try { const d = JSON.parse(safeGet('session', DIRECT_KEY) || 'null'); if (d) { items = d.items; setEmail(d.email || ''); } } catch { /* ignore */ } }
    else if (params.get('service')) { // links from older pages: ?service=&tier=&package=
      const s = serviceBySlug(params.get('service')); const t = s?.tiers.find(x => x.key === params.get('tier')) || s?.tiers[0]; const p = t?.packages[Number(params.get('package') || 0)];
      if (s && t && p && isPriced(p)) items = [makeItem(s, t, p)];
    }
    if (items.length) { setMode({ kind: 'direct', items }); setLinks(Object.fromEntries(items.map(i => [i.id, i.link || '']))); }
  }, []);

  const items = mode.kind === 'direct' ? mode.items : cart;
  const remove = (id: string) => {
    if (mode.kind === 'direct') { const next = mode.items.filter(i => i.id !== id); setMode(next.length ? { kind: 'direct', items: next } : { kind: 'cart' }); if (!next.length) safeSet('session', DIRECT_KEY, null); }
    else writeCart(readCart().filter(i => i.id !== id));
  };
  const sum = total(items);
  const emailOk = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email);
  const linkOk = (id: string) => validLink(links[id] || '');

  const share = async () => {
    const url = `${window.location.origin}/checkout/?share=${encodeShare(items.map(i => ({ ...i, link: links[i.id] || i.link })))}`;
    try { await navigator.clipboard.writeText(url); setStatus('Payment link copied to clipboard.'); } catch { window.prompt('Copy this payment link:', url); }
  };
  const pay = async (e: React.FormEvent) => {
    e.preventDefault(); setTouched(true);
    if (!emailOk) { setStatus('Please enter a valid email address.'); return; }
    const bad = items.find(i => !linkOk(i.id)); if (bad) { setStatus(`Please enter a valid ${bad.platform} username or link for ${bad.service}.`); return; }
    const endpoint = process.env.NEXT_PUBLIC_ORDER_ENDPOINT;
    if (!endpoint) { setStatus("Checkout isn't connected to payments in this preview yet. Nothing was charged or sent."); return; }
    setBusy(true); setStatus('Creating your secure payment…');
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, payment, items: items.map(i => ({ slug: i.slug, tier: i.tier, quantity: i.quantity, price: i.price, link: links[i.id] })) }) });
      if (!res.ok) throw new Error();
      const body = await res.json().catch(() => ({})) as { redirect?: string };
      if (mode.kind === 'cart') writeCart([]); safeSet('session', DIRECT_KEY, null);
      window.location.assign(body.redirect || '/thank-you/');
    } catch { setStatus('Something went wrong. Please try again.'); setBusy(false); }
  };

  if (!items.length) return <div className="yaw-flow yaw-empty-state">
    <h2>Your cart is empty</h2>
    <p>Add services from any service page, or click Buy now to checkout directly.</p>
    <a className="yaw-btn yaw-btn--red" href="/service/">Browse Services</a>
  </div>;

  return <form className="yaw-flow" onSubmit={pay} noValidate>
    <div className="yaw-flow-head"><h2>Checkout</h2><p>Review your order and pay securely. Have an account? <a href="/login/">Log in</a></p></div>
    <label className="yaw-field"><span>Email *</span><input type="email" inputMode="email" autoComplete="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={touched && !emailOk} required /></label>
    <fieldset className="yaw-group"><legend>Where should we deliver?</legend>
      {items.map(item => <label key={item.id} className="yaw-field"><span>{item.service}: {item.platform} username or link</span>
        <input type="text" inputMode="url" autoCapitalize="off" autoCorrect="off" placeholder={serviceBySlug(item.slug)?.linkPlaceholder} value={links[item.id] ?? item.link ?? ''} onChange={e => setLinks({ ...links, [item.id]: e.target.value })} aria-invalid={touched && !linkOk(item.id)} />
      </label>)}
    </fieldset>
    <fieldset className="yaw-group"><legend>Payment method</legend>
      <label className={`yaw-pay${payment === 'crypto' ? ' is-on' : ''}`}><input type="radio" name="payment" checked={payment === 'crypto'} onChange={() => setPayment('crypto')} /><span><b>Crypto</b><small>Pay with BTC, ETH, USDT &amp; 100+ cryptocurrencies via Cryptomus.</small></span></label>
      <label className={`yaw-pay${payment === 'card' ? ' is-on' : ''}`}><input type="radio" name="payment" checked={payment === 'card'} onChange={() => setPayment('card')} /><span><b>Card</b><small>Secure card payment powered by Uplef.</small></span></label>
    </fieldset>
    <section className="yaw-summary" aria-label="Order summary"><h3>Order summary</h3>
      <ul className="yaw-lines">{items.map(item => <li key={item.id} className="yaw-line">
        <div><b>{item.service}</b><span>{item.tierLabel} · {qtyLabel(item)}</span></div>
        <div className="yaw-line-end"><b>{money(item.price)}</b><button type="button" onClick={() => remove(item.id)}>Remove</button></div>
      </li>)}</ul>
      <div className="yaw-total"><span>Total</span><b>{money(sum)}</b></div>
      <div className="yaw-trust"><span>🔒 Secure</span><span>✓ Encrypted</span><span>{payment === 'crypto' ? '₿ Crypto' : '💳 Card'}</span></div>
    </section>
    {status && <p className="yaw-status" role="status">{status}</p>}
    <div className="yaw-share"><span>Need someone else to pay?</span><button type="button" className="yaw-link-btn" onClick={share}>Share Payment Link</button></div>
    <div className="yaw-sticky-cta">
      <div className="yaw-sticky-sum"><span>{items.length} item{items.length > 1 ? 's' : ''}</span><b>{money(sum)}</b></div>
      <button type="submit" className="yaw-btn yaw-btn--red yaw-btn--block" disabled={busy}>{busy ? 'Please wait…' : `Pay ${money(sum)}`}</button>
    </div>
  </form>;
}

/* ---------------- phone-only bottom tab bar ---------------- */
const TabIcon = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
function TabBar({ route }: { route: string }) {
  const items = useCart();
  const path = route.replace(/\/$/, '') || '/';
  const isServices = path === '/service' || path.startsWith('/buy-') || path === '/youtube-services' || path === '/google-ads';
  const tabs: { label: string; href?: string; active: boolean; icon: string; cart?: boolean }[] = [
    { label: 'Home', href: '/', active: path === '/', icon: 'M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z' },
    { label: 'Services', href: '/service/', active: isServices, icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
    { label: 'Cart', active: false, cart: true, icon: 'M6 7h12l1 13H5L6 7Zm3 0V6a3 3 0 0 1 6 0v1' },
    { label: 'Orders', href: '/orders/', active: path === '/orders', icon: 'M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2V4Zm4 5h6M9 13h6' },
    { label: 'Support', href: '/contact/', active: path === '/contact', icon: 'M4 5h16v11H8l-4 4V5Zm4 5h8' },
  ];
  return <nav className="yaw-tabbar" aria-label="Quick navigation">
    {tabs.map(t => t.cart
      ? <button key={t.label} type="button" className="yaw-tabbar-item" onClick={openDrawer}><span className="yaw-tabbar-icon"><TabIcon d={t.icon} />{items.length > 0 && <i>{items.length}</i>}</span>{t.label}</button>
      : <a key={t.label} href={t.href} className={`yaw-tabbar-item${t.active ? ' is-active' : ''}`} aria-current={t.active ? 'page' : undefined}><span className="yaw-tabbar-icon"><TabIcon d={t.icon} /></span>{t.label}</a>)}
  </nav>;
}

/* ---------------- mount everything into the template ---------------- */
type Mounts = { purchase: { el: Element; service: Service }[]; flow: { el: Element; kind: string }[]; navs: Element[] };
export default function Commerce({ route }: { route: string }) {
  const [mounts, setMounts] = useState<Mounts>({ purchase: [], flow: [], navs: [] });
  useEffect(() => {
    const purchase = Array.from(document.querySelectorAll('[data-yaw-purchase]')).flatMap(el => { const s = serviceBySlug(el.getAttribute('data-yaw-purchase')); return s ? [{ el, service: s }] : []; });
    const flow = Array.from(document.querySelectorAll('[data-yaw-mount]')).map(el => ({ el, kind: el.getAttribute('data-yaw-mount') || '' }));
    // One cart button per nav variant, placed just before the Login button.
    const navs = Array.from(document.querySelectorAll('#template-root nav')).flatMap(nav => {
      const login = nav.querySelector('a[href="/login"]')?.closest('[class$="-container"]');
      if (!login || nav.querySelector('.yaw-cart-host')) return [];
      const host = document.createElement('div'); host.className = 'yaw-cart-host'; login.before(host); return [host];
    });
    setMounts({ purchase, flow, navs });
    return () => navs.forEach(h => h.remove());
  }, [route]);
  const flows = useMemo(() => ({ 'get-started': GetStarted, checkout: Checkout } as Record<string, () => ReactElement>), []);
  return <>
    {mounts.purchase.map(({ el, service }, i) => createPortal(<PurchasePanel service={service} />, el, `p${i}`))}
    {mounts.flow.map(({ el, kind }, i) => { const C = flows[kind]; return C ? createPortal(<C />, el, `f${i}`) : null; })}
    {mounts.navs.map((el, i) => createPortal(<CartButton />, el, `n${i}`))}
    <CartDrawer />
    {!/^\/(checkout|get-started)\/?$/.test(route) && <TabBar route={route} />}
  </>;
}
