import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTopbarActionsStore } from '@/store/useTopbarActionsStore';

/**
 * Call this in any page component to render page-specific action buttons
 * (Export, Import, Add, etc.) in the shared Topbar's right-hand action slot.
 * Mirrors useBreadcrumb's store-injection pattern — the Topbar reads from
 * the same store and renders whatever the active page last set.
 *
 * @example
 * useTopbarActions(
 *   <Button onClick={openAdd}>Add Company</Button>
 * );
 */
export const useTopbarActions = (actions: ReactNode | null) => {
  const setActions = useTopbarActionsStore((s) => s.setActions);
  const clear = useTopbarActionsStore((s) => s.clear);

  useEffect(() => {
    setActions(actions);
    return () => clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions]);
};
