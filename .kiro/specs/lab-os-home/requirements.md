# Requirements Document

## Introduction

Nâng cấp trang Home của portfolio thành một "Lab OS" - hệ điều hành/HUD thống nhất cho "Xuni Lab". Mục tiêu là biến các section rời rạc thành một hệ sinh thái mạch lạc với ngôn ngữ thiết kế nhất quán, hiệu ứng scroll-driven nổi tiếng, và trải nghiệm tương tác cao cấp như các website đoạt giải thưởng.

## Glossary

- **Lab OS**: Hệ điều hành ảo đại diện cho toàn bộ trang Home, với giao diện HUD thống nhất
- **HUD (Heads-Up Display)**: Giao diện hiển thị thông tin overlay trên màn hình
- **Scroll Progress Bar**: Thanh tiến trình hiển thị vị trí scroll hiện tại trong trang
- **Pinned Hero**: Hero section được "ghim" lại khi scroll, tạo hiệu ứng multi-phase
- **Magnetic Button**: Nút có hiệu ứng "hút" theo con trỏ chuột
- **Cursor Spotlight**: Hiệu ứng ánh sáng theo vị trí con trỏ chuột
- **3D Tilt Card**: Card có hiệu ứng nghiêng 3D theo vị trí chuột
- **Timeline Scroll Animation**: Animation timeline được kích hoạt bởi scroll
- **Parallax**: Hiệu ứng các layer di chuyển với tốc độ khác nhau tạo chiều sâu
- **prefers-reduced-motion**: Media query để phát hiện người dùng muốn giảm animation

## Requirements

### Requirement 1: Scroll Progress Bar (Lab OS Navigation)

**User Story:** As a visitor, I want to see my scroll progress through the page sections, so that I can understand where I am in the "Lab OS" experience.

#### Acceptance Criteria

1. WHEN the page loads THEN the System SHALL display a thin horizontal progress bar at the top of the viewport showing section labels: "BOOT → LABS → MILESTONES → STRICT MODE → LAB PREVIEW → CONTACT"
2. WHEN the user scrolls through the page THEN the System SHALL highlight the current section label based on scroll position using scrollYProgress and useTransform
3. WHEN a section becomes active THEN the System SHALL visually distinguish the active step with accent color and scale animation
4. WHILE the user is on mobile devices THEN the System SHALL hide or minimize the progress bar to preserve screen space

### Requirement 2: Pinned Multi-Phase Hero

**User Story:** As a visitor, I want to experience a scroll-driven hero that reveals content in phases, so that I feel engaged with a mini-story as I scroll.

#### Acceptance Criteria

1. WHEN the hero section is in view THEN the System SHALL pin the hero using position sticky with min-height of 300vh to allow scroll-driven phases
2. WHEN scrollYProgress is between 0 and 0.33 THEN the System SHALL display only the large "Hi." text with generative background
3. WHEN scrollYProgress is between 0.33 and 0.66 THEN the System SHALL fade in the tagline, description, and small stats
4. WHEN scrollYProgress is between 0.66 and 1 THEN the System SHALL shift in the CTA buttons and "Ask Mantis" field
5. WHEN the user completes scrolling through the hero THEN the System SHALL smoothly unpin and transition to the next section

### Requirement 3: Magnetic Button Effect

**User Story:** As a visitor, I want interactive buttons that respond to my cursor, so that the interface feels alive and engaging.

#### Acceptance Criteria

1. WHEN the user hovers near a magnetic button THEN the System SHALL calculate the distance between cursor and button center
2. WHEN the cursor is within the magnetic field THEN the System SHALL translate the button position slightly toward the cursor using Framer Motion x and y values
3. WHEN the cursor leaves the magnetic field THEN the System SHALL animate the button back to its original position with spring physics
4. WHEN implementing magnetic buttons THEN the System SHALL apply the effect to "View Assignments" CTA, Mantis chatbot button, and selected Navigation icons

### Requirement 4: Dynamic Status Badge

**User Story:** As a visitor, I want to see contextual status information that changes based on my interaction, so that the interface feels personalized and responsive.

#### Acceptance Criteria

1. WHEN the page loads THEN the System SHALL display a status badge with typewriter animation effect
2. WHEN the theme changes to night_owl THEN the System SHALL update badge text to "Night coding mode"
3. WHEN the chatbot is opened THEN the System SHALL update badge text to "Lab assistant attached"
4. WHEN the user is available for collaboration THEN the System SHALL display "Available for collab" with pulsing animation
5. WHEN displaying status text THEN the System SHALL use the existing Typewriter component from NeuralInterface

### Requirement 5: Vertical Section Timeline (Scroll Spy)

**User Story:** As a visitor, I want a visual indicator showing my position across all sections, so that I can navigate and understand the page structure.

#### Acceptance Criteria

1. WHEN the page loads THEN the System SHALL display a vertical timeline on the right side with numbered dots for each section
2. WHEN a section enters the viewport THEN the System SHALL enlarge the corresponding dot and show a small label
3. WHEN the user scrolls THEN the System SHALL fill the connecting line progressively based on scroll position
4. WHILE on mobile devices THEN the System SHALL hide the vertical timeline to preserve screen space

### Requirement 6: Cursor Spotlight Effect

**User Story:** As a visitor, I want a subtle spotlight effect following my cursor, so that the interface feels immersive and premium.

#### Acceptance Criteria

1. WHEN the user moves the cursor THEN the System SHALL render a full-screen overlay div with radial gradient centered at cursor position
2. WHEN rendering the spotlight THEN the System SHALL use mix-blend-mode soft-light or difference for visual effect
3. WHILE the user has pointer: coarse (touch device) THEN the System SHALL disable the cursor spotlight
4. WHILE the user has prefers-reduced-motion enabled THEN the System SHALL disable the cursor spotlight
5. WHEN implementing the spotlight THEN the System SHALL use pointer-events: none to prevent interaction blocking

### Requirement 7: 3D Tilt Project Cards

**User Story:** As a visitor, I want project cards that respond to my cursor with 3D depth, so that the featured works feel interactive and premium.

#### Acceptance Criteria

1. WHEN the user hovers over a project card THEN the System SHALL calculate rotateX and rotateY based on cursor position within the card
2. WHEN applying 3D tilt THEN the System SHALL adjust box-shadow to simulate light source movement
3. WHEN the user hovers over a project card THEN the System SHALL display a "Case Study →" tag that slides in
4. WHEN displaying project background THEN the System SHALL overlay SVG grid lines with debug coordinates for lab aesthetic
5. WHEN the cursor leaves the card THEN the System SHALL animate back to flat position with spring physics

### Requirement 8: Milestones Timeline Animation

**User Story:** As a visitor, I want the milestones section to animate as I scroll, so that my achievements feel dynamic and engaging.

#### Acceptance Criteria

1. WHEN the milestones section is in view THEN the System SHALL display a vertical line on the left side of the awards list
2. WHEN an award enters the viewport THEN the System SHALL animate the corresponding dot with scale and glow effect
3. WHEN scrolling through milestones THEN the System SHALL progressively fill the timeline line based on visible items
4. WHEN displaying milestones THEN the System SHALL show a sticky year pill that updates based on the currently visible award
5. WHEN the user scrolls past all milestones THEN the System SHALL trigger the "lab_history_reader" achievement via GamificationContext

### Requirement 9: Strict Mode Console Enhancement

**User Story:** As a visitor, I want the strict mode section to feel like a coding console, so that the developer aesthetic is reinforced.

#### Acceptance Criteria

1. WHEN the strict mode section is in view THEN the System SHALL display a fake console bar at the top with "Xuni.StrictMode.tsx · RUNNING" text
2. WHEN displaying the console bar THEN the System SHALL show a Code2 icon, green running indicator, and typing loop text "Linting… 0 warnings"
3. WHEN rendering the section THEN the System SHALL apply noise texture and scanline overlay effects with low opacity
4. WHEN the user hovers over a focus area block THEN the System SHALL expand the card height and reveal additional log-style bullet points

### Requirement 10: Lab Preview Enhancements

**User Story:** As a visitor, I want the experiments section to feel like a laboratory, so that the playful exploration vibe is enhanced.

#### Acceptance Criteria

1. WHEN the user hovers over an experiment card THEN the System SHALL reveal a mini-thumbnail with fade and rotation animation
2. WHEN hovering over experiment cards THEN the System SHALL animate the border with dashed scanning effect
3. WHEN the user clicks a shuffle button THEN the System SHALL randomly reorder the experiments with layout animation
4. WHEN displaying experiment cards THEN the System SHALL include a CTA linking to the corresponding Work page section

### Requirement 11: Cinematic Contact Section

**User Story:** As a visitor, I want the contact section to feel like a cinematic outro, so that the page ends with impact.

#### Acceptance Criteria

1. WHEN the contact section is in view THEN the System SHALL apply parallax effect with background image moving slower than the contact card
2. WHEN displaying the contact card THEN the System SHALL show real-time status including "Available for collaboration" and "Last deploy" date
3. WHEN the user hovers over social buttons THEN the System SHALL animate circuit-style lines from the card toward screen edges
4. WHEN rendering parallax THEN the System SHALL use useScroll with section-specific ref for smooth depth effect

### Requirement 12: Performance and Accessibility

**User Story:** As a visitor with accessibility needs or limited device capability, I want the site to respect my preferences and perform well, so that I can enjoy the experience without issues.

#### Acceptance Criteria

1. WHILE the user has prefers-reduced-motion enabled THEN the System SHALL disable infinite animations including glitch, blob, marquee, and scanline effects
2. WHILE on mobile devices THEN the System SHALL reduce GenerativeArt intensity or disable canvas-heavy effects
3. WHEN loading heavy components THEN the System SHALL lazy-load LifeGallery and other non-critical components
4. WHEN implementing animations THEN the System SHALL provide a global flag in context to toggle reduced motion mode
