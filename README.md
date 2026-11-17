# YoutubeADwords — frontend revamp

Next.js App Router, TypeScript, React and Framer Motion. Retains the Growth Haus template's original CSS, responsive layouts, photography, artwork and motion, with YoutubeADwords branding and service content.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. `npm run build` produces the static export in `out/`.

## Content

- `data/blog-posts.json`: seven local editorial guides with author and content provenance.
- `data/pages/`: 52 routes, including YouTube and Google Ads service directories, eight product pages, About, Contact, source company policies, and the account and ordering pages (Login, Sign Up, Forgot Password, My Orders, Checkout). Legacy template URLs remain compatible.
- `scripts/build-account-pages.mjs`: regenerates the account and ordering pages from the Contact page template. Re-run it after changing the Contact page, nav or footer.
- `data/youtubeadwords-catalog.json`: all eight services' published pricing tiers, including regular, fast, ads and country-targeted options. Also includes the source's four YouTube service content objects and FAQs.
- `data/youtubeadwords-source.json`: source-page content captured on 17 November 2026.
- `data/service-catalog.json`: service labels, starting prices, and local checkout destinations.
- `components/TemplateInteractions.tsx`: responsive variants, Framer Motion animations, tickers, FAQs, case selector, mobile menu, and local form validation.

Source: https://youtubeadwords.long-bar-2706.workers.dev/

Prices are a captured USD snapshot, not a live pricing feed. Every link stays on this site, and Login, Sign Up, My Orders and Tickets / Support are local pages.

Desktop and tablet (810px and wider) keep the original revamp design: package cards link to `/checkout`, whose form handles the order. Phones (below 810px) get an app-style purchase flow copied from the original site instead (`components/Commerce.tsx`, service data in `data/commerce.ts`; elements marked `data-yaw-phone-only` / `data-yaw-desktop-only` switch at 810px): each product page has tier tabs and a package picker with **Buy now** and **Add to cart** (plus a sticky buy bar on phones). Buy now opens `/get-started` (link, email, package, promotions opt-in) and then `/checkout`; Add to cart saves to the browser (`localStorage` key `yaw-cart`) and opens the cart drawer (bottom sheet on phones), whose **Proceed to Checkout** leads to `/checkout`. Checkout asks for email, a delivery link per item, crypto (Cryptomus) or card (Uplef) payment, shows the order summary, and can copy a shareable payment link. Phones also get a bottom tab bar (Home, Services, Cart, Orders, Support) and a full app-style menu. No accounts, order records or private customer data were accessed or migrated. The source blog could not load during review. Seven new editorial guides based on the imported service catalogue are provided locally; they are not recovered source-site posts. Edit them in `data/blog-posts.json`.

All package tiers and the complete captured service text are available under each product page's “All packages, features and service details” accordion.

Forms validate locally. Set `NEXT_PUBLIC_FORM_ENDPOINT` to an authorized form handler to deliver contact submissions. Login, sign-up and password-reset forms post only to `NEXT_PUBLIC_ACCOUNT_ENDPOINT`, and checkout posts only to `NEXT_PUBLIC_ORDER_ENDPOINT` (a JSON response with `redirect` sends the visitor on, e.g. to payment). Without these, each form explicitly states that nothing was sent or charged. This frontend does not implement a payment, account or support backend.

The hero camera photo (`public/assets/hero-camera*.jpg`, also on About) and the "Real, Safe growth" and featured blog photos (`public/assets/creator-*.jpg`, also on Blog) are free Pexels photos (Pexels License). The About us button uses the red "AD" brand mark (`public/assets/yaw-mark.svg`).

Original design: Growth Haus by Webestica. Existing template artwork and photographs are preserved at the user's request. Claims and testimonials are adapted from the supplied business site, not independently verified.

The original `scripts/import-template.mjs` imports the uncustomized design and will overwrite customized content; do not run it as a content update.
