---
name: glassmorphism-ui
description: Apply the project's premium dark glassmorphism design system to any page or component. Use when creating new pages, building UI components, or styling existing pages to match the glass aesthetic.
disable-model-invocation: true
argument-hint: [page-or-component-path]
---

# Glassmorphism UI Design System

Apply the project's premium dark glassmorphism design language to pages and components. This skill covers the full design system: colors, tokens, typography, layout patterns, reusable components, animations, and modals.

## Steps

1. Read the target file specified in $ARGUMENTS fully (if it exists)
2. Read the reference files to match exact patterns:
   - `src/pages/admin/users/UsersManagement.jsx` — canonical full-page example
   - `src/pages/admin/clients/ClientsManagement.jsx` — canonical full-page example with MetricChip
3. Apply the design system below, using existing reusable components where possible
4. Preserve ALL existing business logic, mutations, API calls, form validation

## Reusable Components (import these, don't rewrite)

| Component | Path | Props |
|-----------|------|-------|
| `StatCard` | `src/pages/admin/components/StatCard.jsx` | `icon`, `label`, `value`, `color`, `animationY` |
| `ActionButton` | `src/pages/admin/components/ActionButton.jsx` | `icon`, `color`, `onClick`, `title`, `disabled`, `loading` |
| `GradientAvatar` | `src/components/admin/GradientAvatar.jsx` | `name`, `src`, `doubleInitial`, `size`, `borderRadius`, `fontSize`, `style` |
| `getGradientPair` | `src/components/admin/GradientAvatar.jsx` | Named export. `getGradientPair(name)` returns `[color1, color2]` |

## Design System

### Accent Color Palette

Pick one primary accent per page to theme the header and buttons:

| Color  | Hex       | Use case                    |
|--------|-----------|-----------------------------|
| Blue   | `#60a5fa` | Users, generic, profiles    |
| Green  | `#34d399` | Clients, active states      |
| Indigo | `#818cf8` | Industries, frameworks      |
| Pink   | `#f472b6` | Skill data                  |
| Amber  | `#fbbf24` | Admins, warnings            |
| Purple | `#a78bfa` | Roles, categories           |
| Orange | `#fb923c` | Secondary accents           |
| Teal   | `#2dd4bf` | Secondary accents           |

### Background & Border Tokens

```
Page bg:        inherit (dark theme from layout)
Ambient orbs:   radial-gradient(circle, rgba(R,G,B,0.05-0.06), transparent 70%)
Card/row bg:    rgba(255,255,255,0.02)  ->  hover: rgba(255,255,255,0.04)
Border:         rgba(255,255,255,0.06)  ->  hover: ${accentColor}20
Stat card bg:   linear-gradient(135deg, ${color}12 0%, ${color}05 100%)
Stat card border: 1px solid ${color}20
```

### Text Hierarchy

```
Primary:    #f1f5f9   (names, headings, values)
Secondary:  #e2e8f0   (descriptions, body text)
Muted:      #9ca3af   (labels, metadata)
Label:      #6b7280   (stat labels, secondary metadata)
Faint:      #4b5563   (dividers, disabled text)
```

### Typography

```
Page title:     fontSize 24, fontWeight 700, gradient text
Subtitle:       fontSize 13, color #9ca3af
Row name:       fontSize 15, fontWeight 600, color #f1f5f9
Row metadata:   fontSize 12, color #6b7280
Pill text:      fontSize 12, fontWeight 600
Stat value:     fontSize 20+, fontWeight 700, color white
Stat label:     fontSize 10-12, uppercase, tracking-wide, color #6b7280
```

### Gradient Text Pattern

```jsx
style={{
  background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, ${accent} 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}}
```

## Required Imports

```jsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { /* lucide icons as needed */ } from 'lucide-react';
import { Row, Col, Button, Modal, ModalHeader, ModalBody, ModalFooter,
         Form, FormGroup, Label, Input, Spinner, Alert } from 'reactstrap';
import StatCard from '../components/StatCard';          // adjust path
import ActionButton from '../components/ActionButton';  // adjust path
import GradientAvatar from '../../components/admin/GradientAvatar'; // adjust path
```

- Use `lucide-react` for all icons
- Do NOT import Card, CardBody, Badge, or Table — the glassmorphism design replaces them

## Animation Variants

Paste at top level of every glassmorphism page:

```jsx
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
```

## Page Layout Structure

```
<div className="tw:relative tw:overflow-hidden">
  <!-- Ambient background (2 radial-gradient orbs, pointerEvents:none) -->
  <div className="tw:relative tw:z-10">
    <!-- A. Header -->
    <!-- B. Stats Row -->
    <!-- C. Search Bar -->
    <!-- D. Empty State OR Row List -->
  </div>
  <!-- E. Modal -->
</div>
```

### A. Ambient Background Orbs

Two absolutely-positioned orbs providing ambient glow. Place inside the outermost `div`:

```jsx
<div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400,
  borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.06), transparent 70%)',
  pointerEvents: 'none' }} />
<div style={{ position: 'absolute', bottom: -120, right: -80, width: 350, height: 350,
  borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.05), transparent 70%)',
  pointerEvents: 'none' }} />
```

Vary the RGB values to match the page's accent color.

### B. Header

```jsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
>
  <div className="tw:flex tw:items-center tw:justify-between tw:flex-wrap tw:gap-4 tw:mb-6">
    <div className="tw:flex tw:items-center tw:gap-3">
      {/* 48x48 icon badge: gradient bg, borderRadius 14, accent border */}
      <div>
        <h2 style={{ /* gradient text */ }}>Page Title</h2>
        <p style={{ fontSize: 13, color: '#9ca3af' }}>Subtitle description</p>
      </div>
    </div>
    {/* Gradient CTA button with boxShadow glow */}
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Button style={{
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        border: 'none', borderRadius: 12, padding: '10px 20px',
        fontWeight: 600, boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
      }}>+ Create New</Button>
    </motion.div>
  </div>
</motion.div>
```

### C. Stats Row

```jsx
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <Row className="tw:g-3 tw:mb-6">
    <Col xs="6" lg="3"><StatCard icon={Icon1} label="Label" value={val} color="#60a5fa" /></Col>
    <Col xs="6" lg="3"><StatCard icon={Icon2} label="Label" value={val} color="#34d399" /></Col>
    <Col xs="6" lg="3"><StatCard icon={Icon3} label="Label" value={val} color="#818cf8" /></Col>
    <Col xs="6" lg="3"><StatCard icon={Icon4} label="Label" value={val} color="#f472b6" /></Col>
  </Row>
</motion.div>
```

Derive stat values via `useMemo` from the query data.

### D. Glassmorphic Search Bar

```jsx
<motion.div variants={itemVariants} className="tw:mb-4">
  <div style={{
    position: 'relative', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
  }}>
    <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
      width: 18, height: 18, color: '#6b7280' }} />
    <input
      type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
      placeholder="Search..."
      style={{
        width: '100%', background: 'transparent', border: 'none', outline: 'none',
        padding: '14px 16px 14px 44px', color: '#e2e8f0', fontSize: 14,
      }}
    />
    {searchQuery && (
      <button onClick={() => setSearchQuery('')}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
        <XCircle style={{ width: 18, height: 18 }} />
      </button>
    )}
  </div>
</motion.div>
```

Wire up `useMemo` filtered list from `searchQuery`.

### E. Row List (Tabular Cards)

Each entity renders as a **horizontal row card** — NOT a grid card, NOT a `<Table>`:

```jsx
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <div className="tw:flex tw:flex-col tw:gap-3">
    {filteredItems.map(item => (
      <motion.div key={item.id} variants={itemVariants}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '16px 20px',
          transition: 'all 0.3s ease', cursor: 'default',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.borderColor = '${accent}20';
          e.currentTarget.style.transform = 'translateX(4px)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}>
          <div className="tw:flex tw:items-center tw:gap-4 tw:flex-wrap">
            {/* 1. GradientAvatar */}
            {/* 2. Info block (flex-1 min-w-0): name + status on row 1, metadata on row 2 */}
            {/* 3. Pills/tags section */}
            {/* 4. ActionButton group */}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
  {/* Footer: "Showing X of Y items" */}
  <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: '#6b7280' }}>
    Showing {filteredItems.length} of {allItems.length} items
  </div>
</motion.div>
```

#### Row Inner Layout

1. **Avatar** — `<GradientAvatar name={item.name} doubleInitial fontSize={16} />`
2. **Info block** (`tw:flex-1 tw:min-w-0`):
   - Line 1: Name (15px, 600, `#f1f5f9`) + status dot (8x8, glow shadow) + status text (11px)
   - Line 2: Metadata with lucide icons (12px, `#6b7280`)
3. **Pills** — Rounded gradient pills:
   ```jsx
   style={{
     padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
     background: `linear-gradient(135deg, ${color}15, ${color}05)`,
     border: `1px solid ${color}25`, color,
   }}
   ```
4. **Actions** — Use `<ActionButton icon={Edit} color="#60a5fa" onClick={...} title="Edit" />`

#### Status Dot

```jsx
<div style={{
  width: 8, height: 8, borderRadius: '50%',
  backgroundColor: item.is_active ? '#34d399' : '#ef4444',
  boxShadow: item.is_active ? '0 0 8px rgba(52,211,153,0.5)' : '0 0 8px rgba(239,68,68,0.5)',
}} />
```

#### MetricChip (inline component for counts)

```jsx
function MetricChip({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 8,
      background: `linear-gradient(135deg, ${color}10, ${color}05)`,
      border: `1px solid ${color}20`,
    }}>
      <Icon style={{ width: 13, height: 13, color }} />
      <span style={{ fontSize: 12, color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{value}</span>
    </div>
  );
}
```

### F. Empty State

```jsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
  className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16">
  <motion.div animate={{ y: [0, -8, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
    <div style={{
      width: 72, height: 72, borderRadius: 20,
      background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
      border: `1px solid ${accent}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IconComponent style={{ width: 32, height: 32, color: accent }} />
    </div>
  </motion.div>
  <p style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginTop: 20 }}>
    {searchQuery ? 'No results found' : 'No items yet'}
  </p>
  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
    {searchQuery ? 'Try a different search term' : 'Create your first item to get started'}
  </p>
  {!searchQuery && (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ marginTop: 20 }}>
      <Button style={{
        background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
        border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600,
      }}>+ Create First Item</Button>
    </motion.div>
  )}
</motion.div>
```

### G. Modal

```jsx
<Modal isOpen={isOpen} toggle={onClose} centered
  contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
  style={{ maxWidth: 480 }}>
  {/* Rainbow gradient bar */}
  <div style={{
    height: 3, borderRadius: '8px 8px 0 0',
    background: 'linear-gradient(90deg, #10b981, #34d399, #818cf8)',
  }} />
  <ModalHeader toggle={onClose} className="tw:border-gray-700">
    <div className="tw:flex tw:items-center tw:gap-2.5">
      {/* 40x40 icon badge */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Modal Title</div>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>Subtitle</div>
      </div>
    </div>
  </ModalHeader>
  <ModalBody>
    {/* Form fields with rounded inputs */}
    <FormGroup>
      <Label style={{ fontSize: 13, fontWeight: 500, color: '#d1d5db' }}>Field</Label>
      <Input style={{ borderRadius: 10, padding: '10px 14px' }} />
    </FormGroup>
  </ModalBody>
  <ModalFooter className="tw:border-gray-700">
    <Button onClick={onClose}
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, fontWeight: 500 }}>Cancel</Button>
    <Button style={{
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      border: 'none', borderRadius: 10, fontWeight: 600,
      boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
    }}>Save</Button>
  </ModalFooter>
</Modal>
```

#### Toggle/Checkbox Pattern

```jsx
<div onClick={() => setActive(!active)} style={{
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
  background: active ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
  border: `1px solid ${active ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}`,
  transition: 'all 0.3s ease',
}}>
  <div style={{
    width: 8, height: 8, borderRadius: '50%',
    backgroundColor: active ? '#34d399' : '#ef4444',
    boxShadow: `0 0 8px ${active ? 'rgba(52,211,153,0.5)' : 'rgba(239,68,68,0.5)'}`,
  }} />
  <span style={{ fontSize: 13, fontWeight: 500, color: active ? '#34d399' : '#ef4444' }}>
    {active ? 'Active' : 'Inactive'}
  </span>
</div>
```

## Standalone Component Patterns

For building individual glassmorphism components (not full pages):

### Glass Card

```jsx
<div style={{
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16, padding: 20,
}}>
  {/* content */}
</div>
```

### Glass Button (Primary)

```jsx
<motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
  <Button style={{
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    border: 'none', borderRadius: 12, padding: '10px 20px',
    fontWeight: 600, boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
  }}>Label</Button>
</motion.div>
```

### Glass Button (Secondary/Ghost)

```jsx
<Button style={{
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, fontWeight: 500, color: '#e2e8f0',
}}>Label</Button>
```

### Glass Input

```jsx
<Input style={{
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, padding: '10px 14px',
  color: '#e2e8f0',
}} />
```

## Checklist

- [ ] Read existing page/component code fully before starting
- [ ] Preserve ALL existing business logic, mutations, API calls, form validation
- [ ] Import and use existing reusable components (StatCard, ActionButton, GradientAvatar)
- [ ] Replace Card/CardBody/Badge/Table with glassmorphism patterns
- [ ] Add `useMemo` for search filtering and stats computation
- [ ] Add ambient background orbs
- [ ] Add header with gradient text + icon badge
- [ ] Add stat cards with meaningful aggregates (for full pages)
- [ ] Add glassmorphic search bar (for full pages)
- [ ] Convert entity lists to tabular rows with avatar, info, pills, actions
- [ ] Add empty state with floating animation
- [ ] Style modals with gradient bar, icon header, rounded inputs
- [ ] Clean up unused imports (no Card, CardBody, Badge, Table)
- [ ] Ensure consistent text hierarchy and color tokens
