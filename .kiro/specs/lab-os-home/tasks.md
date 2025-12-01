# Implementation Plan

## 1. Setup Foundation and Context

- [ ] 1.1 Create ReducedMotionContext for accessibility
  - Create `context/ReducedMotionContext.tsx`
  - Implement `useReducedMotion` hook that detects `prefers-reduced-motion`
  - Provide global flag to disable infinite animations
  - _Requirements: 12.1, 12.4_

- [ ]* 1.2 Write property test for reduced motion compliance
  - **Property 10: Reduced Motion Compliance**
  - **Validates: Requirements 12.1**

- [ ] 1.3 Create utility functions for scroll calculations
  - Create `utils/scrollUtils.ts`
  - Implement `getActiveSection(scrollProgress, sections)` function
  - Implement `clamp(value, min, max)` utility
  - Implement `calculateTilt(cursorX, cursorY, cardRect, maxTilt)` function
  - _Requirements: 1.2, 7.1_

- [ ]* 1.4 Write property tests for utility functions
  - **Property 1: Scroll Progress Accuracy**
  - **Property 8: TiltCard Transform Calculation**
  - **Validates: Requirements 1.2, 7.1**

- [ ] 1.5 Define section configuration constants
  - Create `constants/sections.ts`
  - Define `HOME_SECTIONS` array with id, label, threshold for each section
  - _Requirements: 1.1, 5.1_

## 2. Checkpoint - Ensure foundation tests pass

- [x] 2. Checkpoint





  - Ensure all tests pass, ask the user if questions arise.

## 3. Core UI Components

- [ ] 3.1 Create MagneticButton component
  - Create `components/MagneticButton.tsx`
  - Implement mouse tracking with `onMouseMove` on wrapper
  - Calculate distance from cursor to button center
  - Apply `x`, `y` translation using Framer Motion `useMotionValue`
  - Implement spring physics for return animation
  - Add `magneticStrength` and `disabled` props
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 3.2 Write property tests for MagneticButton
  - **Property 3: Magnetic Button Bounds**
  - **Property 4: Magnetic Button Return**
  - **Validates: Requirements 3.2, 3.3**

- [ ] 3.3 Create TiltCard component
  - Create `components/TiltCard.tsx`
  - Implement cursor position tracking within card bounds
  - Calculate `rotateX`, `rotateY` based on cursor offset from center
  - Apply `perspective` and `transform-style: preserve-3d`
  - Implement spring return to flat on mouse leave
  - Add dynamic box-shadow for light source simulation
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 3.4 Create CursorSpotlight component
  - Create `components/CursorSpotlight.tsx`
  - Track cursor position globally with `mousemove` event
  - Render full-screen overlay with `radial-gradient` at cursor position
  - Apply `mix-blend-mode: soft-light`
  - Check for `pointer: coarse` and disable on touch devices
  - Respect `prefers-reduced-motion` via ReducedMotionContext
  - Use `pointer-events: none` to prevent blocking
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 3.5 Write property test for CursorSpotlight accessibility
  - **Property 7: Cursor Spotlight Accessibility**
  - **Validates: Requirements 6.3, 6.4**

- [ ] 3.6 Create StatusBadge component
  - Create `components/StatusBadge.tsx`
  - Implement typewriter animation effect
  - Subscribe to ThemeContext for theme changes
  - Update text based on theme (night_owl → "Night coding mode")
  - Listen for chatbot state changes
  - Display "Available for collab" with pulse animation as default
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 3.7 Write property test for StatusBadge theme sync
  - **Property 5: Status Badge Theme Sync**
  - **Validates: Requirements 4.2**

## 4. Checkpoint - Ensure core component tests pass

- [x] 4. Checkpoint





  - Ensure all tests pass, ask the user if questions arise.

## 5. Navigation Components

- [ ] 5.1 Create ScrollProgressBar component
  - Create `components/ScrollProgressBar.tsx`
  - Render thin horizontal bar at top of viewport with `position: fixed`
  - Display section labels: "BOOT → LABS → MILESTONES → STRICT MODE → LAB PREVIEW → CONTACT"
  - Use `useScroll` and `scrollYProgress` from Framer Motion
  - Highlight active section based on scroll position using `useTransform`
  - Apply accent color and scale animation to active step
  - Hide on mobile using media query or viewport check
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5.2 Create VerticalTimeline component
  - Create `components/VerticalTimeline.tsx`
  - Render vertical line with numbered dots on right side
  - Use `useScroll` to track scroll position
  - Enlarge active dot and show label when section is in view
  - Fill connecting line progressively based on scroll
  - Hide on mobile devices
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 5.3 Write property test for VerticalTimeline scroll sync
  - **Property 6: Vertical Timeline Scroll Sync**
  - **Validates: Requirements 5.2, 5.3**

## 6. Enhanced Hero Section

- [ ] 6.1 Implement PinnedHero with scroll-driven phases
  - Modify hero section in `pages/Home.tsx`
  - Wrap hero in container with `position: sticky` and `min-height: 300vh`
  - Create inner content container with `height: 100vh`
  - Use `useScroll` with target ref for hero container
  - Phase 1 (0-0.33): Show only "Hi." text with generative background
  - Phase 2 (0.33-0.66): Fade in tagline, description, stats
  - Phase 3 (0.66-1): Shift in CTAs and "Ask Mantis" field
  - Use `useTransform` for opacity and position animations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 6.2 Write property test for hero phase consistency
  - **Property 2: Pinned Hero Phase Consistency**
  - **Validates: Requirements 2.2, 2.3, 2.4**

- [ ] 6.3 Integrate MagneticButton into hero CTAs
  - Wrap "View Assignments" button with MagneticButton
  - Wrap Mantis chatbot trigger with MagneticButton
  - _Requirements: 3.4_

- [ ] 6.4 Replace hero badge with StatusBadge
  - Remove existing floating badge
  - Add StatusBadge component in badge position
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

## 7. Enhanced Featured Works Section

- [ ] 7.1 Integrate TiltCard into project rows
  - Wrap each project row in `TiltCard` component
  - Apply subtle tilt effect (maxTilt: 10-15 degrees)
  - _Requirements: 7.1, 7.2_

- [ ] 7.2 Add debug grid overlay on hover
  - Create SVG grid pattern overlay
  - Show debug coordinates on hover
  - Apply low opacity (0.1) for subtle effect
  - _Requirements: 7.4_

- [ ] 7.3 Add "Case Study →" tag slide-in animation
  - Create tag element with `whileHover` animation
  - Slide in from left on hover
  - _Requirements: 7.3_

## 8. Enhanced Milestones Section

- [ ] 8.1 Implement MilestonesTimeline with animated line
  - Add vertical line element on left side of awards list
  - Create dot elements for each award
  - Use `whileInView` for dot scale and glow animation
  - Implement line fill based on scroll progress
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 8.2 Add sticky year pill
  - Create year pill element with `position: sticky; top: 30%`
  - Update year based on currently visible award using IntersectionObserver
  - _Requirements: 8.4_

- [ ] 8.3 Implement achievement trigger on scroll completion
  - Track scroll progress through milestones section
  - Call `unlockAchievement('lab_history_reader')` when scrollYProgress > threshold
  - Ensure achievement is only triggered once
  - _Requirements: 8.5_

- [ ]* 8.4 Write property test for achievement trigger
  - **Property 9: Milestones Achievement Trigger**
  - **Validates: Requirements 8.5**

## 9. Checkpoint - Ensure milestone tests pass

- [x] 9. Checkpoint





  - Ensure all tests pass, ask the user if questions arise.

## 10. Enhanced Strict Mode Section

- [ ] 10.1 Create ConsoleBar component
  - Create `components/ConsoleBar.tsx`
  - Display "Xuni.StrictMode.tsx · RUNNING" text
  - Add Code2 icon and green running indicator dot
  - Implement typing loop animation for "Linting… 0 warnings"
  - _Requirements: 9.1, 9.2_

- [ ] 10.2 Add noise and scanline overlay
  - Create noise texture using CSS or base64 PNG
  - Add scanline effect using existing Tailwind keyframe
  - Apply low opacity (0.08) for subtle effect
  - _Requirements: 9.3_

- [ ] 10.3 Implement expandable focus area cards
  - Add hover state that increases card height
  - Reveal log-style bullet points on hover:
    - "> Currently learning: React + Framer Motion"
    - "> Last commit: UI Refactor"
  - _Requirements: 9.4_

## 11. Enhanced Lab Preview Section

- [ ] 11.1 Add hover reveal mini-thumbnails
  - Create abstract thumbnail (SVG/CSS gradient) for each experiment
  - Fade in and rotate thumbnail on hover
  - _Requirements: 10.1_

- [ ] 11.2 Implement dashed border scanning animation
  - Add animated dashed border on hover
  - Use `background-size` trick or `border-image` for scanning effect
  - _Requirements: 10.2_

- [ ] 11.3 Add shuffle button with layout animation
  - Create "Feeling lucky" button with Shuffle icon
  - Implement random reorder of experiments on click
  - Use Framer Motion `layout` prop for smooth animation
  - _Requirements: 10.3_

- [ ] 11.4 Add deep link CTA to Work page
  - Add "View full lab in Work →" CTA on hover/click
  - Link to specific section in `/work` page
  - _Requirements: 10.4_

## 12. Enhanced Contact Section

- [ ] 12.1 Implement parallax effect
  - Use `useScroll` with section-specific ref
  - Apply slower movement to background image using `useTransform`
  - Apply faster movement to contact card
  - _Requirements: 11.1, 11.4_

- [ ] 12.2 Add real-time status display
  - Add "STATUS: Available for collaboration" text
  - Add "Last deploy: xx/xx/2025" (hardcoded or from mock)
  - Add Activity/Zap icon
  - _Requirements: 11.2_

- [ ] 12.3 Implement circuit line hover effects
  - Create pseudo-element lines from card to screen edges
  - Animate `scaleX` from 0 to 1 on hover
  - Apply to GitHub and Contact buttons
  - _Requirements: 11.3_

## 13. Performance Optimizations

- [ ] 13.1 Implement reduced motion support across all components
  - Wrap infinite animations with reduced motion check
  - Disable glitch, blob, marquee, scanline when reduced motion is preferred
  - _Requirements: 12.1_

- [ ] 13.2 Optimize GenerativeArt for mobile
  - Reduce intensity on mobile devices
  - Consider disabling canvas on low-end devices
  - _Requirements: 12.2_

- [ ] 13.3 Lazy-load heavy components
  - Ensure LifeGallery and other non-critical components are lazy-loaded
  - Add Suspense boundaries where needed
  - _Requirements: 12.3_

## 14. Integration and Polish

- [ ] 14.1 Integrate ScrollProgressBar into Home page
  - Add ScrollProgressBar at top of Home component
  - Pass HOME_SECTIONS configuration
  - _Requirements: 1.1_

- [ ] 14.2 Integrate VerticalTimeline into Home page
  - Add VerticalTimeline on right side
  - Pass HOME_SECTIONS configuration
  - _Requirements: 5.1_

- [ ] 14.3 Integrate CursorSpotlight into Home page
  - Add CursorSpotlight as overlay
  - Configure intensity and blend mode
  - _Requirements: 6.1_

- [ ] 14.4 Apply consistent Lab OS design language
  - Ensure pill buttons have rounded borders, black border, flat shadow
  - Apply retro OS vibe with square corners and large shadows where appropriate
  - _Requirements: Design consistency_

## 15. Final Checkpoint - Ensure all tests pass

- [x] 15. Final Checkpoint





  - Ensure all tests pass, ask the user if questions arise.
