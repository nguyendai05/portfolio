<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://res.cloudinary.com/dak4x4d7u/image/upload/v1763829217/Whisk_cjmyety3imz3y2mk1snzmtytyjm4qtl3gzy40sz_k2c1um.png" />
</div>

## Project Overview

This is a **brutalist, avant-garde portfolio website** for **Nguyen Xuan Dai (Xuni-Dizan)**, an IT student and front-end developer based in Ho Chi Minh City, Vietnam. The portfolio showcases experimental UI/UX design with gamification features, dynamic theming, and AI-powered chat interface.

**Tech Stack:**
- **Framework:** React 18.2.0 with TypeScript 5.8.2
- **Build Tool:** Vite 6.2.0
- **Router:** React Router DOM 6.23.0 (HashRouter)
- **Animations:** Framer Motion 10.18.0
- **3D Graphics:** Three.js 0.160.0 with React Three Fiber & Drei
- **Icons:** Lucide React 0.344.0
- **AI Integration:** Google Gemini AI (@google/genai 1.30.0) with multi-key rotation
- **Analytics:** Vercel Analytics 1.5.0
- **Styling:** Tailwind CSS (via CDN) + CSS custom properties

---

## Directory Structure

```
portfolio/
├── components/          # Reusable UI components
│   ├── AboutPortrait3D.tsx      # 3D portrait for About page
│   ├── ExecutionLog.tsx         # Execution log display
│   ├── GalleryControlPanel.tsx  # Gallery controls
│   ├── GenerativeArt.tsx        # 3D/Canvas art backgrounds
│   ├── GlitchText.tsx           # Text effect component
│   ├── LifeGallery.tsx          # Life moments gallery
│   ├── Navigation.tsx           # Main navigation + sidebar
│   ├── NeuralInterface.tsx      # AI chat interface (Gemini)
│   ├── Preloader.tsx            # Loading screen
│   ├── ProjectModal.tsx         # Project detail modal
│   ├── ThemeSwitcher.tsx        # Theme selection UI
│   ├── TrophyCase.tsx           # Achievement display
│   ├── VideoTimelineItem.tsx    # Video timeline component
│   ├── WorkColumns.tsx          # Work page column layout
│   ├── WorkDeepDiveStrip.tsx    # Work page deep dive section
│   ├── WorkHero.tsx             # Work page hero section
│   └── WorkScrollProgress.tsx   # Work page scroll indicator
├── pages/              # Route-level page components
│   ├── About.tsx           # About/bio page
│   ├── Collaboration.tsx   # Collaboration info
│   ├── Contact.tsx         # Contact form/info
│   ├── Gallery.tsx         # Visual gallery
│   ├── Home.tsx            # Landing page
│   ├── Mentorship.tsx      # Mentorship offerings
│   └── Work.tsx            # Projects showcase
├── context/            # React Context providers
│   ├── GamificationContext.tsx  # Achievements & easter eggs
│   └── ThemeContext.tsx         # Theme state management
├── services/           # External service integrations
│   ├── geminiKeyManager.ts # API key rotation & cooldown manager
│   └── geminiService.ts    # Google Gemini AI service
├── data/               # Static i18n + project copy overrides
│   ├── translations.ts     # All UI strings (EN + VI)
│   └── projectTranslations.ts # Per-slug VI overrides for projects
├── App.tsx             # Main app component with routing
├── index.css           # Additional global styles
├── index.html          # HTML template with Tailwind config
├── index.tsx           # React entry point
├── metadata.json       # App metadata
├── package.json        # Dependencies & scripts
├── tsconfig.json       # TypeScript configuration
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Vite build configuration
```

---

## Core Architecture Patterns

### 1. **Context API for State Management**
The app uses React Context for global state:

- **ThemeContext** (`context/ThemeContext.tsx`):
  - Manages 8 theme modes: `focused`, `night_owl`, `early_bird`, `rainy_day`, `celebration`, `zen`, `cyberpunk`, `retro`
  - Auto-detects time of day and applies appropriate theme on mount
  - Persists theme selection to `localStorage` as `xuni_theme`
  - Updates CSS custom properties (`--color-bg`, `--color-text`, etc.)

- **GamificationContext** (`context/GamificationContext.tsx`):
  - Tracks 7 achievements (Konami code, debug mode, secret lab, etc.)
  - Listens for global key sequences (easter eggs)
  - Manages `neoMode` (cyberpunk activation) and `debugMode`
  - Persists achievements to `localStorage` as `xuni_achievements`

**Pattern:**
```tsx
// Usage in components
const { theme, setTheme } = useTheme();
const { unlockAchievement, neoMode } = useGamification();
```

### 2. **React Router with HashRouter**
Uses `HashRouter` for GitHub Pages compatibility:
```tsx
// Route structure in App.tsx
<HashRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/work" element={<Work />} />
    {/* ... */}
  </Routes>
</HashRouter>
```

**Important:** All navigation uses hash-based URLs (`#/about`, `#/work`)

### 3. **Framer Motion for Animations**
- Page transitions with `AnimatePresence` and `mode="wait"`
- Scroll-based animations using `useScroll` and `useTransform`
- Component entry/exit animations
- Modal animations

### 4. **Component Composition Pattern**
- Presentational components in `/components`
- Page-level container components in `/pages`
- Context providers wrap the entire app in `App.tsx`

---

## Theming System

### CSS Custom Properties (Dynamic Theming)
All colors are defined as CSS variables in `index.html`:
```css
:root {
  --color-bg: #e6e6e6;
  --color-text: #0a0a0a;
  --color-accent: #39ff14;
  --color-panel: #ffffff;
  --color-border: #0a0a0a;
}
```

**Tailwind Integration:**
Custom Tailwind colors map to these variables:
```javascript
colors: {
  'theme-bg': 'var(--color-bg)',
  'theme-text': 'var(--color-text)',
  'theme-accent': 'var(--color-accent)',
  'theme-panel': 'var(--color-panel)',
  'theme-border': 'var(--color-border)',
}
```

**Always use theme colors:**
- ✅ `className="bg-theme-bg text-theme-text"`
- ❌ `className="bg-gray-100 text-black"` (hardcoded colors)

### Theme-Specific Visual Effects
- **rainy_day:** Canvas rain animation
- **celebration:** Canvas confetti animation
- **cyberpunk:** Matrix-style character rain
- **retro:** CRT scanline overlay

Implemented in `ThemeEffects` component in `App.tsx:50-153`

---

## Gamification System

### Easter Eggs & Achievements
Defined in `context/GamificationContext.tsx:32-97`:

1. **Konami Code** (`↑↑↓↓←→←→BA`): Toggles Neo Mode
2. **"hacktheplanet"** (typed): Activates Neo Mode
3. **"debugmode"** (typed): Toggles debug overlay
4. **Triple-click logo**: Unlocks "Secret Lab" achievement
5. **Night Owl**: Auto-unlocked when visiting 11pm-4am
6. **Art Connoisseur**: View all generative art pieces
7. **Conversationalist**: Long AI chat session
8. **Lab Explorer**: Scroll to the bottom of the Work page

**Pattern:**
```tsx
// Unlock achievement from any component
const { unlockAchievement } = useGamification();
unlockAchievement('achievement_id');
```

---

## Environment Variables

### Required Environment Variables
Create `.env.local` in project root:
```bash
# Primary API key (required)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional additional keys for rotation (prevents rate limiting)
GEMINI_API_KEY_1=your_second_key_here
GEMINI_API_KEY_2=your_third_key_here
GEMINI_API_KEY_3=your_fourth_key_here
GEMINI_API_KEY_4=your_fifth_key_here
GEMINI_API_KEY_5=your_sixth_key_here

# Key cooldown period in minutes (default: 15)
GEMINI_KEY_COOLDOWN_MINUTES=15
```

**Vite exposes these as:**
- `process.env.GEMINI_API_KEYS` (array of all keys)
- `process.env.GEMINI_KEY_COOLDOWN_MINUTES` (cooldown duration)
- `process.env.API_KEY` (backwards compatibility)
- `process.env.GEMINI_API_KEY` (backwards compatibility)

Configured in `vite.config.ts:14-25`

**API Key Rotation System:**
The app implements automatic key rotation when rate limits are hit:
- When a key hits rate limit, it's marked as "limited" with a cooldown period
- System automatically switches to the next available key
- Limited keys are restored after cooldown expires
- State persists in `localStorage` as `xuni_gemini_key_state_v1`
- Managed by `services/geminiKeyManager.ts`

**Important:** API keys are loaded at build time, not runtime. Requires rebuild after changes.

### Admin / Content Management

The portfolio exposes an authenticated admin panel that drives all content
(projects, tools, skills, milestones, experiments, contact messages) through
the MySQL database. The DB is the only source of truth — new content is
added through the admin UI or seeded via `db/schema.sql`.

| Variable          | Required | Notes                                                                 |
|-------------------|----------|-----------------------------------------------------------------------|
| `ADMIN_TOKEN`     | Yes      | Long random string; bearer token the browser stores after login.      |
| `ADMIN_PASSWORD`  | No       | What the admin types into `/admin/login`. Falls back to `ADMIN_TOKEN`.|
| `MYSQL_*`         | Yes      | Standard host / port / user / password / database for the MySQL DB.   |
| `MYSQL_SSL=true`  | Optional | Force TLS (auto-enabled for TiDB Cloud, Aiven, RDS, PlanetScale).     |

Generate a token with `openssl rand -hex 32` and set both `ADMIN_TOKEN` and
`ADMIN_PASSWORD` in `.env.local` (development) and in the Vercel project
environment variables (production). Visit `#/admin/login` to sign in. After
login, the token is stored in `localStorage` under `xuni_admin_token` and is
attached as a Bearer token to every mutation request.

**Admin routes** (all hash-based, e.g. `https://your-site.com/#/admin`):

- `#/admin/login` — password login
- `#/admin` — dashboard with stats and quick links
- `#/admin/projects` and `#/admin/projects/new` / `#/admin/projects/:id/edit`
- `#/admin/tools`
- `#/admin/skills`
- `#/admin/milestones`
- `#/admin/experiments`
- `#/admin/messages` — contact form inbox (also stored in DB now)

The admin pages do not appear in the public navigation, but the URL is
always reachable. Anything saved through these forms shows up on the public
site immediately — no code change required.

### Single-function API architecture

To stay within Vercel's Hobby plan limit of 12 serverless functions, the
entire backend is a **single catch-all function** at `api/[[...path]].ts`
that routes by method + pathname. All route handlers and DB helpers live
outside `/api` in `server/`:

```
api/[[...path]].ts           # The one and only Vercel function
server/
├── router.ts                # Method+path dispatcher, all route handlers
├── db.ts                    # MySQL connection + error formatter
├── auth.ts                  # ADMIN_TOKEN bearer middleware
├── projects.ts              # Project DTOs + CRUD helpers
├── contact-messages.ts      # Contact-message DTO helpers
└── email.ts                 # EmailJS rotation + send helpers
```

Frontend paths are unchanged (`/api/projects`, `/api/skills`,
`/api/admin/login`, etc.) — the dispatcher inside `server/router.ts`
matches them internally. `api-server.mjs` continues to host the same
routes for local dev (`npm run dev:full`).

---

## TypeScript Conventions

### Type Definitions (`types.ts`)
```typescript
export enum Section {
  HERO = 'hero',
  PHILOSOPHY = 'philosophy',
  // ...
}

export interface Project {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}
```

### Naming Conventions
- **Components:** PascalCase with `.tsx` extension (e.g., `GenerativeArt.tsx`)
- **Context files:** PascalCase with `Context` suffix (e.g., `ThemeContext.tsx`)
- **Services:** camelCase with `Service` suffix (e.g., `geminiService.ts`)
- **Types/Interfaces:** PascalCase (e.g., `Project`, `ThemeMode`)
- **Enums:** PascalCase with SCREAMING_SNAKE_CASE values

### Component Patterns
```tsx
// Standard component structure
import React from 'react';
import { motion } from 'framer-motion';

export const ComponentName: React.FC = () => {
  // Hooks
  const [state, setState] = useState<Type>(initialValue);

  // Event handlers
  const handleEvent = () => {
    // ...
  };

  // Render
  return (
    <motion.div className="...">
      {/* JSX */}
    </motion.div>
  );
};
```

---

## AI Chat Integration (Gemini)

### Service Layer (`services/geminiService.ts`)
- **Function:** `sendMessageToMantis(history, message)`
- **Model:** `gemini-2.5-flash`
- **System Instruction:** Brutalist persona, student context (lines 4-37)
- **API Key Management:** Automatic rotation via `geminiKeyManager.ts`
- **Error Handling:** Returns fallback messages on failure with Vietnamese error messages
- **Rate Limit Handling:** Automatically switches to next available key when rate limited
- **Response Normalization:** Strips markdown code fences, limits length to 1200 chars

### Key Manager Service (`services/geminiKeyManager.ts`)
Sophisticated API key rotation system:
- **Round-robin selection** of available keys
- **Automatic cooldown** when rate limit detected (default 15 minutes)
- **Persistent state** in localStorage
- **Multiple key support** (up to 6 keys)
- **Status tracking** for each key (available/limited/cooldown expiry)

### Neural Interface Component
Located in `components/NeuralInterface.tsx`:
- Floating chat button in bottom-left corner
- Maintains conversation history
- Stores messages in component state (not persisted)
- Branded as "XUNI_CORE"

**Important Notes:**
- AI represents Nguyen Xuan Dai as a **student**, not an agency
- Persona is experimental, brutalist, and concise
- **Bilingual support:** Responds in Vietnamese or English based on user input
- Mentions university projects and learning experiments when asked about work
- Real project grounding from the live API (`/api/projects`)

---

## Data Layer

### Database (`db/schema.sql`)
The MySQL schema is the single source of truth for all portfolio content.
It defines and seeds:
- **projects** (flagship + smaller projects + tools, with technologies and phases)
- **skills** (tech stack chips, grouped by `skill_type`: frontend / backend / database / tool / design / language / other)
- **awards** (milestones / timeline entries)
- **experiments** (lab / playground entries)
- **contact_messages** (inbox for the contact form)
- **ideas** + **idea_comments** (collaboration board)

**Pattern (public pages):**
```tsx
import { fetchProjects, fetchSkills, fetchAwards, fetchExperiments } from '../services/portfolioService';
```

### Data Update Guidelines
When modifying portfolio content:
1. Use the admin UI at `#/admin/*` (preferred), or run SQL against `db/schema.sql`
2. Public pages (`Home`, `Work`, `About`) refresh on next page load
3. Verify images are accessible (uses Cloudinary CDN for stable URLs)
4. Include `featured` flag for highlighted projects
5. Include `phases` array for project timeline

---

## Styling Guidelines

### Tailwind CSS
Inline Tailwind CDN configuration in `index.html:11-67`:
- Custom colors (theme variables)
- Custom fonts: Inter (sans), JetBrains Mono (mono)
- Custom animations: `glitch`, `blob`, `marquee`, `scanline`

### Responsive Design
Mobile-first approach with breakpoints:
- Default: Mobile
- `md:`: ≥768px (tablet)
- `lg:`: ≥1024px (desktop)

**Common patterns:**
```tsx
className="text-sm md:text-base lg:text-lg"
className="hidden md:block"
className="flex-col md:flex-row"
```

### Custom CSS
Minimal custom CSS in `index.html:68-99` and inline `<style>` blocks:
- `.stroke-text`: Outlined text effect
- `.hide-scrollbar`: Hide scrollbars
- `.writing-mode-vertical`: Vertical text (sidebar)

---

## Component-Specific Notes

### Navigation (`components/Navigation.tsx`)
- Fixed position on all pages
- Right-side nav with 7 routes
- Left sidebar with logo, vertical text
- Triple-click logo easter egg (lines 34-46)
- Theme switcher and trophy case buttons

### Preloader (`components/Preloader.tsx`)
- Shown on initial load
- Triggers `onComplete` callback when done
- Uses `AnimatePresence` for exit animation

### GenerativeArt (`components/GenerativeArt.tsx`)
- Three.js canvas backgrounds
- Variants: `network`, `particles`, `waves`
- Props: `intensity`, `speed`, `variant`, `color`
- Used in hero sections for visual interest

### ProjectModal (`components/ProjectModal.tsx`)
- Full-screen overlay for project details
- Accepts `Project` type
- Close on backdrop click or ESC key

---

## Development Workflow

### Available Scripts
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Development Server
- **Port:** 5173 (Vite default)
- **Host:** 0.0.0.0 (accessible on network)
- **Hot Module Replacement (HMR):** Enabled
- **Vercel Analytics:** Development mode when running locally

### Build Output
- **Directory:** `dist/`
- **Target:** ES2022
- **Module:** ESNext

---

## Important Files Reference

| File | Purpose | When to Modify |
|------|---------|----------------|
| `App.tsx` | Main app, routing, context providers, theme effects | Adding new routes, global effects |
| `index.tsx` | React entry point | Rarely needed |
| `index.html` | HTML template, Tailwind config | Adding fonts, global styles, meta tags |
| `index.css` | Additional global styles | Custom CSS beyond Tailwind |
| `vite.config.ts` | Build configuration | Env vars, aliases, plugins |
| `types.ts` | Type definitions | Adding new interfaces/types |
| `db/schema.sql` | Portfolio content + DB schema (projects, skills, awards, experiments) | Updating content, schema changes |
| `context/ThemeContext.tsx` | Theme management (8 themes) | Adding new themes, changing colors |
| `context/GamificationContext.tsx` | Achievements (8 easter eggs) | Adding new easter eggs |
| `services/geminiService.ts` | Gemini AI chat integration | Modifying AI persona, response handling |
| `services/geminiKeyManager.ts` | API key rotation & rate limit management | Changing cooldown logic, key handling |
| `metadata.json` | App metadata | Updating app name, description |

---

## Common Pitfalls & Solutions

### 1. **Theme Colors Not Updating**
- ❌ **Problem:** Using hardcoded Tailwind colors
- ✅ **Solution:** Always use `theme-*` color classes: `bg-theme-bg`, `text-theme-text`, etc.

### 2. **Component Not Re-rendering on Theme Change**
- ❌ **Problem:** Component doesn't use theme context
- ✅ **Solution:** Import and use `useTheme()` hook, or rely on CSS variables which update automatically

### 3. **Hash Routing Issues**
- ❌ **Problem:** Using `<a href="/about">` instead of `<Link to="/about">`
- ✅ **Solution:** Always use React Router's `<Link>` component

### 4. **API Key Not Loading**
- ❌ **Problem:** `.env.local` not created or API key name mismatch
- ✅ **Solution:** Ensure `GEMINI_API_KEY` is in `.env.local` and restart dev server

### 5. **Animation Performance**
- ❌ **Problem:** Too many animated elements on page
- ✅ **Solution:** Use `will-change-transform` sparingly, disable animations on low-end devices

### 6. **Framer Motion Exit Animations Not Playing**
- ❌ **Problem:** Missing `AnimatePresence` wrapper
- ✅ **Solution:** Wrap animated routes/components with `<AnimatePresence mode="wait">`

---

## Code Quality Guidelines

### When Adding New Features

1. **Check Context First:** Does state need to be global? Use Context API if yes.
2. **Type Everything:** No `any` types. Create proper interfaces in `types.ts`.
3. **Use Theme Colors:** Never hardcode colors. Use theme variables or `theme-*` classes.
4. **Mobile-First:** Test on mobile viewport first, then add `md:` and `lg:` breakpoints.
5. **Accessibility:** Add ARIA labels, keyboard navigation, focus states.
6. **Performance:** Lazy load heavy components, use `React.memo` for expensive renders.
7. **Consistency:** Follow existing patterns (component structure, naming, imports).

### Before Committing

- [ ] No TypeScript errors (`npm run build`)
- [ ] All theme modes render correctly
- [ ] Mobile responsive (test at 375px width)
- [ ] No console errors/warnings
- [ ] Easter eggs still functional
- [ ] Navigation works on all pages

---

## Debugging Tips

### Enable Debug Mode
Type `debugmode` anywhere on the site to toggle debug overlay showing:
- FPS counter
- Memory usage
- Debug border around viewport

### React DevTools
Install React DevTools extension to inspect:
- Component tree
- Context values (ThemeContext, GamificationContext)
- State updates

### Network Monitoring
- Check DevTools Network tab for Gemini API calls
- Endpoint: Google Gemini API
- Failed requests show fallback error messages

---

## Future Enhancement Ideas

When extending this portfolio, consider:

1. **Persistence:** Save chat history to `localStorage`
2. **Analytics:** Track page views, achievement unlocks
3. **CMS Integration:** Pluggable headless CMS adapter (Contentful/Sanity) on top of the existing API
4. **Accessibility:** Add keyboard shortcuts legend, screen reader support
5. **Performance:** Implement code splitting, lazy loading for routes
6. **Testing:** Add unit tests (Jest/Vitest), E2E tests (Playwright)
7. **SEO:** Add meta tags, OpenGraph images, sitemap
8. **PWA:** Service worker, offline support, installability

---

## Key Dependencies Explained

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.2.0 | UI framework |
| `react-dom` | 18.2.0 | React DOM renderer |
| `react-router-dom` | 6.23.0 | Client-side routing (HashRouter) |
| `framer-motion` | 10.18.0 | Animation library |
| `three` | 0.160.0 | 3D graphics engine |
| `@react-three/fiber` | 8.15.16 | React renderer for Three.js |
| `@react-three/drei` | 9.102.6 | Three.js helpers & abstractions |
| `@remix-run/router` | 1.16.0 | Router dependency |
| `lucide-react` | 0.344.0 | Icon library |
| `@google/genai` | 1.30.0 | Google Gemini AI SDK |
| `@vercel/analytics` | 1.5.0 | Analytics tracking |
| `typescript` | 5.8.2 | Type system |
| `vite` | 6.2.0 | Build tool & dev server |

---

## Testing Checklist

### Manual Testing

**Theming:**
- [ ] Switch between all 8 themes using ThemeSwitcher
- [ ] Colors update correctly (bg, text, accent, panel, border)
- [ ] Visual effects render (rain, confetti, matrix, scanline)
- [ ] Theme persists on page reload

**Navigation:**
- [ ] All 7 routes load correctly
- [ ] Active route highlighted in nav
- [ ] Logo click returns to home
- [ ] Triple-click logo unlocks achievement

**Gamification:**
- [ ] Konami code toggles Neo Mode
- [ ] "hacktheplanet" activates Neo Mode
- [ ] "debugmode" toggles debug overlay
- [ ] Trophy case opens/closes
- [ ] Achievements save to localStorage

**AI Chat:**
- [ ] Chat button opens Neural Interface
- [ ] Messages send and receive responses
- [ ] Error handling works (try with no API key)
- [ ] Chat persists during session (not after reload)

**Responsive Design:**
- [ ] Test on mobile (375px), tablet (768px), desktop (1440px)
- [ ] Navigation adapts to screen size
- [ ] Text scales appropriately
- [ ] Images/videos responsive

---

## Contact & Persona Context

When AI assistants interact with this codebase, remember:

**About Nguyen Xuan Dai:**
- **Name:** Nguyen Xuan Dai (alias: Xuni-Dizan)
- **Status:** IT Student at Nong Lam University, Ho Chi Minh City
- **Focus:** Front-end development (HTML, CSS, JavaScript, React)
- **Tagline:** "Cười người hôm trước – Hôm sau debug" (Laugh today, debug tomorrow)
- **Location:** Ho Chi Minh City (10.8231° N, 106.6297° E)
- **Work:** University coursework, HCI exercises, personal web labs

**Tone for AI Assistant (Neural Interface):**
- Experimental, honest, slightly glitchy
- Brutalist: short, punchy, no fluff
- Strictly represents a **student portfolio**, not an agency
- Mentions "learning labs" and "university experiments" when discussing work
- Open to internships and learning opportunities (not full-time positions)

---

## Quick Reference Commands

```bash
# Development
npm install              # First time setup
npm run dev              # Start dev server → http://localhost:5173

# Production
npm run build            # Build to dist/
npm run preview          # Preview production build

# Environment Setup
# Create .env.local file manually and add:
# GEMINI_API_KEY=your_primary_key
# GEMINI_API_KEY_1=your_second_key  # Optional for rotation
# GEMINI_KEY_COOLDOWN_MINUTES=15    # Optional cooldown duration
```

---

## Version History & Changelog

**Current Version:** 0.0.0 (Active Development)

**Recent Updates:**
- Initial portfolio structure
- Theme system with 8 modes (focused, night_owl, early_bird, rainy_day, celebration, zen, cyberpunk, retro)
- Gamification with 8 achievements including easter eggs
- AI chat integration (Gemini 2.5 Flash) with bilingual support
- **API key rotation system** with automatic rate limit handling
- React Three Fiber art backgrounds
- Responsive navigation with sidebar
- HashRouter for GitHub Pages compatibility
- Vercel Analytics integration
- 6 real portfolio projects showcased
- Work page with deep dive sections and scroll progress
- Gallery page with control panel
- 3D portrait on About page
- Execution log component

---

## Additional Resources

- **React Documentation:** https://react.dev
- **Framer Motion Docs:** https://www.framer.com/motion/
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Google Gemini AI:** https://ai.google.dev/docs
- **Vite Guide:** https://vitejs.dev/guide/

---

## Summary for AI Assistants

When working with this codebase:

1. **Always use theme colors** (`theme-*` classes or CSS variables)
2. **Respect the brutalist aesthetic** (bold, experimental, minimal)
3. **Maintain TypeScript types** (no `any` types)
4. **Test responsiveness** (mobile-first approach)
5. **Check gamification features** (don't break 8 easter eggs)
6. **Update content** through the admin panel or `db/schema.sql` seeds
7. **Use Context API** for global state (don't prop-drill)
8. **Follow existing patterns** (component structure, naming)
9. **Remember the student context** (not a professional agency)
10. **Test all 8 themes** after visual changes
11. **API key rotation** - Multiple Gemini API keys supported with automatic failover
12. **Bilingual AI** - Chat responds in Vietnamese or English based on user input

**This is a living portfolio** that showcases experimental UI/UX, HCI principles, and front-end development skills. Treat it as a playground for creative coding while maintaining clean architecture.

**Key Features:**
- 8 dynamic themes with visual effects
- 8 gamification achievements
- Sophisticated API key rotation system
- Bilingual AI chat interface
- Real portfolio projects from GitHub
- Cloudinary CDN for images
- Vercel Analytics integration

---

*Last Updated: 2025-11-22*
*Maintainer: Nguyen Xuan Dai (Xuni-Dizan)*
