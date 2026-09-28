/**
 * Go BARRY marketing site — page content
 *
 * Copy rules: only describe what the product does today; no usage, customer
 * or traction claims; no figures from any one operator's network.
 */

import { SITE, shot, ctaBand, related, faqHtml, faqSchema, breadcrumb } from './layout.mjs';

const ORG = {
  '@type': 'Organization',
  '@id': `${SITE.origin}/#org`,
  name: 'Go BARRY',
  url: `${SITE.origin}/`,
  logo: `${SITE.origin}/apple-touch-icon.png`,
  email: SITE.email,
  founder: { '@type': 'Person', name: 'Anthony Gair' },
  parentOrganization: { '@type': 'Organization', name: 'GairWare', url: 'https://gairware.com' },
};

const SOFTWARE = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${SITE.origin}/#software`,
  name: 'Go BARRY',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Bus and coach operations software',
  operatingSystem: 'Web browser',
  url: `${SITE.origin}/`,
  description: 'Control room software for bus and coach operators: guided breakdown handling, engineering dispatch, replacement vehicles and dead mileage, diversion planning around road closures, and live route status.',
  featureList: [
    'Guided breakdown assessments',
    'Real-time operations board',
    'Engineering dispatch with live ETAs',
    'Engineer rosters and shift patterns',
    'Replacement vehicle dispatch and dead mileage recording',
    'Diversion planning around road closures with printable driver sheets',
    'Live route status from GTFS timetables',
    'Timetables and stop departures',
    'Fleet defect analysis and reporting',
  ],
  screenshot: `${SITE.origin}/img/operations.webp`,
  author: { '@id': `${SITE.origin}/#org` },
  publisher: { '@id': `${SITE.origin}/#org` },
};

// ── Shared snippets ───────────────────────────────────────────────────────────

const pageHead = ({ kicker, h1, lead, actions = true }) => `<section class="page-hero">
  <div class="wrap narrow">
    ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
    <h1>${h1}</h1>
    <p class="lead">${lead}</p>
    ${actions ? `<div class="hero-actions"><a class="btn btn-primary" href="${SITE.app}">Try the live demo</a><a class="btn btn-ghost" href="/contact/">Talk to us</a></div>` : ''}
  </div>
</section>`;

const checklist = (items) => `<ul class="checks">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

const split = ({ id, title, html, img, alt, flip = false }) => `<section class="section split${flip ? ' flip' : ''}"${id ? ` id="${id}"` : ''}>
  <div class="wrap split-inner">
    <div class="split-text">
      <h2>${title}</h2>
      ${html}
    </div>
    <div class="split-media">${shot(img, alt)}</div>
  </div>
</section>`;

const FEATURES = [
  { href: '/bus-breakdown-management-software/', title: 'Breakdown management', text: 'Guided assessments turn a driver’s call into a consistent decision, logged from first call to back in service.' },
  { href: '/bus-engineering-dispatch-software/', title: 'Engineering dispatch', text: 'See every job by stage, send the nearest engineer with the right skills, and watch their ETA count down.' },
  { href: '/replacement-bus-dead-mileage/', title: 'Replacement vehicles', text: 'Send a replacement from the right depot and record the dead mileage for every one.' },
  { href: '/bus-diversion-planning-software/', title: 'Diversion planning', text: 'Mark a road closure on the map, compare diversion routes, and print a driver sheet in minutes.' },
  { href: '/live-bus-route-status/', title: 'Route status & timetables', text: 'Every route coloured by disruption, with timetables and stop departures a click away.' },
  { href: '/bus-fleet-intelligence/', title: 'Fleet intelligence', text: 'Spot the vehicles and faults that keep coming back, with KPIs and reports for managers.' },
];

const featureCards = (exclude) => `<div class="card-grid">
  ${FEATURES.filter(f => f.href !== exclude).map(f => `<a class="card" href="${f.href}"><h3>${f.title}</h3><p>${f.text}</p><span class="card-more">Learn more</span></a>`).join('\n  ')}
</div>`;

const relatedFor = (exclude) => related(FEATURES.filter(f => f.href !== exclude).slice(0, 3));

// ── Enquiry form (home + contact) ─────────────────────────────────────────────

const enquiryForm = `<form class="enquiry" id="enquiry" novalidate>
  <div class="form-grid">
    <label>Your name<input name="name" autocomplete="name" required></label>
    <label>Company<input name="company" autocomplete="organization" required></label>
    <label>Work email<input name="email" type="email" autocomplete="email" required></label>
    <label>Phone <em>optional</em><input name="phone" type="tel" autocomplete="tel"></label>
    <label>Your role <em>optional</em><input name="role" autocomplete="organization-title" placeholder="e.g. Operations manager"></label>
    <label>Fleet size <em>optional</em>
      <select name="fleetSize">
        <option value="">Choose</option>
        <option>Under 25 vehicles</option>
        <option>25–100 vehicles</option>
        <option>100–500 vehicles</option>
        <option>500+ vehicles</option>
      </select>
    </label>
  </div>
  <label class="full">What would you like to know? <em>optional</em><textarea name="message" rows="4" placeholder="Tell us a little about your operation or what you’re looking for"></textarea></label>
  <label class="hp" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label>
  <div class="form-foot">
    <button class="btn btn-primary" type="submit">Send enquiry</button>
    <p class="form-note">We’ll only use your details to reply. See our <a href="/privacy/">privacy notice</a>.</p>
  </div>
  <p class="form-status" role="status" aria-live="polite"></p>
</form>`;

const FORM_SCRIPT = `<script src="/site.js?v=1" defer></script>`;

// ── Pages ─────────────────────────────────────────────────────────────────────

const HOME_FAQS = [
  { q: 'What is Go BARRY?', a: 'Go BARRY is control room software for bus and coach operators. It brings breakdown handling, engineering dispatch, replacement vehicles, diversions around road closures and live route status into one real-time platform that runs in a web browser.' },
  { q: 'Who is it for?', a: 'Control room and operations supervisors, engineering teams and managers at bus and coach operators of any size, plus councils and transport authorities who need a clear picture of disruption on their network.' },
  { q: 'Can I try it before talking to anyone?', a: 'Yes. The live demo opens instantly with sample depots, breakdowns, engineers and a diversion in force. No account or sign-up is needed.' },
  { q: 'Can it be set up around how we work?', a: 'Yes. Depots, routes, fleet, engineers, shift patterns, diagnostic assessments and dashboards are configured for each operator, and it can be tailored further on request.' },
  { q: 'Does it work outside the UK?', a: 'Yes. Go BARRY reads GTFS, the open timetable format published by bus and transit agencies worldwide, so it can work with any network that publishes GTFS data.' },
  { q: 'What do we need to get started?', a: 'Your fleet list, your depots, and your timetable data in GTFS format. Supervisors and engineers are then set up with their own sign-ins.' },
  { q: 'What does it cost?', a: 'Pricing depends on the size of your fleet and what you need. <a href="/contact/">Get in touch</a> and we’ll give you a clear quote.' },
];

export const PAGES = [
  {
    path: '/',
    title: 'Bus Breakdown & Control Room Software for Operators | Go BARRY',
    ogTitle: 'Go BARRY — control room software for bus and coach operators',
    description: 'Control room software for bus and coach operators: guided breakdown handling, engineering dispatch, diversions and live route status in one platform.',
    priority: '1.0',
    schema: [
      { '@context': 'https://schema.org', ...ORG },
      { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE.origin}/#website`, url: `${SITE.origin}/`, name: 'Go BARRY', publisher: { '@id': `${SITE.origin}/#org` }, inLanguage: 'en-GB' },
      SOFTWARE,
      faqSchema(HOME_FAQS),
    ],
    scripts: FORM_SCRIPT,
    body: `<section class="hero">
  <div class="wrap hero-inner">
    <div class="hero-text">
      <p class="kicker">Breakdown management · Engineering · Diversions</p>
      <h1>Control room software for <span class="accent">bus and coach operators</span></h1>
      <p class="lead">Go BARRY brings breakdowns, engineers, replacement vehicles, diversions and route status into one real-time platform. Built by a bus supervisor, configured around your operation.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="${SITE.app}">Try the live demo</a>
        <a class="btn btn-ghost" href="#enquire">Talk to us</a>
      </div>
      <p class="hero-note">No account needed. The demo opens instantly.</p>
    </div>
    <div class="hero-media">${shot('operations', 'Go BARRY operations board showing live breakdowns, filters, a map and the selected breakdown', { eager: true })}</div>
  </div>
</section>

<section class="strip" aria-label="Why Go BARRY">
  <div class="wrap strip-inner">
    <span>Built by a working bus supervisor</span>
    <span>Configured to your depots, routes and fleet</span>
    <span>Works with standard GTFS timetables</span>
    <span>Runs in a web browser</span>
  </div>
</section>

<section class="section" aria-labelledby="problem-h">
  <div class="wrap">
    <p class="kicker">The problem</p>
    <h2 id="problem-h">Most control rooms still run on yesterday’s tools</h2>
    <p class="section-lead">When something goes wrong on the road, the information chain breaks before the bus does.</p>
    <div class="problem-grid">
      <div><h3>Paper logs and radio</h3><p>Incidents written on paper and passed on by radio. Key details go home in a notebook at the end of the shift.</p></div>
      <div><h3>Scattered spreadsheets</h3><p>Breakdowns in one sheet, mileage in another, diversions in an email. Nothing connected, nothing live.</p></div>
      <div><h3>Slow handovers</h3><p>A new shift starts from scratch. If the handover isn’t perfect, time is lost straight away.</p></div>
      <div><h3>Departments out of step</h3><p>Control, engineering and operations work from different information and make decisions on half the picture.</p></div>
      <div><h3>Inconsistent decisions</h3><p>Whether a bus carries on or comes off the road depends on who takes the call.</p></div>
      <div><h3>The same faults, again</h3><p>Vehicles keep failing the same way, but nobody sees the pattern until the fleet is short on a Monday morning.</p></div>
    </div>
  </div>
</section>

<section class="section alt" aria-labelledby="platform-h">
  <div class="wrap">
    <p class="kicker">The platform</p>
    <h2 id="platform-h">Everything the control room needs, in one place</h2>
    <p class="section-lead">Each part works on its own and together: a breakdown logged in Operations appears on the engineering board, the route status screen and the depot displays at the same moment.</p>
    ${featureCards()}
  </div>
</section>

<section class="section" aria-labelledby="flow-h">
  <div class="wrap">
    <p class="kicker">How it works</p>
    <h2 id="flow-h">From the driver’s call to back in service</h2>
    <ol class="steps">
      <li><h3>The driver calls in</h3><p>The supervisor starts a breakdown. Fleet number, location and the route affected are captured straight away.</p></li>
      <li><h3>Guided assessment</h3><p>A step-by-step assessment walks through the fault and recommends whether the vehicle can continue or needs to come off the road.</p></li>
      <li><h3>Engineer dispatched</h3><p>Go BARRY suggests the nearest on-shift engineer with the right skills. Their ETA counts down on every screen.</p></li>
      <li><h3>Replacement sent</h3><p>If needed, a replacement goes out from the right depot, with dead mileage recorded automatically.</p></li>
      <li><h3>Everyone stays informed</h3><p>Operations, engineering, route status and depot displays update in real time. Nothing falls through the cracks.</p></li>
      <li><h3>Resolved and reported</h3><p>The full timeline is kept, and managers’ KPIs and reports update on their own.</p></li>
    </ol>
  </div>
</section>

${split({ title: 'Engineering sees exactly what needs doing', html: `<p>The engineering dispatch board shows every job by stage: awaiting an engineer, en route, on site and done. Pick a job and Go BARRY suggests the best engineer by distance and skills, then tracks their ETA live.</p>${checklist(['Live roster of who is on shift and free', 'Suggested engineer for every job', 'Shift patterns, check-in and cover gaps at a glance'])}<p><a class="text-link" href="/bus-engineering-dispatch-software/">More about engineering dispatch</a></p>`, img: 'dispatch', alt: 'Go BARRY engineering dispatch board with engineers, jobs by stage and a suggested engineer' })}

${split({ flip: true, title: 'A road closes. The diversion is ready in minutes.', html: `<p>Mark the closed road on the route’s real path. Go BARRY finds where buses should leave and rejoin the route, compares diversion options and shows the stops that will be missed. Save it and it appears on route status, timetables and stops, with a printable sheet for drivers.</p>${checklist(['Options compared by extra miles, time and turns', 'Detours kept to roads buses already use', 'Turn-by-turn driver sheet, ready to print'])}<p><a class="text-link" href="/bus-diversion-planning-software/">More about diversion planning</a></p>`, img: 'diversion', alt: 'Go BARRY diversion around a road closure shown on a map, with stops not served and where the bus leaves and rejoins the route' })}

<section class="section alt" aria-labelledby="who-h">
  <div class="wrap">
    <p class="kicker">Who it’s for</p>
    <h2 id="who-h">Built for the people who keep buses moving</h2>
    <div class="card-grid three">
      <a class="card" href="/bus-operators/"><h3>Bus operators</h3><p>Multi-depot control rooms, engineering teams and depot displays, all working from the same live picture.</p><span class="card-more">For bus operators</span></a>
      <a class="card" href="/coach-operators/"><h3>Coach & independent operators</h3><p>Consistent breakdown decisions and clear records, without a big IT project.</p><span class="card-more">For coach operators</span></a>
      <a class="card" href="/transport-authorities/"><h3>Councils & transport authorities</h3><p>A clear view of disruption, diversions and route status across the network.</p><span class="card-more">For authorities</span></a>
    </div>
    <p class="intl">Outside the UK? Go BARRY works with GTFS, the open timetable format used by bus and transit agencies worldwide.</p>
  </div>
</section>

<section class="section founder" aria-labelledby="story-h">
  <div class="wrap narrow">
    <p class="kicker">The story</p>
    <h2 id="story-h">Built from the front line, not the boardroom</h2>
    <blockquote><p>“I built this because I could see the gap between what we need in the control room and what the tools on the market actually give you.”</p><footer>Anthony Gair, founder, bus supervisor with 12 years in the industry</footer></blockquote>
    <p>Go BARRY wasn’t designed in a software house. It was built by a working supervisor who got tired of watching the same problems repeat shift after shift: the early starts, the multiple depots, five things happening at once. <a class="text-link" href="/about/">Read the story</a></p>
  </div>
</section>

${faqHtml(HOME_FAQS)}

<section class="section enquire" id="enquire" aria-labelledby="enq-h">
  <div class="wrap narrow">
    <p class="kicker">Get in touch</p>
    <h2 id="enq-h">See how Go BARRY would work for your operation</h2>
    <p class="section-lead">Tell us a little about your fleet and we’ll show you Go BARRY set up around it. Or <a href="${SITE.app}">open the live demo</a> now.</p>
    ${enquiryForm}
  </div>
</section>`,
  },

  // ── Breakdown management ────────────────────────────────────────────────────
  {
    path: '/bus-breakdown-management-software/',
    title: 'Bus Breakdown Management Software | Go BARRY',
    description: 'Handle every bus breakdown the same way: guided assessments, a live operations board, engineer and replacement dispatch, and a full record from call to resolution.',
    faqs: [
      { q: 'What faults do the guided assessments cover?', a: 'Assessments cover areas such as brakes, steering, wheel security, engine and drivetrain, electrical and electric vehicle faults, doors and bodywork, climate and visibility, and road traffic incidents. Each operator’s set can be tailored to their own procedures.' },
      { q: 'Does it replace the driver’s own defect reporting?', a: 'No. Go BARRY is for the control room. Supervisors use it to guide the driver on the phone and record the decision; drivers keep using their own defect reporting.' },
      { q: 'Can managers see what happened afterwards?', a: 'Yes. Every breakdown keeps a full timeline, and management dashboards show volumes, response times, outcomes and repeat faults.' },
    ],
    body: (p) => `${pageHead({ kicker: 'Breakdown management', h1: 'Bus breakdown management software', lead: 'When a driver calls in, Go BARRY guides the supervisor through a consistent assessment, gets help moving and keeps everyone informed until the bus is back in service.' })}

${split({ title: 'Consistent decisions, whoever takes the call', html: `<p>Guided assessments walk the supervisor through each type of fault with the right questions, in the right order. The outcome is a clear recommendation: carry on, carry on with care, or stop and come off the road.</p>${checklist(['Assessments for brakes, steering, wheels, engine, electrical, EV, doors and more', 'Suggested scripts to read to the driver', 'Outcomes recorded against the vehicle and the route', 'Tailored to your own procedures'])}`, img: 'wizard', alt: 'Go BARRY guided breakdown assessments grouped by category, such as critical safety, engine and electrical' })}

${split({ flip: true, title: 'One live board for every breakdown', html: `<p>The operations board lists every open breakdown with its severity, how long it has been open and where help is. Filter by depot, severity or your own breakdowns, search by fleet number or route, and see them all on a live map.</p>${checklist(['Severity, time open and engineer status at a glance', 'Live map with depots and breakdowns', 'Notes, timeline and contact details on every breakdown', 'Updates instantly on every screen'])}`, img: 'operations', alt: 'Go BARRY operations board listing breakdowns by severity with a live map' })}

<section class="section alt">
  <div class="wrap">
    <h2>What happens after the assessment</h2>
    <div class="card-grid three plain">
      <div class="card"><h3>Engineer sent</h3><p>Dispatch the best available engineer and track their ETA. <a href="/bus-engineering-dispatch-software/">Engineering dispatch</a></p></div>
      <div class="card"><h3>Replacement arranged</h3><p>Send a replacement from the right depot, with dead mileage recorded. <a href="/replacement-bus-dead-mileage/">Replacement vehicles</a></p></div>
      <div class="card"><h3>Routes flagged</h3><p>The affected route shows as disrupted on the route status screen. <a href="/live-bus-route-status/">Route status</a></p></div>
    </div>
  </div>
</section>

${faqHtml(p.faqs)}
${ctaBand()}
${relatedFor(p.path)}`,
  },

  // ── Engineering dispatch ────────────────────────────────────────────────────
  {
    path: '/bus-engineering-dispatch-software/',
    title: 'Engineer Dispatch Software for Bus Fleets | Go BARRY',
    description: 'A live dispatch board for bus engineering teams: jobs by stage, the best engineer suggested for each breakdown, live ETAs, rosters, shift patterns and cover gaps.',
    faqs: [
      { q: 'How does Go BARRY choose which engineer to suggest?', a: 'It looks at who is on shift and free, how far their depot is from the breakdown, and whether their skills match the fault. The supervisor always makes the final choice.' },
      { q: 'Can engineering teams see jobs without logging in at a desk?', a: 'Yes. Depot wall displays show the jobs for that depot, and update in real time.' },
      { q: 'Does it handle night shifts?', a: 'Yes. Shift patterns can run past midnight, and the roster shows who is working now, who starts later and who has finished.' },
    ],
    body: (p) => `${pageHead({ kicker: 'Engineering dispatch', h1: 'Engineering dispatch for bus breakdowns', lead: 'One board shows every job by stage and every engineer by status, so the right engineer gets to the right bus, and everyone can see when they will arrive.' })}

${split({ title: 'Every job, every engineer, one board', html: `<p>Jobs move from awaiting dispatch to en route, on site and done. The roster beside them shows who is free, who is travelling and who is working on a vehicle, so nobody has to ring round to find out.</p>${checklist(['Suggested engineers ranked by distance and skills', 'Live ETA countdown after dispatch', 'Job details, vehicle history and notes in one panel', 'Depot wall displays for engineering teams'])}`, img: 'dispatch', alt: 'Go BARRY engineering dispatch board with jobs awaiting dispatch, en route and on site' })}

${split({ flip: true, title: 'Rosters and cover you can trust', html: `<p>See today’s cover across every depot on a single timeline, with a warning when a depot has no engineer for the rest of the day. Check engineers in against your shift patterns in a couple of clicks.</p>${checklist(['Today’s cover by depot, with gaps highlighted', 'Shift patterns such as early, late and night', 'Engineer directory with skills and live status', 'Sign engineers off when they finish'])}`, img: 'rosters', alt: 'Go BARRY engineer roster timeline showing cover by depot across the day' })}

${faqHtml(p.faqs)}
${ctaBand()}
${relatedFor(p.path)}`,
  },

  // ── Replacement vehicles ────────────────────────────────────────────────────
  {
    path: '/replacement-bus-dead-mileage/',
    title: 'Replacement Bus Dispatch & Dead Mileage Recording | Go BARRY',
    description: 'Send replacement buses from the right depot and record dead mileage for every one, from depot to breakdown and on to the point it returns to service.',
    faqs: [
      { q: 'What mileage does Go BARRY record for a replacement?', a: 'The dead miles from the sending depot to the breakdown, the miles from the breakdown to where the replacement returns to service, and the total, stored against the breakdown.' },
      { q: 'How is the distance worked out?', a: 'From the road distance between the points where mapping data is available, so the figures reflect the roads driven rather than a straight line.' },
      { q: 'Why record dead mileage at all?', a: 'Non-revenue mileage matters for grant and mileage reporting, and it is easy to lose when replacements are arranged by phone. Go BARRY records it at the moment of dispatch.' },
    ],
    body: (p) => `${pageHead({ kicker: 'Replacement vehicles', h1: 'Replacement buses and dead mileage, recorded properly', lead: 'When a vehicle comes off the road, Go BARRY helps you send a replacement from the right depot and records every non-revenue mile, without anyone reaching for a spreadsheet.' })}

<section class="section">
  <div class="wrap narrow prose">
    <h2>From breakdown to back in service</h2>
    <p>From the breakdown, the supervisor chooses a replacement vehicle and the depot it’s coming from. Go BARRY records the dead miles from that depot to the breakdown. When the replacement joins the route, the supervisor marks where it returned to service, choosing a nearby stop, and the pickup miles are added.</p>
    ${checklist(['Dispatch a replacement from any depot', 'Dead miles recorded from depot to breakdown', 'Return-to-service point chosen from nearby stops', 'Total non-revenue mileage kept against the breakdown for reporting'])}
    <h2>Visible to everyone who needs it</h2>
    <p>Replacements show on the operations board as soon as they’re sent, so control, engineering and depots all know a vehicle is on its way, and mileage reports pick up the figures automatically.</p>
  </div>
</section>

${split({ title: 'Part of the breakdown, not a separate job', html: `<p>Because replacements are arranged from the breakdown itself, the vehicle, the route affected, the replacement and its mileage stay together in one record, ready for reporting.</p><p><a class="text-link" href="/bus-breakdown-management-software/">More about breakdown management</a></p>`, img: 'operations', alt: 'Go BARRY operations board with a replacement vehicle en route to a breakdown' })}

${faqHtml(p.faqs)}
${ctaBand()}
${relatedFor(p.path)}`,
  },

  // ── Diversions ──────────────────────────────────────────────────────────────
  {
    path: '/bus-diversion-planning-software/',
    title: 'Bus Diversion Planning Software for Road Closures | Go BARRY',
    description: 'Plan bus diversions around road closures on a map: compare routes by extra miles, time and turns, see the stops missed, and print turn-by-turn driver sheets.',
    faqs: [
      { q: 'How does Go BARRY avoid sending buses down unsuitable roads?', a: 'Detours are steered towards roads that buses already use, and options that loop back on themselves or still use the closed road are flagged. Every diversion is still checked by a supervisor before it is used, because road width, weight and height limits vary.' },
      { q: 'Can a diversion cover both directions?', a: 'Each diversion covers one direction of travel. Once one is saved, the other direction can be planned in one click with the same details.' },
      { q: 'Where do drivers see the diversion?', a: 'Each diversion has a printable driver sheet with where to leave the route, turn-by-turn directions, where to rejoin, the stops not served and any notes.' },
      { q: 'Can diversions be planned in advance?', a: 'Yes. Set a start and end time and the diversion shows as planned until it comes into force.' },
    ],
    body: (p) => `${pageHead({ kicker: 'Diversion planning', h1: 'Plan bus diversions around road closures in minutes', lead: 'Mark the closed road on the route’s real path and Go BARRY does the rest: where to leave and rejoin the route, the diversion options, the stops affected and a driver sheet ready to print.' })}

${split({ title: 'From road closure to diversion', html: `<ol class="numbered"><li><strong>Choose the route and direction.</strong> Its real road path and stops appear on the map.</li><li><strong>Mark the closure.</strong> Click where the closed stretch starts and ends.</li><li><strong>Compare the options.</strong> Each shows the extra miles and minutes, the number of turns, the stops missed and the stops passed.</li><li><strong>Save it.</strong> Add the reason, when it applies and any notes for drivers.</li></ol>`, img: 'diversion', alt: 'Go BARRY diversion on a map with the closed road, the diversion route and stops not served' })}

${split({ flip: true, title: 'Drivers get clear, printable directions', html: `<p>Every diversion has a driver sheet: when it applies, where to leave the normal route, numbered turn-by-turn directions, where to rejoin, the stops not served and the stops on the diversion.</p>${checklist(['Ready to print or share', 'Written for drivers, not planners', 'Notes such as temporary stop locations'])}`, img: 'driver-sheet', alt: 'Go BARRY printable driver sheet with turn-by-turn diversion directions' })}

<section class="section alt">
  <div class="wrap">
    <h2>A diversion everyone can see</h2>
    <div class="card-grid three plain">
      <div class="card"><h3>Route status</h3><p>Diverted routes are marked on the route status screen, even when there are no breakdowns.</p></div>
      <div class="card"><h3>Timetables</h3><p>The timetable shows the diversion and tags every stop that isn’t being served.</p></div>
      <div class="card"><h3>Stops</h3><p>Look up a stop and see straight away if a route is diverted away from it.</p></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap narrow prose">
    <h2>Suitable roads, checked by people who know them</h2>
    <p>Road options come from mapping data built for all traffic, so Go BARRY keeps detours to roads other buses already use and flags anything that loops back on itself or still runs along the closed road. The final check on width, weight and height limits stays with your supervisors, and the driver sheet records who set it up.</p>
  </div>
</section>

${faqHtml(p.faqs)}
${ctaBand({ title: 'See a diversion in the live demo', text: 'The demo includes a diversion in force, with its map, the stops affected and the driver sheet. No account needed.' })}
${relatedFor(p.path)}`,
  },

  // ── Route status ────────────────────────────────────────────────────────────
  {
    path: '/live-bus-route-status/',
    title: 'Live Bus Route Status, Timetables & Stops | Go BARRY',
    description: 'See which bus routes are disrupted right now, with every open breakdown and diversion, plus full timetables and live stop departures from your GTFS data.',
    faqs: [
      { q: 'How is a route’s status decided?', a: 'A route is disrupted when it has a vehicle off the road or more than one open breakdown, and affected when it has a single, less serious one. Routes with a diversion in force are marked too.' },
      { q: 'Where does the route and timetable data come from?', a: 'From your GTFS timetable data, the standard format used by operators and transport authorities. It can be updated whenever your timetable changes.' },
      { q: 'Can I look up what’s due at a stop?', a: 'Yes. Search for a stop or pick one on the map to see departures by route or by time, the routes that serve it and nearby stops.' },
    ],
    body: (p) => `${pageHead({ kicker: 'Route status & timetables', h1: 'Live route status, timetables and stop departures', lead: 'Know which routes are disrupted right now and why, then check a timetable or what’s due at a stop without leaving the screen.' })}

${split({ title: 'The whole network at a glance', html: `<p>Every route is shown as a tile, coloured by status. The routes that need attention are listed first, with each open breakdown, how long it has been open and where the engineer is.</p>${checklist(['Disrupted and affected routes, worst first', 'Every breakdown linked to its route', 'Diversions in force marked on the map of routes', 'Breakdowns with no route recorded listed, not lost'])}`, img: 'route-status', alt: 'Go BARRY live route status with disrupted routes and a grid of every route coloured by status' })}

${split({ flip: true, title: 'Timetables and stops, one click away', html: `<p>Open any route’s full timetable from your GTFS data, jump to the current time, and see which stops are affected by a diversion. Look up a stop to see what’s due, the routes that serve it and nearby stops.</p>${checklist(['Full timetables by direction and day', 'Departures by route or by time', 'Stops not served by a diversion clearly tagged'])}`, img: 'timetable', alt: 'Go BARRY route timetable with a diversion banner and the current time highlighted' })}

${faqHtml(p.faqs)}
${ctaBand()}
${relatedFor(p.path)}`,
  },

  // ── Fleet intelligence ──────────────────────────────────────────────────────
  {
    path: '/bus-fleet-intelligence/',
    title: 'Bus Fleet Defect Analysis & Reporting | Go BARRY',
    description: 'Spot the buses and faults that keep coming back. Fleet intelligence, KPIs and management reports built from every breakdown your control room handles.',
    faqs: [
      { q: 'Where does the data come from?', a: 'From the breakdowns your supervisors record in Go BARRY, so the reports reflect what actually happened on the road with no extra data entry.' },
      { q: 'Can we export the data?', a: 'Yes. Reports can be exported for use in your own spreadsheets and systems.' },
      { q: 'Who is it for?', a: 'Engineering and operations managers who want to see patterns across the fleet, depots and shifts, and control room staff who want a clear summary of the day.' },
    ],
    body: (p) => `${pageHead({ kicker: 'Fleet intelligence', h1: 'Spot repeat faults before they cost you', lead: 'Every breakdown your control room handles becomes data: which vehicles keep failing, which faults are rising and how each depot and shift is doing.' })}

${split({ title: 'The vehicles that keep coming back', html: `<p>Fleet intelligence brings together every breakdown against each vehicle, so repeat offenders and recurring faults stand out long before they turn into a fleet shortage.</p>${checklist(['Repeat-offender vehicles and fault types', 'Trends by depot and over time', 'Reports ready to export'])}`, img: 'fleet', alt: 'Go BARRY fleet intelligence dashboard showing defect patterns across the fleet' })}

${split({ flip: true, title: 'A clear picture of the day', html: `<p>The home screen gives supervisors and managers a summary of the day so far: breakdowns by hour, outcomes, the most common issues, depot load and engineering activity.</p>${checklist(['Today at a glance for every shift', 'Handover notes between shifts', 'KPIs and trends for managers'])}`, img: 'home', alt: 'Go BARRY today summary with breakdowns by hour, outcomes and top issues' })}

${faqHtml(p.faqs)}
${ctaBand()}
${relatedFor(p.path)}`,
  },

  // ── Audience: bus operators ─────────────────────────────────────────────────
  {
    path: '/bus-operators/',
    title: 'Control Room Software for Bus Operators | Go BARRY',
    description: 'Go BARRY gives bus operators one live picture across every depot: breakdowns, engineering, replacements, diversions and route status, for control rooms of any size.',
    faqs: [
      { q: 'Does it work across several depots?', a: 'Yes. Go BARRY is built for multi-depot operations, with depot filters, depot wall displays and cover shown by depot.' },
      { q: 'How long does it take to set up?', a: 'That depends on your size and how much tailoring you need. The core setup is your fleet, depots and GTFS timetable. Get in touch and we’ll talk you through it.' },
      { q: 'Do you work with operators outside the UK?', a: 'Yes. Go BARRY uses GTFS timetable data, which bus and transit agencies publish worldwide.' },
    ],
    body: (p) => `${pageHead({ kicker: 'For bus operators', h1: 'Control room software for bus operators', lead: 'Large group or regional operator, Go BARRY gives your control room, engineers and depots the same live picture, and gives managers the data to improve it.' })}

<section class="section">
  <div class="wrap">
    <div class="card-grid three plain">
      <div class="card"><h3>For the control room</h3><p>A live operations board, guided breakdown assessments, route status and diversions, with handovers that don’t lose anything between shifts.</p></div>
      <div class="card"><h3>For engineering</h3><p>A dispatch board with suggested engineers and live ETAs, rosters and cover by depot, and wall displays in every depot.</p></div>
      <div class="card"><h3>For managers</h3><p>KPIs, fleet intelligence and reports built from what actually happened, with no extra data entry.</p></div>
    </div>
  </div>
</section>

${split({ title: 'Configured around your operation', html: `<p>Go BARRY is set up with your depots, your routes, your fleet and your procedures, not a generic template. The breakdown assessments, dashboards and workflows can be tailored to how your supervisors already work.</p>${checklist(['Your depots, routes and fleet', 'Your procedures in the guided assessments', 'Role-based access for supervisors, engineering and managers', 'Runs in a web browser on control room screens'])}`, img: 'operations', alt: 'Go BARRY operations board with depot filters and a live map' })}

<section class="section alt">
  <div class="wrap narrow prose">
    <h2>Operating outside the UK?</h2>
    <p>Go BARRY reads GTFS, the open timetable format used by bus and transit agencies around the world, so routes, stops and timetables come straight from the data you already publish. The rest of the platform is configured to your depots, fleet and terminology.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>What’s included</h2>
    ${featureCards()}
  </div>
</section>

${faqHtml(p.faqs)}
${ctaBand()}`,
  },

  // ── Audience: coach operators ───────────────────────────────────────────────
  {
    path: '/coach-operators/',
    title: 'Breakdown Software for Coach & Independent Operators | Go BARRY',
    description: 'Consistent breakdown decisions, clear records and replacement vehicles sorted, for coach and independent bus operators, without a big IT project.',
    faqs: [
      { q: 'Is it only for large operators?', a: 'No. Smaller fleets benefit from the same consistency and records, and Go BARRY is set up around the size of your operation.' },
      { q: 'Do we need special equipment?', a: 'No. Go BARRY runs in a web browser, so the office and on-call staff can use the computers they already have.' },
      { q: 'Can it help less experienced staff?', a: 'Yes. The guided assessments ask the right questions in the right order, so whoever takes the call reaches a consistent, safe decision.' },
    ],
    body: (p) => `${pageHead({ kicker: 'For coach & independent operators', h1: 'Breakdown handling for coach and independent operators', lead: 'When a coach breaks down on a school run or a private hire, you need a safe decision fast, the right help sent and a record you can rely on. Go BARRY gives you all three.' })}

${split({ title: 'The right decision, whoever answers the phone', html: `<p>In a smaller team, the person taking the call isn’t always the most experienced. Guided assessments walk them through the fault step by step and recommend whether the vehicle can carry on or needs to stop.</p>${checklist(['Step-by-step assessments with suggested scripts', 'A clear record of every decision', 'Replacement vehicles and mileage recorded'])}`, img: 'wizard', alt: 'Go BARRY guided breakdown assessment categories' })}

<section class="section alt">
  <div class="wrap narrow prose">
    <h2>Simple to start with</h2>
    <p>Go BARRY runs in a web browser, so there’s nothing to install. It’s set up with your vehicles and depots, and the features you don’t need stay out of the way. Contract and school services, private hire and scheduled routes can all be handled in one place.</p>
    ${checklist(['Nothing to install', 'Set up around your fleet and depots', 'Records you can show customers and insurers'])}
  </div>
</section>

${faqHtml(p.faqs)}
${ctaBand()}
${related(FEATURES.slice(0, 3))}`,
  },

  // ── Audience: authorities ───────────────────────────────────────────────────
  {
    path: '/transport-authorities/',
    title: 'Network Disruption Software for Transport Authorities | Go BARRY',
    description: 'See bus network disruption as it happens: live route status, breakdowns and diversions around road closures, for councils and transport authorities.',
    faqs: [
      { q: 'Can Go BARRY show disruption across several operators?', a: 'Go BARRY is configured per organisation. Talk to us about how you’d like to see your network and we’ll tell you what’s possible.' },
      { q: 'Is there a record of diversions?', a: 'Yes. Every diversion is kept with its route, times, reason, the stops not served and who set it up.' },
      { q: 'Does it use our existing timetable data?', a: 'Yes. Go BARRY reads GTFS timetable data, the standard many authorities already publish or hold.' },
    ],
    body: (p) => `${pageHead({ kicker: 'For councils & transport authorities', h1: 'See disruption across your bus network as it happens', lead: 'Which routes are disrupted, why, and what’s being done about it: Go BARRY puts it in one place, with a record of every diversion and breakdown.' })}

${split({ title: 'Live route status for the whole network', html: `<p>Every route is shown by status, so disrupted routes stand out immediately, with the breakdowns and diversions behind each one.</p>${checklist(['Disrupted and affected routes at a glance', 'Diversions in force, with stops not served', 'Built on GTFS timetable data'])}`, img: 'route-status', alt: 'Go BARRY live route status across a bus network' })}

${split({ flip: true, title: 'Road closures, handled consistently', html: `<p>When roadworks or an incident close a road, diversions are planned on a map, compared by distance and stops affected, and recorded with who set them up and when they apply.</p><p><a class="text-link" href="/bus-diversion-planning-software/">More about diversion planning</a></p>`, img: 'diversion', alt: 'Go BARRY diversion around a road closure on a map' })}

${faqHtml(p.faqs)}
${ctaBand({ title: 'Talk to us about your network', text: 'Tell us what you need to see and we’ll show you how Go BARRY could be set up for it. Or open the live demo now.' })}`,
  },

  // ── About ───────────────────────────────────────────────────────────────────
  {
    path: '/about/',
    title: 'About Go BARRY | Built by a Bus Supervisor',
    description: 'Go BARRY was built by Anthony Gair, a bus supervisor with 12 years in the industry, to give control rooms the tools the job actually needs.',
    schema: (p) => [
      { '@context': 'https://schema.org', '@type': 'AboutPage', url: `${SITE.origin}${p.path}`, name: 'About Go BARRY', about: { '@id': `${SITE.origin}/#org` } },
      { '@context': 'https://schema.org', '@type': 'Person', name: 'Anthony Gair', jobTitle: 'Founder, Go BARRY', worksFor: { '@id': `${SITE.origin}/#org` } },
    ],
    body: () => `${pageHead({ kicker: 'About', h1: 'Built from the front line, not the boardroom', lead: 'Go BARRY is control room software built by someone who has worked the shifts it’s designed for.', actions: false })}

<section class="section">
  <div class="wrap narrow prose">
    <blockquote><p>“I built this because I could see the gap between what we need in the control room and what the tools on the market actually give you.”</p><footer>Anthony Gair, founder</footer></blockquote>
    <p>Go BARRY wasn’t designed in a software house. It was built by Anthony Gair, a working bus supervisor with 12 years in the industry, who got tired of watching the same problems repeat shift after shift.</p>
    <p>Completely self-taught on the technology side, Anthony started building because the off-the-shelf options didn’t reflect the reality of the job: the early starts, the multiple depots, the five things happening at once. Breakdowns logged on paper, engineers found by ringing round, mileage in one spreadsheet and diversions in an email.</p>
    <p>The result is a platform shaped by real shifts, real breakdowns and real handovers. Not a tech product looking for a problem, but an operational tool built by someone who lives it.</p>
    <h2>Configured around each operator</h2>
    <p>Every operation is different, so Go BARRY is set up around how yours works: your depots, your routes, your fleet and your procedures. Go BARRY is made by GairWare.</p>
    <h2>In the press</h2>
    <p>Go BARRY’s story was featured in CBW Magazine: <a href="https://cbwmagazine.com/go-barry-go/" rel="noopener">“Go, Barry, go…”</a>.</p>
    <p class="about-cta"><a class="btn btn-primary" href="${SITE.app}">Try the live demo</a> <a class="btn btn-ghost" href="/contact/">Get in touch</a></p>
  </div>
</section>`,
  },

  // ── Contact ─────────────────────────────────────────────────────────────────
  {
    path: '/contact/',
    title: 'Contact Go BARRY | Book a Walkthrough',
    description: 'Talk to Go BARRY about control room software for your bus or coach operation. Send an enquiry, email us, or open the live demo now.',
    scripts: FORM_SCRIPT,
    schema: (p) => ({ '@context': 'https://schema.org', '@type': 'ContactPage', url: `${SITE.origin}${p.path}`, name: 'Contact Go BARRY', about: { '@id': `${SITE.origin}/#org` } }),
    body: () => `${pageHead({ kicker: 'Contact', h1: 'Talk to us about your operation', lead: 'Tell us a little about your fleet and what you’re looking for, and we’ll show you how Go BARRY would work for you.', actions: false })}

<section class="section">
  <div class="wrap contact-grid">
    <div>${enquiryForm}</div>
    <aside class="contact-side">
      <h2 class="h-small">Prefer email?</h2>
      <p><a href="mailto:${SITE.email}">${SITE.email}</a></p>
      <h2 class="h-small">See it for yourself</h2>
      <p>The live demo opens instantly with sample depots, breakdowns, engineers and a diversion. No account needed.</p>
      <p><a class="btn btn-primary" href="${SITE.app}">Open the live demo</a></p>
    </aside>
  </div>
</section>`,
  },

  // ── Privacy ─────────────────────────────────────────────────────────────────
  {
    path: '/privacy/',
    title: 'Privacy Notice | Go BARRY',
    description: 'How Go BARRY handles the details you send through this website.',
    priority: '0.3',
    body: () => `${pageHead({ kicker: 'Privacy', h1: 'Privacy notice for this website', lead: 'This notice covers the gobarry.co.uk website. Using the Go BARRY platform itself is covered by the terms agreed with each operator.', actions: false })}

<section class="section">
  <div class="wrap narrow prose">
    <h2>Who we are</h2>
    <p>This website is run by GairWare, which makes Go BARRY. You can contact us at <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
    <h2>What we collect</h2>
    <p>If you send an enquiry, we receive the details you enter: your name, company and email address, and anything else you choose to add, such as your phone number, role, fleet size and message. We also record the date and the internet address it was sent from, to help protect the form against misuse.</p>
    <h2>How we use it</h2>
    <p>We use your details only to reply to your enquiry and to talk to you about Go BARRY. We don’t sell your details or pass them to anyone else for marketing.</p>
    <h2>How long we keep it</h2>
    <p>We keep enquiries for as long as we need them to deal with your interest in Go BARRY. You can ask us to delete your details at any time.</p>
    <h2>Cookies</h2>
    <p>This website doesn’t use tracking or advertising cookies.</p>
    <h2>Your rights</h2>
    <p>Under UK data protection law you can ask to see, correct or delete the personal data we hold about you. Email us to do this. If you’re unhappy with how we’ve handled your data, you can complain to the Information Commissioner’s Office (ico.org.uk).</p>
  </div>
</section>`,
  },
];

export const NOT_FOUND = {
  path: '/404.html',
  title: 'Page not found | Go BARRY',
  description: 'The page you were looking for isn’t here.',
  noindex: true,
  body: `${pageHead({ h1: 'That page isn’t here', lead: 'It may have moved. Try one of these instead, or head back to the home page.', actions: false })}
<section class="section"><div class="wrap">${featureCards()}<p class="center"><a class="btn btn-primary" href="/">Go to the home page</a></p></div></section>`,
};

export { breadcrumb };
