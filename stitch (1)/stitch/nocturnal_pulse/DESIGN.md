# Design System Document: High-End Editorial for DJ Booking

## 1. Overview & Creative North Star: "The Sonic Curator"

This design system is built to transform a utilitarian booking platform into a high-end editorial experience. Our Creative North Star is **"The Sonic Curator."** It rejects the cluttered, boxy aesthetic of traditional SaaS in favor of a layout that feels like a premium lifestyle magazine. 

We break the "template" look by using intentional asymmetry, generous whitespace (breathing room), and high-contrast typography scales. The interface doesn't just manage bookings; it orchestrates an experience. By layering Deep Charcoal with vibrant Lemon Yellow accents, we create a "nightlife-professional" atmosphere—sophisticated yet energetic.

---

## 2. Colors & The Tonal Philosophy

We move beyond flat UI by using a sophisticated palette that mimics light and shadow in a dark studio.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off content. Boundaries must be defined solely through background color shifts. Use `surface-container-low` for large sections sitting on a `surface` background. This creates a seamless, infinite feel.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base Layer:** `background` (#0e0e0e).
- **Secondary Sections:** `surface-container-low` (#131313).
- **Interactive Elements:** `surface-container-high` (#20201f).
- **Focus Elements:** `surface-container-highest` (#262626).
Each "inner" container should use a tier higher than its parent to define importance through luminosity rather than lines.

### The "Glass & Gradient" Rule
To add "soul," use Glassmorphism for floating elements (like music players or logistics alerts). Use `surface_variant` at 60% opacity with a `24px` backdrop-blur. Apply subtle gradients from `primary` (#f7ffba) to `primary-container` (#e0f800) for hero CTAs to give them a tactile, glowing energy.

---

## 3. Typography: Editorial Clarity

We use a dual-font strategy to balance character with utility.

- **Display & Headlines (Manrope):** This is our "voice." Manrope’s geometric yet warm curves provide the high-end SaaS feel. Use `display-lg` for booking totals and `headline-md` for event titles. 
- **Body & Labels (Inter):** Our "instrument." Inter provides unmatched legibility for logistics, calendar dates, and technical details.

**Language Note:** All copy must be in Portuguese (PT-BR). Use authoritative, welcoming language (e.g., instead of "Booking," use "Agendar Performance").

| Level | Token | Font | Size | Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Manrope | 3.5rem | Bold |
| **Headline** | `headline-md` | Manrope | 1.75rem | Medium |
| **Title** | `title-lg` | Inter | 1.375rem | Semi-Bold |
| **Body** | `body-md` | Inter | 0.875rem | Regular |
| **Label** | `label-sm` | Inter | 0.6875rem | Medium |

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are too "web 2.0." We use **Ambient Depth.**

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. The change in hex code provides enough contrast for the eye to perceive a "lift" without visual noise.
- **Ambient Shadows:** For floating modals (e.g., Uber logistics details), use a shadow color tinted with the primary hue: `rgba(247, 255, 186, 0.04)` with a 40px blur. 
- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., input fields), use `outline-variant` (#484847) at **20% opacity**. Never use 100% opaque borders.

---

## 5. Components: Precision & Minimalist

### Buttons
- **Primary:** Background `primary` (#f7ffba), Text `on_primary` (#5a6500). Use `xl` (0.75rem) roundedness. These should glow against the dark background.
- **Secondary:** Background `secondary_container` (#38485d), Text `on_secondary_container`. Use for "Logistics" or "View Map" actions.
- **Tertiary:** No background. Text `primary`. Use for "Cancelar" or less critical actions.

### Logistics Cards (Uber/Car Focus)
- **Style:** Forbid divider lines. Separate the "Pickup Time" from "Drop-off Location" using a `1.5rem` vertical gap and a subtle background shift to `surface-container-high`.
- **Iconography:** Clean, outlined style. Use Slate Blue (`secondary`) for logistical icons to keep them distinct from action-oriented Lemon Yellow icons.

### Input Fields (Google Calendar Sync)
- **Style:** Use `surface-container-highest` as the background. No border. On focus, the bottom edge gains a 2px `primary` (Lemon Yellow) "glow" line.
- **Helper Text:** In Portuguese, using `label-sm`.

### Specific App Components
- **The Logistics Timeline:** A vertical track using `outline_variant` at 30% opacity, with `primary` dots for confirmed stops and `secondary` dots for Uber arrival estimates.
- **Calendar Chips:** High-contrast `primary` chips for "Available" and `secondary_dim` for "Pending."

---

## 6. Do’s and Don’ts

### Do
- **Do** use asymmetrical layouts. A 60/40 split for "Event Details" and "Logistics Map" feels more premium than a 50/50 grid.
- **Do** prioritize Portuguese legibility. Use "Inter" for all data-heavy logistics to ensure non-technical users can read it at a glance.
- **Do** use `primary` (Lemon Yellow) sparingly. It is a "laser pointer" for the user's eye—use it only for the most important action on the screen.

### Don’t
- **Don't** use black (#000000) for text. Always use `on_surface` (#ffffff) or `on_surface_variant` (#adaaaa) for better eye comfort.
- **Don't** use standard dividers. If you feel the need for a line, increase the whitespace by `16px` instead.
- **Don't** use "default" system icons. Use a custom-outlined set with a consistent `1.5px` stroke weight to match the premium editorial feel.

---

## 7. Accessibility
- **Contrast:** Ensure all text on `primary` (Lemon Yellow) uses `on_primary` (#5a6500) for AAA compliance.
- **Touch Targets:** All interactive elements (booking buttons, calendar dates) must have a minimum hit area of `48x48px` to accommodate DJs managing schedules on-the-go via mobile.