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
- `data/pages/`: 47 routes, including YouTube and Google Ads service directories, eight product pages, About, Contact, and source company policies. Legacy template URLs remain compatible.
- `data/youtubeadwords-catalog.json`: all eight services' published pricing tiers, including regular, fast, ads and country-targeted options. Also includes the source's four YouTube service content objects and FAQs.
- `data/youtubeadwords-source.json`: source-page content captured on 17 November 2026.
- `data/service-catalog.json`: service labels, starting prices, and existing purchase destinations.
- `components/TemplateInteractions.tsx`: responsive variants, Framer Motion animations, tickers, FAQs, case selector, mobile menu, and local form validation.

Source: https://youtubeadwords.long-bar-2706.workers.dev/

Prices are a captured USD snapshot, not a live pricing feed. Product cards link to the existing site's purchase flow; login and orders also use the existing site. No accounts, order records or private customer data were accessed or migrated. The source blog could not load during review. Seven new editorial guides based on the imported service catalogue are provided locally; they are not recovered source-site posts. Edit them in `data/blog-posts.json`.

All package tiers and the complete captured service text are available under each product page's “All packages, features and service details” accordion.

Forms validate locally. Set `NEXT_PUBLIC_FORM_ENDPOINT` to an authorized form handler to deliver submissions. Without it, the preview explicitly states that nothing was sent. This frontend does not implement a payment, account or support backend.

Original design: Growth Haus by Webestica. Existing template artwork and photographs are preserved at the user's request. Claims and testimonials are adapted from the supplied business site, not independently verified.

The original `scripts/import-template.mjs` imports the uncustomized design and will overwrite customized content; do not run it as a content update.
