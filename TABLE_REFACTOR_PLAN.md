# Comprehensive Refactor Plan: Standardized Admin Architecture

## Objective
To transform the Zeronix Admin portal into a high-performance, modular, and extremely maintainable application by eliminating code duplication and centralizing all CRUD logic into the State Layer.

---

## 1. State Layer: Centralized API Hooks (`src/hooks/api/`)
**Problem**: Each page manually writes `useQuery` and `useMutation` with axios calls, leading to repeated error handling and inconsistent caching.
**Solution**: Create a centralized hook factory.

```tsx
/**
 * Global hook for fetching any paginated resource (Invoices, Products, etc.)
 * Benefits: Caching, de-duplication, and standardized pagination state.
 */
export const useResourceList = <T>(resource: string, params: any) => {
  return useQuery<PaginatedResponse<T>>({
    queryKey: [resource, params],
    queryFn: async () => (await api.get(`/admin/${resource}`, { params })).data,
  });
};

/**
 * Standardized CRUD mutation hook.
 * Handles 'create', 'update', 'delete', and 'bulk-update'.
 * Automatically invalidates relevant cache keys on success.
 */
export const useResourceMutation = (resource: string, type: 'create'|'update'|'delete'|'bulk') => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
       // Logic for POST/PUT/DELETE based on 'type'
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      toast.success(`${resource} ${type} successful`);
    }
  });
};
```

---

## 2. UI Layer: High-Order Components (`src/components/layout/`)

### `PageHeader` (Reusable Header)
**Problem**: Title, icon, and "Add" buttons are manually styled in every file.
**Solution**: A single component that handles breadcrumbs and main actions.

### `ResourceListingPage` (The "Global Table")
**Problem**: Search bars, filter selects, and pagination bars are repeated 10+ times.
**Solution**: A wrapper that accepts `columns` and `resource` and renders the full UI.

```tsx
<ResourceListingPage
  resource="products"
  title="Inventory"
  icon={<Package />}
  columns={productColumns}
  filterConfig={[ { name: 'brand_id', options: brands } ]}
/>
```

---

## 3. Reusable Atomic Components (`src/components/shared/`)

### `CopyableText` (New)
- **Use Case**: Long names or IDs in tables.
- **Features**: 85-char limit, Shadcn Tooltip, Copy button.

### `ActionGroup` (Standardized Row Actions)
- **Use Case**: The "Actions" column in tables.
- **Features**: View (Eye), Edit (Pencil), Delete (Trash), Email (Mail), Download (FileText).
- **Consistency**: Icons are always the same size, color, and order.

### `StatusBadge` (Existing - to be expanded)
- **Use Case**: Success/Warning/Danger tags.
- **Improvement**: Dynamic color mapping from a single config file.

---

## 4. Implementation Roadmap (Module-by-Module)

### Phase 1: Core Infrastructure (The "Foundation")
1. Build `useResourceList` and `useResourceMutation` hooks.
2. Build `ResourceListingPage` (The "Global Table").
3. Move `StatCard` from Dashboard to `shared/` for use in reports.

### Phase 2: High-Traffic Modules (The "Migration")
1. **Products**: Migrate to new architecture first (since it has the most features like bulk-edit).
2. **Invoices/Quotes**: Standardize the Action Column (Email/Download).
3. **Enquiries**: Integrate real-time state (Chat integration).

### Phase 3: Utility Modules
1. **Brands/Categories**: Simplest CRUDs to test the "speed" of the new architecture.
2. **Users/Settings**: Final cleanup.

---

## 5. Architectural Benefits
- **Performance**: Instant page transitions due to the "State-Driven" cache.
- **Maintainability**: If we decide to change the "Delete" icon portal-wide, we change it in **one** line of code.
- **Developer Speed**: Creating a new module will now take **5 minutes** instead of hours.
- **Reliability**: Centralized error handling means users get consistent feedback across the whole app.
