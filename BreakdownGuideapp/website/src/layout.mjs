/**
 * Go BARRY marketing site — shared page shell
 *
 * Every page is plain server-rendered HTML (no client framework), so search
 * engines and link previews see the full content, and pages load fast.
 */

export const SITE = {
  name: 'Go BARRY',
  origin: 'https://gobarry.co.uk',
  app: 'https://breakdowns.gobarry.co.uk',
  email: 'gair@gairware.com',
  ogImage: 'https://gobarry.co.uk/img/og-image.png',
  locale: 'en_GB',
};

export const NAV = [
  { href: '/bus-breakdown-management-software/', label: 'Breakdowns' },
  { href: '/bus-engineering-dispatch-software/', label: 'Engineering' },
  { href: '/bus-diversion-planning-software/', label: 'Diversions' },
  { href: '/live-bus-route-status/', label: 'Route status' },
  { href: '/about/', label: 'About' },
];

export const FOOTER = [
  {
    title: 'Platform',
    links: [
      { href: '/bus-breakdown-management-software/', label: 'Breakdown management' },
      { href: '/bus-engineering-dispatch-software/', label: 'Engineering dispatch' },
      { href: '/replacement-bus-dead-mileage/', label: 'Replacement vehicles & dead mileage' },
      { href: '/bus-diversion-planning-software/', label: 'Diversion planning' },
      { href: '/live-bus-route-status/', label: 'Route status & timetables' },
      { href: '/bus-fleet-intelligence/', label: 'Fleet intelligence' },
    ],
  },
  {
    title: 'Who it’s for',
    links: [
      { href: '/bus-operators/', label: 'Bus operators' },
      { href: '/coach-operators/', label: 'Coach & independent operators' },
      { href: '/transport-authorities/', label: 'Councils & transport authorities' },
    ],
  },
  {
    title: 'Go BARRY',
    links: [
      { href: '/about/', label: 'About' },
      { href: '/contact/', label: 'Contact' },
      { href: SITE.app, label: 'Try the live demo' },
      { href: SITE.app, label: 'Sign in' },
      { href: '/privacy/', label: 'Privacy' },
    ],
  },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ICON = `<svg class="logo-icon" viewBox="0 0 64 80" aria-hidden="true" focusable="false"><defs><linearGradient id="gbPin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00D4FF"/><stop offset=".5" stop-color="#00A8E8"/><stop offset="1" stop-color="#0077B6"/></linearGradient></defs><path d="M32 2C17.088 2 5 14.088 5 29c0 20.25 24.5 47 26 48.5.5.5 1.5.5 2 0C34.5 76 59 49.25 59 29 59 14.088 46.912 2 32 2z" fill="url(#gbPin)"/><rect x="18" y="16" width="28" height="24" rx="4" fill="#0A2540"/><rect x="21" y="19" width="22" height="10" rx="2" fill="#fff"/><rect x="21" y="32" width="22" height="3" rx="1" fill="#00D4FF"/><circle cx="24" cy="38" r="2" fill="#fff"/><circle cx="40" cy="38" r="2" fill="#fff"/><polyline points="12,52 20,52 24,46 28,58 32,48 36,56 40,52 52,52" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const logo = `<a class="logo" href="/" aria-label="Go BARRY home">${ICON}<span class="logo-text"><span class="logo-go">Go</span>Barry</span></a>`;

function jsonLd(data) {
  if (!data) return '';
  const list = Array.isArray(data) ? data : [data];
  return list.map(d => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`).join('\n');
}

export function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE.origin}${it.path}`,
    })),
  };
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
    })),
  };
}

export function faqHtml(faqs, heading = 'Frequently asked questions') {
  return `<section class="section faq" aria-labelledby="faq-h">
  <div class="wrap narrow">
    <h2 id="faq-h">${heading}</h2>
    ${faqs.map(f => `<details class="faq-item"><summary>${f.q}</summary><div class="faq-a"><p>${f.a}</p></div></details>`).join('\n    ')}
  </div>
</section>`;
}

/** A product screenshot in a browser frame, responsive, lazy unless `eager` */
export function shot(name, alt, { eager = false, caption = '' } = {}) {
  return `<figure class="shot">
  <div class="shot-frame"><span class="shot-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <img src="/img/${name}.webp" srcset="/img/${name}-800.webp 800w, /img/${name}.webp 1440w" sizes="(max-width: 900px) 100vw, 1100px" width="1440" height="860" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>
  </div>${caption ? `\n  <figcaption>${caption}</figcaption>` : ''}
</figure>`;
}

export function ctaBand({ title = 'See it working on a real-looking operation', text = 'The live demo opens instantly with sample depots, breakdowns, engineers and a diversion in force. No account or sign-up needed.' } = {}) {
  return `<section class="section cta-band" aria-label="Try Go BARRY">
  <div class="wrap cta-inner">
    <div>
      <h2>${title}</h2>
      <p>${text}</p>
    </div>
    <div class="cta-actions">
      <a class="btn btn-primary" href="${SITE.app}">Try the live demo</a>
      <a class="btn btn-ghost" href="/contact/">Talk to us</a>
    </div>
  </div>
</section>`;
}

export function related(links) {
  return `<section class="section related" aria-labelledby="rel-h">
  <div class="wrap">
    <h2 id="rel-h" class="h-small">Also in Go BARRY</h2>
    <div class="rel-grid">
      ${links.map(l => `<a class="rel-card" href="${l.href}"><strong>${l.title}</strong><span>${l.text}</span></a>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

/**
 * @param {object} page
 * @param {string} page.path        e.g. '/about/'
 * @param {string} page.title       <title>, ~60 chars
 * @param {string} page.description meta description, ~155 chars
 * @param {string} page.body        main HTML
 * @param {object|object[]} [page.schema] JSON-LD
 * @param {boolean} [page.noindex]
 */
export function render(page) {
  const url = `${SITE.origin}${page.path}`;
  const navLinks = NAV.map(n => `<a href="${n.href}"${n.href === page.path ? ' aria-current="page"' : ''}>${n.label}</a>`).join('');
  const footerCols = FOOTER.map(col => `<div class="foot-col"><h3>${col.title}</h3><ul>${col.links.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}</ul></div>`).join('');
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
${page.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="theme-color" content="#0b1220">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Go BARRY">
<meta property="og:locale" content="${SITE.locale}">
<meta property="og:title" content="${esc(page.ogTitle || page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Go BARRY control room software for bus operators">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/outfit-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css?v=${page.version}">
${jsonLd(page.schema)}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap head-inner">
    ${logo}
    <nav class="nav" aria-label="Main">${navLinks}</nav>
    <div class="head-cta">
      <a class="signin" href="${SITE.app}">Sign in</a>
      <a class="btn btn-primary btn-sm" href="${SITE.app}">Try the demo</a>
    </div>
    <details class="menu">
      <summary aria-label="Menu"><span></span><span></span><span></span></summary>
      <div class="menu-panel">
        ${NAV.map(n => `<a href="${n.href}">${n.label}</a>`).join('\n        ')}
        <a href="/contact/">Contact</a>
        <a class="btn btn-primary" href="${SITE.app}">Try the live demo</a>
      </div>
    </details>
  </div>
</header>
<main id="main">
${page.body}
</main>
<footer class="site-foot">
  <div class="wrap foot-inner">
    <div class="foot-brand">
      ${logo}
      <p>Control room software for bus and coach operators. Built by a bus supervisor, configured around your operation.</p>
      <p><a href="mailto:${SITE.email}">${SITE.email}</a></p>
    </div>
    ${footerCols}
  </div>
  <div class="wrap foot-base">
    <span>© ${new Date().getFullYear()} Go BARRY · Made by <a href="https://gairware.com" rel="noopener">GairWare</a></span>
  </div>
</footer>
${page.scripts || ''}
</body>
</html>
`;
}
