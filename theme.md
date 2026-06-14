> **AI INSTRUCTION:** Use minimal tokens. One step at a time. No extra explanation unless asked.

# Zeronix Portal — Theme & Branding Plan

## Identity
Premium B2B SaaS feel. Reference: Linear, Vercel, Notion. Tight, intentional, fast. No bubbly/pastel/bootstrap look.

---


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