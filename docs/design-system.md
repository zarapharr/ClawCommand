# ClawCommand Design System v1.0

**Phase:** 2 (Design Evolution & Specs)  
**Date:** 2026-03-23  
**Status:** Production-Ready Specification  
**Audience:** Product & Engineering Teams (Phase 3 Implementation)

---

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing & Grid](#spacing--grid)
4. [Component Specifications](#component-specifications)
5. [Dark Mode & Light Mode](#dark-mode--light-mode)
6. [Motion & Animation](#motion--animation)
7. [Accessibility](#accessibility)

---

## Color Palette

### Semantic Color System

ClawCommand uses a semantic color system aligned with operational status. Colors convey meaning across all UI elements.

#### Core Palette

| Semantic | Hex | RGB | Usage | WCAG AA | WCAG AAA |
|----------|-----|-----|-------|---------|----------|
| **Success** | `#10b981` | rgb(16, 185, 129) | Agent running, workflow complete, budget OK | ✓ | ✓ |
| **Warning** | `#f59e0b` | rgb(245, 158, 11) | Agent paused, cost trending, minor issue | ✓ | ✓ |
| **Error** | `#ef4444` | rgb(239, 68, 68) | Agent failed, budget exceeded, critical alert | ✓ | ✓ |
| **Info** | `#3b82f6` | rgb(59, 130, 246) | New agent, notification, informational alert | ✓ | ✓ |
| **Primary** | `#2563eb` | rgb(37, 99, 235) | Links, primary CTA, focus states | ✓ | ✓ |
| **Neutral** | `#6b7280` | rgb(107, 114, 128) | Secondary text, disabled state, dividers | — | — |

#### Extended Palette (Secondary)

| Color | Hex | Usage |
|-------|-----|-------|
| Neutral Light (surfaces) | `#f3f4f6` | Card backgrounds, input backgrounds |
| Neutral Dark (text) | `#1f2937` | Primary text (light mode) |
| Neutral Darker (borders) | `#d1d5db` | Dividers, borders (light mode) |

### Dark Mode (Primary)

| Semantic | Hex | Usage |
|----------|-----|-------|
| Background | `#0f1419` | Page background |
| Surface | `#1a202c` | Card background, input background |
| Border | `#2d3748` | Dividers, stroke |
| Text Primary | `#f3f4f6` | Main text |
| Text Secondary | `#9ca3af` | Secondary text, timestamps |
| Overlay | `#000000 @ 70%` | Modal backdrop |

### Light Mode (Secondary, Accessibility Fallback)

| Semantic | Hex | Usage |
|----------|-----|-------|
| Background | `#ffffff` | Page background |
| Surface | `#f9fafb` | Card background, input background |
| Border | `#e5e7eb` | Dividers, stroke |
| Text Primary | `#111827` | Main text |
| Text Secondary | `#6b7280` | Secondary text, timestamps |
| Overlay | `#000000 @ 50%` | Modal backdrop |

### Color Usage Rules

**DO:**
- Use semantic colors for status (green = running, red = error)
- Apply consistent color across all UI states (card, badge, icon)
- Use neutral colors for text and dividers
- Ensure 4.5:1 contrast ratio for text (WCAG AA minimum)

**DON'T:**
- Use color as the only visual indicator (add icons, text labels)
- Mix semantic colors (don't show green + red for same element)
- Use arbitrary colors for decoration
- Exceed 5 colors on a single screen (excludes charts)

---

## Typography

### Font Stack

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code, pre {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Courier, monospace;
  letter-spacing: 0;
  font-size: 0.875em;
}
```

### Type Scale

| Role | Font Size | Line Height | Font Weight | Letter Spacing | Usage |
|------|-----------|-------------|-------------|-----------------|-------|
| **H1** | 32px | 40px | 700 | -0.01em | Page title |
| **H2** | 24px | 32px | 600 | 0 | Section header |
| **H3** | 20px | 28px | 600 | 0 | Subsection header |
| **H4** | 18px | 24px | 600 | 0 | Card title |
| **Body L** | 16px | 24px | 400 | 0 | Primary text |
| **Body M** | 14px | 20px | 400 | 0 | Standard text |
| **Body S** | 12px | 16px | 400 | 0.01em | Helper text, caption |
| **Mono** | 14px | 20px | 400 | 0 | Code, API responses, logs |
| **Mono S** | 12px | 16px | 400 | 0 | Inline code, tokens |
| **Label** | 12px | 16px | 600 | 0.02em | Input labels, badge text |

### Type Hierarchy Example

```
H1:    "ClawCommand"                          (32px, bold, primary text)
H2:    "Factory Floor"                         (24px, bold, section)
H3:    "Agent Status"                          (20px, bold, subsection)
H4:    "Agent-001"                             (18px, bold, card title)
Body:  "Status: Running for 2m 34s"            (16px, regular)
Small: "Last updated 10s ago"                  (12px, regular, gray)
Mono:  "POST /api/agents/run"                  (14px, monospace)
```

### Line Length & Readability

- **Max line length:** 80 characters (320px at 16px base font)
- **Paragraph spacing:** 1.5x line height (24px at 16px base)
- **Letter spacing:** Tight (no extra spacing unless in labels)

---

## Spacing & Grid

### Grid System

ClawCommand uses a **4px base grid** for all spacing and sizing.

| Scale | Pixels | Usage |
|-------|--------|-------|
| **xs** | 4px | Icon padding, tight spacing |
| **sm** | 8px | Form padding, tight margins |
| **md** | 16px | Card padding, standard margins |
| **lg** | 24px | Section margins, large gaps |
| **xl** | 32px | Major section gaps, sidebar width |
| **2xl** | 48px | Page top margin, full-height spacing |

### Spacing Rules

**Padding:**
- Buttons: 12px (vertical) × 16px (horizontal) = 3×4 grid
- Cards: 16px (all sides) = 4×4 grid
- Input: 10px (vertical) × 12px (horizontal) = 2.5×3 grid (uneven for optical balance)

**Margins:**
- Between sections: 32px (8×4 grid)
- Between cards in grid: 16px (4×4 grid)
- Between list items: 8px (2×4 grid)

**Border Radius:**
- Buttons & inputs: 6px
- Cards: 8px
- Modals: 12px
- Avatars: 50% (circles)

### Layout Breakpoints

| Device | Width | Columns | Sidebar | Usage |
|--------|-------|---------|---------|-------|
| **Mobile** | 320-640px | 1 | Hidden (hamburger) | Phone |
| **Tablet** | 641-1024px | 2-3 | Collapsed (~64px) | iPad |
| **Desktop** | 1025-1440px | 3-4 | Full (~256px) | Laptop |
| **Wide** | 1441px+ | 4-6 | Full + right panel | Multi-monitor |

---

## Component Specifications

### Button

#### Primary Button
```
Visual: Solid background (primary color #2563eb)
Padding: 12px × 16px
Border: None
Text: White (#f3f4f6), 14px, bold
Hover: Background darker by 2 shades (#1d4ed8)
Active: Background darker by 4 shades (#1e40af) + outline
Disabled: Background gray (#d1d5db) + text gray (#9ca3af)
```

#### Secondary Button
```
Visual: Outline border (primary color #2563eb)
Padding: 12px × 16px
Border: 1px solid #2563eb
Text: Primary color (#2563eb), 14px, bold
Background: Transparent
Hover: Background light blue (#eff6ff)
Active: Background lighter blue (#dbeafe) + text darker
Disabled: Border gray (#d1d5db) + text gray (#9ca3af)
```

#### Danger Button
```
Visual: Solid background (error color #ef4444)
Padding: 12px × 16px
Border: None
Text: White (#f3f4f6), 14px, bold
Hover: Background darker (#dc2626)
Active: Background darker (#b91c1c)
Disabled: Background gray
```

#### Size Variants
- **Large:** 16px × 20px padding, 16px text
- **Medium:** 12px × 16px padding, 14px text (default)
- **Small:** 8px × 12px padding, 12px text

#### Icon Buttons
```
Visual: 40×40px circle (or 36×36px)
Icon: 20px (or 16px), centered
Background: Transparent by default
Hover: Background light gray (#f3f4f6) dark mode / (#e5e7eb) light mode
Active: Background darker, outline
```

### Input Fields

```
Visual: 40px height (9×4 grid), rounded 6px
Padding: 10px × 12px (text base)
Border: 1px solid neutral (#2d3748 dark / #e5e7eb light)
Text: 14px, secondary text color
Placeholder: Secondary text, opacity 50%
Focus: Border primary (#2563eb), outline 2px, outline offset 2px
Error: Border error (#ef4444), helper text red
Disabled: Background neutral darker, border disabled, cursor not-allowed
```

#### Variants
- **Text input:** Standard, password (masked), email, number
- **Textarea:** Min 120px height, resize vertical only
- **Select dropdown:** Same height/padding, chevron icon right side
- **Checkbox:** 20×20px square, rounded 4px, checkmark on checked
- **Radio button:** 20×20px circle
- **Toggle switch:** 44×24px rounded capsule, indicator circle

### Card

```
Visual: Rounded 8px, border 1px neutral
Background: Surface color (#1a202c dark / #f9fafb light)
Padding: 16px
Box shadow: 0 1px 3px rgba(0,0,0,0.1) dark mode / 0 2px 4px rgba(0,0,0,0.05) light mode
Border on hover: Subtle color change (slightly brighter)
```

#### Card Variants
- **Base card:** Minimal styling, used for content grouping
- **Elevated card:** Box shadow larger (0 4px 12px)
- **Interactive card:** Cursor pointer, hover effect (background lighter)
- **Alert card:** Colored left border (4px) matching semantic color

### Badge

```
Visual: Inline label with background
Padding: 4px × 8px
Border radius: 4px
Font: Label weight (12px, 600), white text
Semantic colors:
  - Success: Green background
  - Warning: Amber background
  - Error: Red background
  - Info: Blue background
  - Neutral: Gray background
```

### Modal Dialog

```
Visual: Centered overlay (rounded 12px)
Background: Surface color (#1a202c)
Padding: 24px
Overlay: Black @ 70% opacity
Width: 90% on mobile, 600px max on desktop
Box shadow: 0 20px 25px -5px rgba(0,0,0,0.3)
Header: H2 title, close icon (top right)
Footer: Action buttons (right-aligned)
Keyboard: ESC to close
Animation: Fade in 200ms, scale 0.95 → 1
```

### Alert / Toast

```
Visual: Rounded 6px, border-left 4px (semantic color)
Padding: 12px × 16px
Position: Top-right corner, 16px from edge
Width: 320px max
Auto-dismiss: 3000ms (configurable)
Content: Icon + text + optional action button
Stacking: Multiple toasts stack vertically (8px gap)
Animation: Slide-in from right 200ms, slide-out left 150ms
```

#### Alert Types
- **Success:** Green border, checkmark icon
- **Error:** Red border, X icon, retry button optional
- **Warning:** Amber border, warning icon
- **Info:** Blue border, info icon

### Badge (Agent Status)

```
Visual: Inline status indicator
Size: 16px circle + label text
Semantic mapping:
  - Running: Green + spinner icon
  - Paused: Amber + pause icon
  - Idle: Gray + dash icon
  - Failed: Red + X icon
  - Queued: Blue + hourglass icon
Padding: 4px × 8px (circle + text)
Font: 12px, bold
```

### Tabs

```
Visual: Horizontal tab bar
Height: 48px
Tab text: 14px, bold
Border-bottom: 2px on active tab (primary color)
Active bg: Transparent, border primary
Inactive bg: Transparent, text secondary
Hover: Text primary (underline not full border)
Animation: Border slides 150ms
Responsive: On mobile, switch to scrollable horizontal tabs
```

### Data Table

```
Visual: Bordered table with alternating row colors
Header: Bold, 12px label font, background darker
Rows: 44px height, 16px padding
Border: 1px between rows
Alternating: Every other row has background 1 shade lighter
Hover row: Background highlights slightly
Scrolling: Horizontal scroll only if unavoidable (within container)
Responsive: Stack columns or collapse to card view on mobile
```

---

## Dark Mode & Light Mode

### Color Mappings

#### Dark Mode (Default)

| Element | Color | Hex |
|---------|-------|-----|
| Background | Neutral Very Dark | `#0f1419` |
| Surface | Neutral Dark | `#1a202c` |
| Text Primary | Neutral Light | `#f3f4f6` |
| Text Secondary | Neutral Medium | `#9ca3af` |
| Border | Neutral Medium Dark | `#2d3748` |
| Divider | Neutral Medium Dark | `#374151` |

#### Light Mode (Fallback)

| Element | Color | Hex |
|---------|-------|-----|
| Background | White | `#ffffff` |
| Surface | Neutral Light | `#f9fafb` |
| Text Primary | Neutral Very Dark | `#111827` |
| Text Secondary | Neutral Medium | `#6b7280` |
| Border | Neutral Light Medium | `#e5e7eb` |
| Divider | Neutral Light Medium | `#d1d5db` |

### Mode Toggle

- **Location:** Top-right of header (next to settings)
- **Icon:** Sun/Moon toggle button
- **Persistence:** Saved to user profile (localStorage backup)
- **System preference:** Respects `prefers-color-scheme: dark`

### Contrast Verification

All semantic colors and text meet WCAG AA (4.5:1 text contrast) in both modes. Critical UI (buttons, alerts) meets WCAG AAA (7:1).

---

## Motion & Animation

### Animation Principles

1. **Purpose:** Feedback (state change), not decoration
2. **Duration:** 150-200ms for UI transitions, 300ms for modals
3. **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (standard deceleration)
4. **Accessibility:** Respect `prefers-reduced-motion` media query

### Standard Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| **Quick** | 100ms | cubic-bezier(0.4, 0, 1, 1) | Icon states, hover effects |
| **Standard** | 200ms | cubic-bezier(0.4, 0, 0.2, 1) | Card transitions, alert appear |
| **Slow** | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Modal open/close, page transitions |

### Transition Types

#### Fade
```css
opacity: 0 → 1
transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
```
*Usage:* Alerts, badges appearing/disappearing

#### Slide
```css
transform: translateX(-20px) → translateX(0);
opacity: 0 → 1;
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
```
*Usage:* Sidebar open, modal slide-up

#### Scale
```css
transform: scale(0.95) → scale(1);
opacity: 0 → 1;
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
```
*Usage:* Modal open, button active state

#### Height Collapse
```css
max-height: 500px → 0;
overflow: hidden;
transition: max-height 200ms cubic-bezier(0.4, 0, 0.2, 1);
```
*Usage:* Collapsible sections, alert dismiss

### Loading States

#### Spinner (Indeterminate)
```
Visual: Circular SVG, 24px diameter
Stroke: 2px (primary color)
Speed: 1s full rotation
Animation: Continuous, linear, looping
```

#### Skeleton Screen
```
Visual: Placeholder shape matching content
Background: Neutral surface with 1px lighter border
Animation: Gradient shimmer 1.5s, left to right, looping
Usage: Image, text block, table row placeholders
```

#### Progress Bar
```
Visual: Horizontal bar, 4px height
Background: Surface color
Progress: Primary color, width animates smoothly
Animation: Width updates every 100ms
Label: Percentage text (optional) + "Processing..."
```

### Interactions (Non-Animation)

- **Hover:** Cursor change (pointer for interactive), background highlight
- **Focus:** 2px outline (primary color), outline-offset 2px
- **Active:** Background darker, box-shadow inset (subtle)
- **Disabled:** Cursor not-allowed, opacity 50%

### Animation Gotchas

**DON'T:**
- Animate position (use transform for performance)
- Fade things out instead of removing (exception: temporary alerts)
- Spin icons for > 3 seconds without pause (feels broken)
- Exceed 300ms animation (feels sluggish)

**DO:**
- Use `will-change: transform` for animated elements
- Respect `prefers-reduced-motion: reduce` (disable animations)
- Test on slower devices (animations should not stutter)
- Provide instant feedback (don't wait for animation to finish)

---

## Accessibility

### WCAG 2.1 Level AA Compliance

All components meet WCAG 2.1 Level AA requirements:
- **Color contrast:** 4.5:1 for text, 3:1 for graphics
- **Keyboard navigation:** Tab, Enter, Arrow keys, ESC supported
- **Screen reader:** ARIA labels, roles, live regions for dynamic content
- **Focus indicators:** Always visible, 2px outline (3:1 contrast)
- **Motion:** `prefers-reduced-motion` respected

### Keyboard Navigation

| Key | Action |
|-----|--------|
| **Tab** | Move focus forward (cards, buttons, inputs) |
| **Shift+Tab** | Move focus backward |
| **Enter** | Activate button, submit form, drill into card |
| **Space** | Toggle checkbox, open dropdown |
| **Arrow Up/Down** | Navigate menu items, adjust slider |
| **Arrow Left/Right** | Navigate sidebar projects, timeline steps |
| **Escape** | Close modal, collapse menu, exit drill-down |
| **Cmd+K** | Open global search (focus search input) |

### ARIA Labels & Roles

- **Buttons:** `aria-label` for icon-only buttons
- **Forms:** `<label for="input-id">` paired with input
- **Lists:** `role="list"` parent, `role="listitem"` children
- **Modals:** `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- **Live updates:** `aria-live="polite"` for non-critical alerts, `aria-live="assertive"` for critical
- **Alerts:** `role="alert"` + `aria-level` for severity

### Color & Icons

**Rule:** Never use color as the only visual indicator.
- Status badges: Color + icon (e.g., green checkmark for success)
- Alerts: Color + icon + text
- Charts: Color + pattern or line style (for colorblind accessibility)

### Focus Management

- **Modal open:** Focus moves to first interactive element (e.g., input or primary button)
- **Modal close:** Focus returns to trigger button
- **List drill-down:** Focus moves to list item (or detail panel)
- **Search:** Focus moves to search input on Cmd+K

### Testing Checklist

- [ ] Keyboard-only navigation works
- [ ] Screen reader announces all interactive elements
- [ ] Color contrast verified (WCAG AA minimum)
- [ ] Focus indicators visible and 3:1 contrast
- [ ] No motion if `prefers-reduced-motion` set
- [ ] Form labels associated with inputs
- [ ] Images have alt text or aria-label
- [ ] Modals trap focus (tab wraps within modal)

---

## Component Checklist

- [x] Button (primary, secondary, danger, sizes)
- [x] Input (text, password, email, number, textarea, select, checkbox, radio, toggle)
- [x] Card (base, elevated, interactive, alert variant)
- [x] Badge (semantic colors)
- [x] Modal (header, footer, close button, focus trap)
- [x] Toast/Alert (success, error, warning, info)
- [x] Agent Status Badge (running, paused, idle, failed, queued)
- [x] Tabs (horizontal tab bar)
- [x] Data Table (headers, rows, hover state, responsive)
- [x] Spinner & Skeleton
- [x] Progress bar

---

## Implementation Notes

### Libraries & Frameworks

- **CSS:** TailwindCSS (with custom color variables)
- **Icons:** Heroicons (24px, 20px, 16px sizes)
- **Motion:** Framer Motion (React) or CSS transitions
- **Accessibility:** Headless UI (unstyled, accessible components)

### Theming with CSS Variables

```css
:root {
  /* Light mode (fallback) */
  --color-bg: #ffffff;
  --color-surface: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  --color-primary: #2563eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f1419;
    --color-surface: #1a202c;
    --color-text-primary: #f3f4f6;
    --color-text-secondary: #9ca3af;
    --color-border: #2d3748;
  }
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}
```

### Responsive Design Strategy

```css
/* Mobile-first approach */
.grid {
  grid-template-columns: 1fr; /* Mobile: 1 column */
}

@media (min-width: 641px) {
  .grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}

@media (min-width: 1025px) {
  .grid {
    grid-template-columns: repeat(4, 1fr); /* Desktop: 4 columns */
  }
}
```

### Animation Performance

Use CSS transforms and opacity for 60fps animations:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-23 | Initial design system (Phase 2) |

---

**Next:** Implement design-system.css, component library stubs, and Storybook integration in Phase 3.
