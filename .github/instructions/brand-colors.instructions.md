---
applyTo: "**/*.{jsx,tsx,js,ts,css,scss}"
---

# Skill Lens Brand Colors

Use these colors as the primary palette across the project. Always prefer brand colors over arbitrary values.

## Primary Brand Green

Extracted from the logo SVG (`src/assets/images/logos/skill_lens_logo_text.svg`).

| Token       | Hex       | RGB            | Use case                                    |
|-------------|-----------|----------------|---------------------------------------------|
| **Primary** | `#B3D335` | `179, 211, 53` | Primary accent, links, active states, badges |
| **Dark**    | `#9ACA3C` | `154, 202, 60` | Gradient start, hover states, darker variant |
| **Light**   | `#C4DE5A` | `196, 222, 90` | Highlight, light accent                      |

## Primary Gradient

```
background: linear-gradient(135deg, #9ACA3C, #B3D335)
```

Use for: primary buttons, CTA elements, progress bars, and branded highlights.

## RGBA Variants

For glows, borders, backgrounds, and overlays at varying opacities:

```
Ambient orb:    rgba(179, 211, 53, 0.07)
Focus border:   rgba(179, 211, 53, 0.4)
Focus glow:     0 0 20px rgba(179, 211, 53, 0.08)
Button shadow:  0 4px 24px rgba(154, 202, 60, 0.3)
Disabled bg:    rgba(179, 211, 53, 0.3)
Checkbox:       accentColor: '#B3D335'
```

## Gradient Text (Brand)

```jsx
style={{
  background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #B3D335 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}}
```

## Secondary Palette

These supplement the brand green for multi-color stat cards, pills, and accents:

| Color  | Hex       | Use case                   |
|--------|-----------|----------------------------|
| Blue   | `#60a5fa` | Users, generic, profiles   |
| Indigo | `#818cf8` | Industries, frameworks     |
| Pink   | `#f472b6` | Skill data                 |
| Amber  | `#fbbf24` | Admins, warnings           |
| Purple | `#a78bfa` | Roles, categories          |
| Orange | `#fb923c` | Secondary accents          |
| Teal   | `#2dd4bf` | Secondary accents          |

## Rules

1. **Always use `#B3D335` as the primary accent** — not `#34d399`, `#10b981`, or other greens.
2. **Always use `linear-gradient(135deg, #9ACA3C, #B3D335)`** for primary gradient buttons.
3. Use secondary palette colors only for differentiation (stat cards, pills, charts) — never as the primary accent.
4. The logo SVG already contains these brand greens — do not apply CSS color filters to the logo.
