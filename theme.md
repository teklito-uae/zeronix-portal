> **AI INSTRUCTION:** Use minimal tokens. One step at a time. No extra explanation unless asked.

# Zeronix Portal — Theme & Branding Plan

## Identity
Premium B2B SaaS feel. Reference: Linear, Vercel, Notion. Tight, intentional, fast. No bubbly/pastel/bootstrap look.

---

## Brand Colors (Fixed — use everywhere)

| Token | Hex | Usage |
|---|---|---|
| `zeronix-blue` | `#0F52BA` | Primary buttons, active states, links |
| `zeronix-blue-hover` | `#0A3D8F` | Button hover |
| `zeronix-green` | `#23F78C` | Accent, badges, chart highlights, glow effects |
| `zeronix-green-dim` | `#23F78C1F` | Accent backgrounds (12% opacity) |
| `success` | `#10B981` | Paid, accepted, positive |
| `warning` | `#F59E0B` | Pending, expiring |
| `danger` | `#EF4444` | Overdue, rejected, delete |

---

## Admin Portal — Light Mode (Default)

| Token | Hex | Usage |
|---|---|---|
| `admin-bg` | `#F4F6FA` | Page background |
| `admin-surface` | `#FFFFFF` | Cards, panels, modals |
| `admin-surface-hover` | `#F0F4FF` | Table row hover, input bg |
| `admin-sidebar-bg` | `#FFFFFF` | Sidebar background |
| `admin-sidebar-active` | `#0F52BA` | Active nav item bg |
| `admin-border` | `#E2E8F0` | All borders, dividers |
| `admin-text-primary` | `#0F1629` | Headings, primary text |
| `admin-text-secondary` | `#4A5568` | Labels, meta, subtitles |
| `admin-text-muted` | `#94A3B8` | Placeholder, disabled |

---

## Admin Portal — Dark Mode

| Token | Hex | Usage |
|---|---|---|
| `admin-bg` | `#0E1A23` | Page background |
| `admin-surface` | `#152030` | Cards, panels, modals |
| `admin-surface-hover` | `#1C2B3A` | Table row hover, input bg |
| `admin-sidebar-bg` | `#0A1520` | Sidebar |
| `admin-sidebar-active` | `#0F52BA` | Active nav item bg |
| `admin-border` | `#1E3040` | All borders, dividers |
| `admin-text-primary` | `#F0F4FF` | Headings, primary text |
| `admin-text-secondary` | `#7A9BB5` | Labels, meta, subtitles |
| `admin-text-muted` | `#3D5468` | Placeholder, disabled |

---

## Customer Portal Colors (Always Light)

| Token | Hex | Usage |
|---|---|---|
| `cust-bg` | `#FFFFFF` | Main background |
| `cust-bg-subtle` | `#F8FAFF` | Alternating sections |
| `cust-bg-dark` | `#0E1A23` | Hero, footer, CTA banners |
| `cust-border` | `#E2E8F0` | Card borders, dividers |
| `cust-text-primary` | `#0F1629` | Headings, body on white |
| `cust-text-secondary` | `#4A5568` | Descriptions, subtext |
| `cust-text-on-dark` | `#F0F4FF` | Text on dark navy sections |

---

## Theme Toggle (Admin Only)

- Default: **Light**
- Toggle: Light ↔ Dark
- Persisted in `localStorage` key `zeronix-theme`
- Implemented via Tailwind `darkMode: 'class'` — add/remove `dark` class on `<html>`
- Zustand store manages current theme state and syncs to localStorage on change
- Toggle button lives in Topbar (sun/moon icon, 38px ghost button)
- No theme toggle on customer portal — always light

---

## Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| Display (hero) | Inter | 56px / lh 64px | 700 |
| H1 (page titles) | Inter | 36px / lh 44px | 700 |
| H2 (card/section titles) | Inter | 24px / lh 32px | 600 |
| H3 (stat values, features) | Inter | 20px / lh 28px | 600 |
| H4 (table headers, labels) | Inter | 14px / lh 20px | 600 UPPERCASE |
| Body large | Inter | 16px / lh 26px | 400 |
| Body regular | Inter | 14px / lh 22px | 400 |
| Body small | Inter | 12px / lh 18px | 400 |
| Caption | Inter | 11px / lh 16px | 500 |
| Code / Part numbers | JetBrains Mono | 13px / lh 20px | 400 |

- Load Inter (400 500 600 700) and JetBrains Mono (400 500) from Google Fonts
- Part numbers and model numbers always rendered in JetBrains Mono
- Code color: `#23F78C` on dark bg, `#0F52BA` on light bg

---

## Component Rules

### Buttons
| Variant | Style |
|---|---|
| Primary | bg `#0F52BA`, hover `#0A3D8F`, radius 8px, h 38px, 14px 500 |
| Secondary | transparent bg, border `admin-border`, hover fills `admin-surface-hover` |
| Destructive | bg `#EF4444` |
| Ghost | no border/bg, hover fills surface |
| Compact | h 30px (table rows) |
| Large | h 44px (customer CTA) |

All buttons: transition 150ms ease-out, scale 1.01 on hover, focus ring `#0F52BA` at 20% opacity

### Cards
- **Light:** bg white, border `#E2E8F0`, radius 12px, shadow `0 1px 3px rgba(0,0,0,0.06)`
- **Dark:** bg `#152030`, border `#1E3040`, radius 12px, no shadow

### Stat Cards
- Top border accent: `#0F52BA` at 60% opacity (both modes)
- Icon chip: icon color at 12% opacity background
- Value: H3, primary text
- Label: Body small, secondary text

### Tables
- Header: uppercase 14px, secondary text color, surface bg
- Row hover: `admin-surface-hover`, 100ms
- Selected row: left border 2px `#0F52BA`, surface bg
- Cell padding: 12px vertical, 16px horizontal
- Bottom border only per row, color `admin-border`

### Inputs
- h 38px, radius 8px, 14px, border `admin-border`
- Focus: border `#0F52BA`, ring `rgba(15,82,186,0.2)`
- Error: border `#EF4444`, ring `rgba(239,68,68,0.2)`

### Badges / Status Pills
- radius 6px, 3px/8px padding, 11px 600 UPPERCASE
- New: `#23F78C` text on `#23F78C1F` bg
- In Progress: `#0F52BA` text on `#0F52BA1F` bg
- Quoted: `#8B5CF6` text on `#8B5CF61F` bg
- Closed: muted on muted
- Paid: `#10B981` text on `#10B9811F` bg
- Overdue: `#EF4444` text on `#EF44441F` bg
- Urgent: amber with 2s pulse animation (opacity 100→70)

### Sidebar (Admin)
- Width: 240px desktop, 64px icon-only (tablet), bottom tab bar (mobile)
- Active item: bg `#0F52BA`, radius 8px, mx 8px
- Inactive hover: `admin-surface-hover`, radius 8px
- Item h: 38px, icon 18px, label 14px 500
- Group labels: 11px 500 UPPERCASE muted

### Modals / Dialogs / Sheets
- bg `admin-surface`
- Backdrop: `admin-bg` 80% opacity + blur 4px

### Dropdowns / Combobox
- bg `admin-surface`, border `admin-border`, radius 10px
- Shadow: `0 8px 24px rgba(0,0,0,0.12)` light / `0 8px 24px rgba(0,0,0,0.4)` dark
- Item hover: `admin-surface-hover`

---

## Charts (Recharts)

- Container bg matches card
- Grid lines: `admin-border` at 60%, dashed `4 2`
- Bar default: `#0F52BA`, hover: `#23F78C`
- Line: gradient `#0F52BA` → `#23F78C`, stroke 2.5px, area fill 12%
- Tooltip: surface bg, border `admin-border`, radius 8px

---

## Animations

| Interaction | Duration | Easing |
|---|---|---|
| Hover / button | 150ms | ease-out |
| Page fade | 200ms | ease-out |
| Modal / Sheet | 250ms | ease-out |
| Sidebar collapse | 200ms | ease-out |
| Skeleton shimmer | 1.5s loop | linear |
| Chat widget pulse ring | 3s loop | ease-out |

- No spring/bounce animations
- All animations respect `prefers-reduced-motion` (set duration 0ms)

---

## Customer Portal Specifics

- Hero: bg `#0E1A23`, radial glow `#0F52BA` at 15% behind headline
- Hero search bar: h 52px, white bg, radius 12px, embedded CTA button right side
- Product card hover: shadow increase + 2px top border reveal in `#0F52BA` (clip-path left→right)
- Nav: sticky, backdrop-blur 12px, white 90% on scroll
- Chat widget button: 52px circle, `#0F52BA` bg, `#23F78C` pulse ring every 3s
- Chat panel: 360×480px, bottom-right 20px margin, white bg, radius 16px

---

## Spacing System (4px base)

`4 8 12 16 20 24 32 40 48 64 80`

- Page padding: 32px desktop / 24px tablet / 16px mobile
- Card padding: 20px
- Card gap: 20px
- Table cell: 12px v / 16px h
- Form field gap: 16px
- Form section gap: 24px
- Modal padding: 24px
- Max content width (customer): 1200px centered

---

## Responsive Breakpoints

| Name | Range | Admin | Customer |
|---|---|---|---|
| Mobile | 0–767px | Bottom tab bar (5 icons) | Single column |
| Tablet | 768–1023px | 64px icon sidebar | — |
| Desktop sm | 1024–1279px | Full 240px sidebar | Full layout |
| Desktop lg | 1280px+ | Expanded content | Expanded |

---

## Tailwind Config Extensions

```js
theme: {
  extend: {
    colors: {
      'zeronix-blue': '#0F52BA',
      'zeronix-blue-hover': '#0A3D8F',
      'zeronix-green': '#23F78C',
      'zeronix-green-dim': 'rgba(35,247,140,0.12)',
      'admin-bg': 'var(--admin-bg)',
      'admin-surface': 'var(--admin-surface)',
      'admin-surface-hover': 'var(--admin-surface-hover)',
      'admin-border': 'var(--admin-border)',
      'admin-text-primary': 'var(--admin-text-primary)',
      'admin-text-secondary': 'var(--admin-text-secondary)',
      'admin-text-muted': 'var(--admin-text-muted)',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    borderRadius: {
      brand: '8px',
    },
    boxShadow: {
      'card-light': '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
      'glow-blue': '0 0 0 3px rgba(15,82,186,0.2)',
      'glow-green': '0 0 0 3px rgba(35,247,140,0.2)',
    },
  }
}
```

CSS variables swap on `.dark` class for all `admin-*` tokens.

---

## Icons
- Library: **Lucide React** only
- 16px inline/badge, 18px sidebar, 20px card actions, 24px empty states
- Color follows parent text unless in icon chip

---

## Shadcn Theme Override
- Set `darkMode: 'class'` in Tailwind config
- Override Shadcn CSS variables in `globals.css` for both `:root` (light) and `.dark` scopes to match above tokens
- Do not use Shadcn default slate/zinc palette — replace fully with Zeronix tokens

---

## Table Design System (Standard Pattern)

All admin data tables must follow this exact structure:

### Page Layout
```
<div className="space-y-4">
  {/* Page header (title + primary CTA button) */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-zeronix-blue" />
      <div>
        <h2 className="text-base font-semibold text-admin-text-primary">Title</h2>
        <p className="text-xs text-admin-text-muted">Subtitle</p>
      </div>
    </div>
    <Button className="bg-zeronix-blue text-white h-9 rounded-md text-sm">
      <Plus size={14} className="mr-1" /> Create
    </Button>
  </div>

  {/* Search + Filters bar */}
  <div className="bg-admin-surface border border-admin-border rounded-md p-3 flex flex-wrap items-center gap-2">
    <div className="relative max-w-sm flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" size={13} />
      <Input placeholder="Search…" className="pl-8 h-9 bg-admin-bg border-admin-border text-sm rounded-md" />
    </div>
    {/* Optional filter selects — same h-9 height */}
    <Select><SelectTrigger className="h-9 w-36 text-sm rounded-md border-admin-border bg-admin-bg" /></Select>
  </div>

  {/* Table container */}
  <div className="bg-admin-surface border border-admin-border rounded-md overflow-hidden">
    <DataTable columns={columns} data={data} onRowClick={(row) => navigate(`/${row.id}`)} />
    {/* Pagination */}
    <div className="flex items-center justify-between px-4 py-3 border-t border-admin-border">
      <p className="text-xs text-admin-text-muted">{total} items</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 text-xs rounded-md">Previous</Button>
        <span className="text-xs text-admin-text-muted">Page {page}/{lastPage}</span>
        <Button variant="outline" size="sm" className="h-8 text-xs rounded-md">Next</Button>
      </div>
    </div>
  </div>
</div>
```

### Column Cell Sizing Rules
| Content type | Font | Weight |
|---|---|---|
| ID / mono codes | `text-sm font-mono text-zeronix-blue` | regular |
| Primary text (name) | `text-sm text-admin-text-primary` | normal |
| Secondary text (company, email) | `text-[11px] text-admin-text-muted` | normal |
| Currency amounts | `text-sm font-mono font-medium text-admin-text-primary` | medium |
| Status badges | Use `<StatusBadge />` component | — |
| Date/time | `text-xs text-admin-text-muted flex items-center gap-1` + icon | normal |
| Action buttons | `variant="ghost" size="sm" className="h-7 px-2 text-xs"` | — |

### Search Input
- Height: `h-9`
- Border radius: `rounded-md`
- Background: `bg-admin-bg`
- Border: `border-admin-border`
- Icon: `size={13}` Search icon, left-padded with `pl-8`
- Debounce API calls: `300ms` minimum
- Always `per_page: 15` for paginated results

### Filter Selects
- Height: `h-9`
- Width: `w-32` to `w-40` depending on content
- Border: `border-admin-border bg-admin-bg`
- Default option always labelled "All [Entity]" with value `"all"`

### Empty States
```tsx
<div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-admin-border rounded-md bg-admin-surface">
  <Icon size={32} className="text-admin-text-muted/50 mb-3" />
  <h3 className="text-sm font-medium text-admin-text-primary mb-1">No [Entity] Found</h3>
  <p className="text-xs text-admin-text-secondary">Description of what to do.</p>
</div>
```

---

## Chart Guidelines (Recharts)

- **Remove focus outline**: Add `[&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none` to the container div AND `style={{ outline: 'none' }}` on the chart component
- **Grid**: `<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />`
- **Axes**: `axisLine={false} tickLine={false}` always
- **Axis ticks**: `tick={{ fill: '#94A3B8', fontSize: 11 }}`
- **Tooltip**: `contentStyle={{ backgroundColor: '#fff', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }}`
- **Primary color**: `#10B981` (emerald/zeronix-green)
- **Area fill**: linear gradient from 15% to 0% opacity
- **Dots**: `dot={false}` with `activeDot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}`
- **YAxis width**: `width={40}` to prevent label clipping

---

## React Query — Cache Invalidation Rules

- After **create/update** in `DocumentEditor` → `queryClient.invalidateQueries({ queryKey: ['quotes'] })` or `['invoices']` BEFORE `navigate()`
- For **inline mutations** (assign, status change) in tables → use **optimistic update** with `onMutate` + `setQueryData`, rollback in `onError`, then `invalidateQueries` in `onSuccess`
- Query keys always match: `['enquiries', page, search, filterStatus, filterPriority, filterSource]` for pages with filters