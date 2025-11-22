<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://res.cloudinary.com/dak4x4d7u/image/upload/v1763829217/Whisk_cjmyety3imz3y2mk1snzmtytyjm4qtl3gzy40sz_k2c1um.png" />
</div>

## Project Overview

This is a **brutalist, avant-garde portfolio website** for **Nguyen Xuan Dai (Xuni-Dizan)**, an IT student and front-end developer based in Ho Chi Minh City, Vietnam. The portfolio showcases experimental UI/UX design with gamification features, dynamic theming, and AI-powered chat interface.

**Tech Stack:**
- **Framework:** React 18.2.0 with TypeScript 5.8.2
- **Build Tool:** Vite 6.2.0
- **Router:** React Router DOM 6.23.0 (HashRouter)
- **Animations:** Framer Motion 11.0.8
- **3D Graphics:** Three.js 0.160.0 with React Three Fiber & Drei
- **Icons:** Lucide React 0.344.0
- **AI Integration:** Google Gemini AI (@google/genai 1.30.0)
- **Styling:** Tailwind CSS (via CDN) + CSS custom properties

---

## Directory Structure

```
portfolio/
├── components/          # Reusable UI components
│   ├── GenerativeArt.tsx    # 3D/Canvas art backgrounds
│   ├── Navigation.tsx        # Main navigation + sidebar
│   ├── GlitchText.tsx       # Text effect component
│   ├── Preloader.tsx        # Loading screen
│   ├── NeuralInterface.tsx  # AI chat interface (Gemini)
│   ├── ThemeSwitcher.tsx    # Theme selection UI
│   ├── ProjectModal.tsx     # Project detail modal
│   └── TrophyCase.tsx       # Achievement display
├── pages/              # Route-level page components
│   ├── Home.tsx            # Landing page
│   ├── Work.tsx            # Projects showcase
│   ├── About.tsx           # About/bio page
│   ├── Contact.tsx         # Contact form/info
│   ├── Gallery.tsx         # Visual gallery
│   ├── Mentorship.tsx      # Mentorship offerings
│   └── Collaboration.tsx   # Collaboration info
├── context/            # React Context providers
│   ├── ThemeContext.tsx         # Theme state management
│   └── GamificationContext.tsx  # Achievements & easter eggs
├── services/           # External service integrations
│   └── geminiService.ts    # Google Gemini AI service
├── data/               # Static data & mock content
│   └── mockData.ts         # Projects, tech stack, milestones
├── App.tsx             # Main app component with routing
├── index.tsx           # React entry point
├── index.html          # HTML template with Tailwind config
├── types.ts            # TypeScript type definitions
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
├── package.json        # Dependencies & scripts
└── metadata.json       # App metadata
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
Defined in `context/GamificationContext.tsx:30-38`:

1. **Konami Code** (`↑↑↓↓←→←→BA`): Toggles Neo Mode
2. **"hacktheplanet"** (typed): Activates Neo Mode
3. **"debugmode"** (typed): Toggles debug overlay
4. **Triple-click logo**: Unlocks "Secret Lab" achievement
5. **Night Owl**: Auto-unlocked when visiting 11pm-4am
6. **Art Connoisseur**: View all generative art pieces
7. **Conversationalist**: Long AI chat session

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
GEMINI_API_KEY=your_gemini_api_key_here
```

**Vite exposes this as:**
- `process.env.API_KEY` (for backwards compatibility)
- `process.env.GEMINI_API_KEY`

Configured in `vite.config.ts:13-16`

**Important:** API key is loaded at build time, not runtime. Requires rebuild after changes.

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
- **System Instruction:** Brutalist persona, student context (lines 8-26)
- **Error Handling:** Returns fallback messages on failure

### Neural Interface Component
Located in `components/NeuralInterface.tsx`:
- Floating chat button in bottom-left corner
- Maintains conversation history
- Stores messages in component state (not persisted)

**Important Notes:**
- AI represents Nguyen Xuan Dai as a **student**, not an agency
- Persona is experimental, brutalist, and concise (under 50 words typically)
- Mentions university projects and learning experiments when asked about work

---

## Data Layer

### Mock Data (`data/mockData.ts`)
Contains static content:
- **PROJECTS:** Array of university coursework and personal projects
- **CLIENTS:** Repurposed as tech stack for marquee animation
- **AWARDS:** Repurposed as milestones/achievements
- **EXPERIMENTS:** Additional UI/UX experiments

**Pattern:**
```tsx
import { PROJECTS, CLIENTS } from '../data/mockData';
```

### Data Update Guidelines
When modifying portfolio content:
1. Update `data/mockData.ts` (source of truth)
2. Ensure `Project` type matches interface in `types.ts`
3. Verify images are accessible (uses Unsplash URLs)
4. Add GitHub links where applicable

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
- **Port:** 3000
- **Host:** 0.0.0.0 (accessible on network)
- **Hot Module Replacement (HMR):** Enabled

### Build Output
- **Directory:** `dist/`
- **Target:** ES2022
- **Module:** ESNext

---

## Important Files Reference

| File | Purpose | When to Modify |
|------|---------|----------------|
| `App.tsx` | Main app, routing, context providers | Adding new routes, global effects |
| `index.tsx` | React entry point | Rarely needed |
| `index.html` | HTML template, Tailwind config | Adding fonts, global styles, meta tags |
| `vite.config.ts` | Build configuration | Env vars, aliases, plugins |
| `types.ts` | Type definitions | Adding new interfaces/types |
| `data/mockData.ts` | Portfolio content | Updating projects, tech stack, milestones |
| `context/ThemeContext.tsx` | Theme management | Adding new themes, changing colors |
| `context/GamificationContext.tsx` | Achievements | Adding new easter eggs |

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
3. **CMS Integration:** Replace `mockData.ts` with Contentful/Sanity
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
| `react-router-dom` | 6.23.0 | Client-side routing |
| `framer-motion` | 11.0.8 | Animation library |
| `three` | 0.160.0 | 3D graphics engine |
| `@react-three/fiber` | 8.15.16 | React renderer for Three.js |
| `@react-three/drei` | 9.102.6 | Three.js helpers |
| `lucide-react` | 0.344.0 | Icon library |
| `@google/genai` | 1.30.0 | Google Gemini AI SDK |
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
npm run dev              # Start dev server → http://localhost:3000

# Production
npm run build            # Build to dist/
npm run preview          # Preview production build

# Environment
cp .env.local.example .env.local    # Create env file
echo "GEMINI_API_KEY=your_key" > .env.local  # Add API key
```

---

## Version History & Changelog

**Current Version:** 0.0.0 (Initial Release)

**Recent Updates:**
- Initial portfolio structure
- Theme system with 8 modes
- Gamification with 7 achievements
- AI chat integration (Gemini)
- React Three Fiber art backgrounds
- Responsive navigation
- HashRouter for GitHub Pages compatibility

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
5. **Check gamification features** (don't break easter eggs)
6. **Update mockData.ts** for content changes
7. **Use Context API** for global state (don't prop-drill)
8. **Follow existing patterns** (component structure, naming)
9. **Remember the student context** (not a professional agency)
10. **Test all 8 themes** after visual changes

**This is a living portfolio** that showcases experimental UI/UX, HCI principles, and front-end development skills. Treat it as a playground for creative coding while maintaining clean architecture.

---

*Last Updated: 2025-11-20*
*Maintainer: Nguyen Xuan Dai (Xuni-Dizan)*
