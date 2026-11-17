// Builds the account and ordering pages (login, sign up, forgot password, my orders, checkout)
// from the Contact page template, so they share its hero, form card, side card and footer.
// The original site handled these on its own domain; the revamp now serves them itself.
// Run: node scripts/build-account-pages.mjs
import fs from 'node:fs';
import * as c from 'cheerio';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const contact = read('data/pages/contact.json');
const home = read('data/pages/home.json');
const catalog = read('data/youtubeadwords-catalog.json');
const routes = read('data/routes.json');
const homeNav = c.load(home.html, null, false)('nav');

const SERVICE_INFO = {
  'buy-youtube-views': ['YouTube Views', 'Video link', 'https://youtube.com/watch?v=…'],
  'buy-youtube-subscribers': ['YouTube Subscribers', 'Channel link', 'https://youtube.com/@yourchannel'],
  'buy-youtube-likes': ['YouTube Likes', 'Video link', 'https://youtube.com/watch?v=…'],
  'buy-youtube-watch-hours': ['YouTube Watch Hours', 'Channel link', 'https://youtube.com/@yourchannel'],
  'buy-google-skip-ads-views': ['Google Skip Ads Views', 'Video link', 'https://youtube.com/watch?v=…'],
  'buy-google-display-ads-views': ['Google Display Ads Views', 'Video or website link', 'https://…'],
  'buy-google-apps-download': ['Google Apps Download', 'App store link', 'https://play.google.com/store/apps/details?id=…'],
  'buy-google-ads-website-traffic': ['Google Ads Website / App Traffic', 'Website or app link', 'https://yourwebsite.com'],
};
const DEFAULT_TIERS = { regular: 'Standard', fast: 'Fast', ads: 'Ads' };
const tabNames = Object.fromEntries(catalog.content.map(item => [item.slug, item.tabs || {}]));
const checkoutCatalog = catalog.pricing.map(p => {
  const [name, linkLabel, linkPlaceholder] = SERVICE_INFO[p.slug] || [p.slug, 'Link', 'https://…'];
  const tiers = [['regular', 'regularPackages'], ['fast', 'fastPackages'], ['ads', 'adsPackages']]
    .filter(([, key]) => (p[key] || []).length)
    .map(([tier, key]) => ({ key: tier, label: String(tabNames[p.slug]?.[tier] || DEFAULT_TIERS[tier]).replace(/\s*popular$/i, ''), packages: p[key].map(({ quantity, price, originalPrice }) => ({ quantity, price, originalPrice })) }));
  return { slug: p.slug, name, unit: p.quantityKey, linkLabel, linkPlaceholder, tiers };
});

const PAGES = [
  {
    key: 'login', route: '/login', title: 'Login | YoutubeADwords', description: 'Sign in to your YoutubeADwords account to see your orders, receipts and support tickets.',
    badge: 'Login', words: ['Welcome', 'back', 'to'], script: 'growth', sticker: 'Member pass',
    subtitle: 'Sign in to your YoutubeADwords account to see your orders, receipts and support tickets.',
    formTitle: 'Sign in', kind: 'login', submit: 'Login',
    fields: [
      { label: 'Email or Username', name: 'email', placeholder: 'email@example.com or username', required: true, autocomplete: 'username' },
      { label: 'Password', name: 'password', type: 'password', placeholder: 'Enter your password', required: true, autocomplete: 'current-password' },
      { checkbox: true, name: 'remember', html: 'Remember me' },
    ],
    note: 'Forgot your password? <a class="framer-text" href="/forgot-password">Reset it here</a>. Don’t have an account? <a class="framer-text" href="/signup">Sign up here</a>.',
    chat: { incoming: 'Welcome back! Your account keeps every order, receipt and support ticket in one place.', outgoing: 'Where do I track my order? 📦', button: ['Open My Orders', '/orders'] },
    info: [['Member pass', 'YAW-0001'], ['Inside', 'Your orders, receipts and support tickets'], ['Security', 'We never ask for your social media passwords']],
    faq: false,
  },
  {
    key: 'signup', route: '/signup', title: 'Sign Up | YoutubeADwords', description: 'Create a YoutubeADwords account to keep your orders and receipts in one place.',
    badge: 'Sign up', words: ['Create', 'your', 'account'], script: 'today', sticker: 'Free to join',
    subtitle: 'Your account holds your orders and receipts. Every service, one checkout. We never ask for your social media passwords.',
    formTitle: 'Create account', kind: 'signup', submit: 'Create Account',
    fields: [
      { label: 'First Name', name: 'firstName', placeholder: 'John', required: true, autocomplete: 'given-name' },
      { label: 'Last Name', name: 'lastName', placeholder: 'Doe', required: true, autocomplete: 'family-name' },
      { label: 'Username', name: 'username', placeholder: 'johndoe', required: true, autocomplete: 'username' },
      { label: 'Email Address', name: 'email', type: 'email', placeholder: 'your.email@example.com', required: true, autocomplete: 'email' },
      { label: 'Password', name: 'password', type: 'password', placeholder: 'At least 8 characters', required: true, autocomplete: 'new-password', minlength: 8 },
      { label: 'Confirm Password', name: 'confirmPassword', type: 'password', placeholder: 'Confirm your password', required: true, autocomplete: 'new-password', minlength: 8 },
      { checkbox: true, name: 'agreeToTerms', required: true, html: 'I agree to the <a class="framer-text" href="/terms">Terms of Service</a> and <a class="framer-text" href="/privacy-policy">Privacy Policy</a>*' },
    ],
    note: 'Already have an account? <a class="framer-text" href="/login">Log in</a>.',
    chat: { incoming: 'Your account holds your orders and receipts. Orders placed as a guest appear once you sign up with the same email.', outgoing: 'Do you need my YouTube password? 🔒', button: ['Browse services', '/service'] },
    info: [['Member pass', 'YAW-NEW'], ['Access', 'Every service, one checkout'], ['Privacy', 'We never ask for your social media passwords']],
    faq: false,
  },
  {
    key: 'forgot-password', route: '/forgot-password', title: 'Reset Password | YoutubeADwords', description: 'Reset the password for your YoutubeADwords account.',
    badge: 'Password reset', words: ['Get', 'back', 'to'], script: 'growth', sticker: 'Takes a minute',
    subtitle: 'Enter the email address on your account and we’ll send you a link to choose a new password.',
    formTitle: 'Reset your password', kind: 'forgot', submit: 'Send reset link',
    fields: [{ label: 'Email Address', name: 'email', type: 'email', placeholder: 'your.email@example.com', required: true, autocomplete: 'email', wide: true }],
    note: 'Remembered it? <a class="framer-text" href="/login">Back to login</a>.',
    chat: { incoming: 'Can’t sign in? Reset your password here, or contact support with your order number.', outgoing: 'I forgot my password 🙈', button: ['Contact support', '/contact'] },
    info: [['Email', 'Contact support'], ['Support', '24/7 · Replies within 24 hours'], ['Security', 'We never ask for your social media passwords']],
    faq: false,
  },
  {
    key: 'orders', route: '/orders', title: 'My Orders | YoutubeADwords', description: 'Every order you place with YoutubeADwords, and how far its delivery has got.',
    badge: 'My orders', words: ['Track', 'every', 'order'], script: 'live', sticker: 'Delivery tracking',
    subtitle: 'Every order you place, and how far its delivery has got.',
    formTitle: 'Your orders', kind: 'orders',
    filters: ['All orders', 'Awaiting payment', 'Processing', 'Completed'],
    empty: ['Log in to see your orders', 'Orders placed as a guest appear here once you sign up with the same email address.'],
    links: [['Log in', '/login'], ['Sign up', '/signup']],
    note: 'Looking for something new? <a class="framer-text" href="/service">Browse services</a>.',
    chat: { incoming: 'Something looks wrong with a delivery? Send us the order number and we’ll check it.', outgoing: 'Where is my order? 👀', button: ['Contact support', '/contact'] },
    info: [['Email', 'Contact support'], ['Refunds', 'Read the refund policy'], ['Support', '24/7 · Replies within 24 hours']],
    faq: true,
  },
  {
    key: 'checkout', route: '/checkout', title: 'Checkout | YoutubeADwords', description: 'Choose your package, share a public link and place your YoutubeADwords order.',
    badge: 'Checkout', words: ['Place', 'your', 'order'], script: 'now', sticker: 'No passwords',
    subtitle: 'Choose your package, share a public link and follow delivery from My Orders. We never ask for your password.',
    formTitle: 'Your order', kind: 'checkout', submit: 'Continue to payment',
    fields: [
      { label: 'Service', name: 'service', select: true, required: true },
      { label: 'Package', name: 'package', select: true, required: true },
      { label: 'Video link', name: 'link', type: 'url', placeholder: 'https://youtube.com/watch?v=…', required: true },
      { label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@example.com', required: true, autocomplete: 'email' },
    ],
    note: 'By continuing, you agree to the <a class="framer-text" href="/terms">Terms of Service</a> and <a class="framer-text" href="/refund-policy">Refund Policy</a>.',
    chat: { incoming: 'Share a public link only, never a password. After ordering, follow delivery from My Orders.', outgoing: 'Ready to grow 🚀', button: ['Need help? Contact support', '/contact'] },
    info: [['Service', '—', 'service'], ['Package', '—', 'package'], ['Total', '—', 'total']],
    faq: true,
  },
];


function buildPage(spec) {
  const data = structuredClone(contact);
  const $ = c.load(data.html, null, false);
  $('nav').each((i, e) => { const replacement = homeNav.eq(i); if (replacement.length) $(e).replaceWith(replacement.clone()); });

  // Hero copy
  const hero = $('section').first();
  hero.find('[data-framer-name="White"] p').first().text(spec.badge);
  const title = hero.find('[data-framer-name="Title"]').first();
  title.children('div').filter((i, e) => $(e).children('h1').length).slice(0, 3).each((i, e) => $(e).children('h1').text(spec.words[i] || ''));
  // The script word lives in a nested "Title" block; scope to it so the three words above stay put.
  title.find('[data-framer-name="Title"]').first().find('h1').text(spec.script);
  title.find('[data-framer-name="Badge 01"] .framer-text').first().text(spec.sticker);
  hero.find('h1').filter((i, e) => $(e).text().startsWith('Have a question')).text(spec.subtitle);

  // Form card
  const form = $('form').first();
  form.attr('data-yaw-form', spec.kind).attr('novalidate', null);
  form.children('input, noscript').remove();
  form.find('[data-framer-name="Title"] h2').first().text(spec.formTitle);
  const radios = form.children('[data-framer-name="Service"]');
  const fieldTemplate = form.children('label[data-framer-name="Your Name"]').first().clone();
  form.children('label').remove();
  const bottom = form.children('[data-framer-name="Bottom"]').first();
  bottom.find('label[data-framer-name="Message"]').remove();

  if (spec.filters) {
    radios.find('.framer-text').first().text('Show');
    radios.find('label').each((i, e) => {
      const label = $(e);
      if (i >= spec.filters.length) { label.remove(); return; }
      label.attr('data-framer-name', spec.filters[i]);
      label.find('input').attr('name', 'filter').attr('value', spec.filters[i]).attr('checked', i === 0 ? 'checked' : null);
      label.find('p').first().text(spec.filters[i]);
    });
    radios.after(`<div class="yaw-empty" data-orders-empty><h3 class="framer-text">${spec.empty[0]}</h3><p class="framer-text">${spec.empty[1]}</p></div>`);
  } else radios.remove();

  const fields = (spec.fields || []).map(field => {
    if (field.checkbox) return `<label class="yaw-check"><input type="checkbox" name="${field.name}"${field.required ? ' required' : ''}><span>${field.html}</span></label>`;
    const node = fieldTemplate.clone();
    node.attr('data-framer-name', field.label).attr('style', field.wide ? 'grid-column:1 / -1' : null);
    node.find('p').first().text(field.label + (field.required ? '*' : ''));
    const input = node.find('input').first();
    if (field.select) input.replaceWith(`<select class="framer-form-input yaw-select" name="${field.name}"${field.required ? ' required' : ''}></select>`);
    else {
      input.attr({ name: field.name, type: field.type || 'text', placeholder: field.placeholder || '', autocomplete: field.autocomplete || null, minlength: field.minlength || null });
      if (!field.required) input.removeAttr('required');
    }
    return $.html(node);
  });
  bottom.before(fields.join(''));

  // Note + submit (or plain links for My Orders)
  bottom.find('[data-framer-name="Bottom"] p').first().html(spec.note);
  const buttonBox = bottom.find('button').first().closest('[class$="-container"]');
  if (spec.links) {
    const anchorVariants = $('[data-framer-name="Right"] a.framer-n7Y0o').first().closest('[class$="-container"]');
    const group = $('<div class="yaw-actions"></div>');
    spec.links.forEach(([label, href], i) => {
      const box = anchorVariants.clone();
      box.find('a').attr('href', href).attr('data-framer-name', i ? 'Light' : null);
      box.find('a p').text(label);
      group.append(box);
    });
    buttonBox.replaceWith(group);
  } else buttonBox.find('button p').text(spec.submit);

  // Side card
  const side = $('[data-framer-name="Right"]').filter((i, e) => $(e).find('[data-framer-name="Avatar"]').length).first();
  side.find('[data-framer-name="Avatar"] img').attr('src', '/assets/yaw-mark.svg').attr('alt', 'YoutubeADwords');
  const chat = side.find('[data-framer-name="Bottom"]').first();
  chat.find('[data-framer-name="Top"] p').first().text(spec.chat.incoming);
  chat.children('[data-framer-name="Bottom"]').find('p').first().text(spec.chat.outgoing);
  chat.find('a.framer-n7Y0o').attr('href', spec.chat.button[1]).find('p').text(spec.chat.button[0]);
  side.children('[data-framer-name="Bottom"]').children().each((i, row) => {
    const [label, value, key] = spec.info[i] || [];
    const ps = $(row).find('p');
    ps.eq(0).text(label || '');
    ps.eq(1).text(value || '');
    if (key) ps.eq(1).attr('data-checkout', key);
  });

  if (!spec.faq) $('section').filter((i, e) => $(e).find('[data-framer-name="Question"]').length).remove();
  if (spec.kind === 'checkout') $.root().append(`<script type="application/json" id="yaw-catalog">${JSON.stringify(checkoutCatalog).replace(/</g, '\\u003c')}</script>`);

  data.route = spec.route; data.title = spec.title; data.description = spec.description; data.html = $.html();
  fs.writeFileSync(`data/pages/${spec.key}.json`, JSON.stringify(data));
  const entry = routes.find(r => r.route === spec.route);
  if (entry) Object.assign(entry, { key: spec.key, title: spec.title }); else routes.push({ route: spec.route, key: spec.key, title: spec.title });
}

PAGES.forEach(buildPage);
fs.writeFileSync('data/routes.json', JSON.stringify(routes, null, 2));
console.log('Built', PAGES.map(p => p.route).join(', '));
