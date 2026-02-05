# Mobile UI Beautification Plan (React Native + StyleSheet)

This plan is based on the current mobile app structure and components.

## Current state (quick audit)

- The UI currently uses `className`-based styling (NativeWind/Tailwind style) across core components such as `Screen`, `Card`, `Button`, `StoryCard`, and `FeedScreen`.
- There is a dark/light theme toggle in `ThemeProvider`, but there is no centralized design-token object for spacing, typography, border radius, shadows, and semantic colors used by `StyleSheet`.
- The app already has a solid component structure (cards, inputs, segmented control, screens), so we can improve polish quickly by introducing a visual system and consistent spacing.

## What to do next (priority order)

## 1) Create a StyleSheet-based design system (highest impact)

Build a single source of truth for styles:

- `src/theme/tokens.ts`
  - Color palette (light + dark)
  - Spacing scale (`4, 8, 12, 16, 20, 24`)
  - Radius scale (`8, 12, 16, 20`)
  - Typography scale (caption/body/title/hero)
  - Elevation/shadow presets
- `src/theme/appTheme.ts`
  - `getTheme(isDark)` returns semantic tokens (background, card, text primary/secondary, border, accent, success/warning).

Why first: this makes every later screen update faster and consistent.

## 2) Migrate primitive components to React Native `StyleSheet`

Start with shared primitives:

- `Button`
- `Card`
- `Input`
- `Screen`
- `Badge` / `Chip`

For each primitive:

- Replace `className` with `StyleSheet.create` styles.
- Support `variant` props via style arrays (`[styles.base, styles.primary, disabled && styles.disabled]`).
- Add interaction polish:
  - `Pressable` state styles (`pressed` opacity/scale)
  - Proper minimum touch target (`minHeight: 44`)
  - Consistent border radius and horizontal padding.

## 3) Improve visual hierarchy on the Feed screen

`FeedScreen` is the highest-traffic view. Improve:

- Top hero card:
  - Larger heading with stronger line-height
  - Softer subtitle color and max width
  - Replace crowded quick filters with horizontally scrollable pills
- Stats row:
  - Uniform metric cards (same width/height)
  - Add icons for stories/sources/updated
- Filters panel:
  - Add subtle section divider and clearer labels
  - Better input spacing and keyboard-safe behavior
- Story list:
  - Increase vertical rhythm between cards
  - Add clearer source chips and better timestamp formatting.

## 4) Define spacing and typography rules for all screens

Adopt non-negotiable layout rules:

- Screen horizontal padding: `16`
- Section gap: `20` or `24`
- Card internal padding: `16`
- Button height: `44` to `48`
- Heading sizes:
  - H1: `28/34`
  - H2: `22/28`
  - H3: `18/24`
  - Body: `15/22`
  - Caption: `12/16`

This alone makes UI look dramatically cleaner.

## 5) Add premium details that make the app feel modern

- Use subtle shadows/elevation only on key cards (not everywhere).
- Add gentle entrance animations (fade/translate) for story cards.
- Add skeleton loaders that match card geometry (already has `Skeleton` component; align sizing).
- Improve empty/error states with icon + action + short helper text.
- Add consistent corner radii and icon sizes app-wide.

## 6) Accessibility and readability pass

- Color contrast checks for dark mode text and secondary text.
- Dynamic type support (`maxFontSizeMultiplier`, avoid clipped text).
- Touch target ≥ 44x44.
- Ensure input labels/placeholders are readable and not low-contrast.

## 7) Suggested execution plan (1 week)

- Day 1: tokens + semantic theme + base typography utilities.
- Day 2: migrate `Button`, `Card`, `Input`, `Badge`, `Chip` to `StyleSheet`.
- Day 3: redesign `FeedScreen` and `StoryCard`.
- Day 4: apply spacing/typography cleanup to Auth + Settings + Preferences screens.
- Day 5: accessibility pass + polish + QA screenshots.

## Definition of done

- All shared UI primitives use `StyleSheet` (no visual regression).
- Feed screen has improved hierarchy, spacing, and consistency.
- Light/dark themes are token-driven.
- Accessibility basics pass (contrast, touch targets, text scaling).
- Component-level style rules are documented for future features.

## Optional starter template (for implementation)

```ts
// src/theme/tokens.ts
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20 };
export const typography = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
};
```

```ts
// component pattern
const styles = StyleSheet.create({
  base: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#2F6BFF' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
```
