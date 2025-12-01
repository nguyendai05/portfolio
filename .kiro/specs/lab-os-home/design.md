# Design Document: Lab OS Home

## Overview

Nâng cấp trang Home thành "Lab OS" - một hệ điều hành/HUD thống nhất cho Xuni Lab. Thiết kế tập trung vào việc tạo ra trải nghiệm scroll-driven với các hiệu ứng nổi tiếng từ các website đoạt giải thưởng, đồng thời duy trì performance tốt và accessibility.

### Design Goals
- Thống nhất ngôn ngữ thiết kế: pill buttons, góc vuông, shadow phẳng retro OS
- Scroll-driven animations với Framer Motion
- Interactive elements: magnetic buttons, 3D tilt cards, cursor spotlight
- Performance-first: lazy loading, reduced motion support, mobile optimization

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.tsx                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    ThemeProvider                             ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │               GamificationProvider                       │││
│  │  │  ┌─────────────────────────────────────────────────────┐│││
│  │  │  │              ReducedMotionProvider (NEW)            ││││
│  │  │  │  ┌─────────────────────────────────────────────────┐││││
│  │  │  │  │                   Router                        │││││
│  │  │  │  │  ┌─────────────────────────────────────────────┐│││││
│  │  │  │  │  │              Home Page                      ││││││
│  │  │  │  │  │  ┌─────────────────────────────────────────┐││││││
│  │  │  │  │  │  │  ScrollProgressBar (NEW)                │││││││
│  │  │  │  │  │  │  CursorSpotlight (NEW)                  │││││││
│  │  │  │  │  │  │  VerticalTimeline (NEW)                 │││││││
│  │  │  │  │  │  │  PinnedHero (ENHANCED)                  │││││││
│  │  │  │  │  │  │  PhilosophySection                      │││││││
│  │  │  │  │  │  │  FeaturedWorks (ENHANCED)               │││││││
│  │  │  │  │  │  │  MilestonesTimeline (ENHANCED)          │││││││
│  │  │  │  │  │  │  StrictModeConsole (ENHANCED)           │││││││
│  │  │  │  │  │  │  LabPreview (ENHANCED)                  │││││││
│  │  │  │  │  │  │  CinematicContact (ENHANCED)            │││││││
│  │  │  │  │  │  └─────────────────────────────────────────┘││││││
│  │  │  │  │  └─────────────────────────────────────────────┘│││││
│  │  │  │  └─────────────────────────────────────────────────┘││││
│  │  │  └─────────────────────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### New Components

#### 1. ScrollProgressBar
```typescript
interface ScrollProgressBarProps {
  sections: SectionConfig[];
}

interface SectionConfig {
  id: string;
  label: string;
  threshold: [number, number]; // [start, end] as scroll progress 0-1
}
```

Thanh progress ngang ở top viewport, hiển thị các section labels và highlight section hiện tại.

#### 2. MagneticButton
```typescript
interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  magneticStrength?: number; // 0-1, default 0.3
  springConfig?: SpringOptions;
  disabled?: boolean;
}
```

Wrapper component tạo hiệu ứng magnetic cho buttons.

#### 3. StatusBadge
```typescript
interface StatusBadgeProps {
  defaultText?: string;
  typewriterSpeed?: number;
}
```

Badge động hiển thị status với typewriter effect, thay đổi theo theme/context.

#### 4. VerticalTimeline
```typescript
interface VerticalTimelineProps {
  sections: SectionConfig[];
  position?: 'left' | 'right';
}
```

Timeline dọc với scroll spy, hiển thị numbered dots và labels.

#### 5. CursorSpotlight
```typescript
interface CursorSpotlightProps {
  intensity?: number; // 0-1
  blendMode?: 'soft-light' | 'difference' | 'overlay';
  color?: string;
}
```

Full-screen overlay với radial gradient theo vị trí cursor.

#### 6. TiltCard
```typescript
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // degrees, default 15
  perspective?: number; // px, default 1000
  glareEnabled?: boolean;
}
```

Card với 3D tilt effect theo cursor position.

#### 7. ConsoleBar
```typescript
interface ConsoleBarProps {
  filename: string;
  status: 'running' | 'idle' | 'error';
  typingText?: string;
}
```

Fake console bar cho strict mode section.

### Enhanced Components

#### PinnedHero (Enhanced Home Hero)
- Sử dụng `position: sticky` với `min-height: 300vh`
- 3 phases dựa trên scrollYProgress
- Tích hợp MagneticButton cho CTAs
- StatusBadge thay thế badge cũ

#### FeaturedWorks (Enhanced Project Cards)
- Wrap mỗi project row trong TiltCard
- Thêm debug grid overlay khi hover
- "Case Study →" tag slide-in animation

#### MilestonesTimeline (Enhanced Milestones)
- Vertical line với scroll-linked fill
- Animated dots với glow effect
- Sticky year pill
- Trigger achievement khi scroll hết

#### StrictModeConsole (Enhanced Focus Areas)
- ConsoleBar ở top
- Noise + scanline overlay
- Expandable cards với log bullets

#### LabPreview (Enhanced Experiments)
- Hover reveal thumbnails
- Dashed border scanning animation
- Shuffle button với layout animation

#### CinematicContact (Enhanced Contact)
- Parallax background/card
- Real-time status display
- Circuit line hover effects

### Context Updates

#### ReducedMotionContext (New)
```typescript
interface ReducedMotionContextType {
  prefersReducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
}
```

Global context để quản lý reduced motion preference.

## Data Models

### Section Configuration
```typescript
const HOME_SECTIONS: SectionConfig[] = [
  { id: 'hero', label: 'BOOT', threshold: [0, 0.15] },
  { id: 'philosophy', label: 'PHILOSOPHY', threshold: [0.15, 0.30] },
  { id: 'works', label: 'LABS', threshold: [0.30, 0.50] },
  { id: 'milestones', label: 'MILESTONES', threshold: [0.50, 0.65] },
  { id: 'strict', label: 'STRICT MODE', threshold: [0.65, 0.80] },
  { id: 'lab', label: 'LAB PREVIEW', threshold: [0.80, 0.92] },
  { id: 'contact', label: 'CONTACT', threshold: [0.92, 1] },
];
```

### Status Badge States
```typescript
type BadgeState = 
  | { type: 'default'; text: string }
  | { type: 'theme'; theme: string }
  | { type: 'chatbot'; active: boolean }
  | { type: 'collab'; available: boolean };
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Scroll Progress Accuracy
*For any* scroll position within the page, the highlighted section in ScrollProgressBar SHALL correspond to the section whose threshold range contains that scroll position.
**Validates: Requirements 1.2**

### Property 2: Pinned Hero Phase Consistency
*For any* scrollYProgress value, the hero content displayed SHALL match exactly one of the three defined phases (0-0.33: Hi only, 0.33-0.66: tagline+stats, 0.66-1: CTAs).
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 3: Magnetic Button Bounds
*For any* cursor position within the magnetic field, the button translation SHALL be proportional to cursor distance and SHALL NOT exceed the magneticStrength * maxDistance.
**Validates: Requirements 3.2**

### Property 4: Magnetic Button Return
*For any* magnetic button that has been displaced, when the cursor leaves the magnetic field, the button SHALL return to its original position (x=0, y=0).
**Validates: Requirements 3.3**

### Property 5: Status Badge Theme Sync
*For any* theme change event, the StatusBadge text SHALL update to reflect the corresponding theme-specific message within one render cycle.
**Validates: Requirements 4.2, 4.3**

### Property 6: Vertical Timeline Scroll Sync
*For any* section entering the viewport, the corresponding dot in VerticalTimeline SHALL be visually distinguished (enlarged) and the line fill SHALL progress proportionally.
**Validates: Requirements 5.2, 5.3**

### Property 7: Cursor Spotlight Accessibility
*For any* device with pointer: coarse OR user with prefers-reduced-motion enabled, the CursorSpotlight component SHALL NOT render any visual elements.
**Validates: Requirements 6.3, 6.4**

### Property 8: TiltCard Transform Calculation
*For any* cursor position within a TiltCard, the rotateX and rotateY values SHALL be calculated based on cursor offset from card center, bounded by maxTilt degrees.
**Validates: Requirements 7.1**

### Property 9: Milestones Achievement Trigger
*For any* user who scrolls past all milestone items (scrollYProgress > threshold), the "lab_history_reader" achievement SHALL be unlocked exactly once.
**Validates: Requirements 8.5**

### Property 10: Reduced Motion Compliance
*For any* user with prefers-reduced-motion enabled, all infinite animations (glitch, blob, marquee, scanline) SHALL be disabled or replaced with static alternatives.
**Validates: Requirements 12.1**

## Error Handling

### Scroll Position Edge Cases
- Handle scroll position < 0 or > 1 gracefully
- Debounce scroll events to prevent excessive re-renders
- Use `requestAnimationFrame` for smooth animations

### Device Detection
- Fallback for devices without pointer events
- Handle window resize during animations
- Graceful degradation for older browsers

### Context Availability
- Provide default values when contexts are unavailable
- Handle SSR scenarios where window is undefined

## Testing Strategy

### Unit Testing
- Test utility functions: `calculateTilt`, `getActiveSection`, `clamp`
- Test context providers with mock values
- Test component rendering with different props

### Property-Based Testing
Property-based tests sẽ sử dụng **fast-check** library cho TypeScript/JavaScript.

Mỗi property test PHẢI:
- Chạy tối thiểu 100 iterations
- Được annotate với format: `**Feature: lab-os-home, Property {number}: {property_text}**`
- Reference correctness property từ design document

**Test Categories:**

1. **Scroll Progress Tests**
   - Generate random scroll positions (0-1)
   - Verify section highlighting logic
   - Test boundary conditions

2. **Magnetic Button Tests**
   - Generate random cursor positions
   - Verify translation bounds
   - Test return-to-origin behavior

3. **TiltCard Tests**
   - Generate random cursor positions within card bounds
   - Verify rotation calculations
   - Test maxTilt constraints

4. **Accessibility Tests**
   - Test with various media query combinations
   - Verify component visibility/behavior changes

### Integration Testing
- Test scroll-driven animations end-to-end
- Test context interactions (theme + badge, gamification + milestones)
- Test mobile vs desktop behavior differences
