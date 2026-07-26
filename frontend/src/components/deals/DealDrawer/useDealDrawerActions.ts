import {
  useUpdateDeal,
  useAssignDeal,
  useAddActivity,
  useUploadAttachment,
  useRemoveAttachment,
  useAttachContact,
  useDetachContact,
  useAttachTag,
  useDetachTag,
} from '@/hooks/useDeals';

/**
 * Composes the deal-detail mutation hooks from `hooks/useDeals.ts` into a
 * single object so the drawer and its tabs never touch `dealsApi`/raw
 * `useMutation` calls directly — thin composition only, no new logic here.
 */
export function useDealDrawerActions() {
  const updateDeal = useUpdateDeal();
  const assignDeal = useAssignDeal();
  const addActivity = useAddActivity();
  const uploadAttachment = useUploadAttachment();
  const removeAttachment = useRemoveAttachment();
  const attachContact = useAttachContact();
  const detachContact = useDetachContact();
  const attachTag = useAttachTag();
  const detachTag = useDetachTag();

  return {
    updateDeal,
    assignDeal,
    addActivity,
    uploadAttachment,
    removeAttachment,
    attachContact,
    detachContact,
    attachTag,
    detachTag,
    isUpdating: updateDeal.isPending,
    isAssigning: assignDeal.isPending,
  };
}

export type DealDrawerActions = ReturnType<typeof useDealDrawerActions>;
