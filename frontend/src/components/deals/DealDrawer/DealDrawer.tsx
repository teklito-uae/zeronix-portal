import { useEffect, useState } from 'react';
import { useSelectedDealStore } from '@/store/useSelectedDealStore';
import { useDeal } from '@/hooks/useDeals';
import type { Deal, DealStage } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SharedStatusSelect } from '@/components/shared/SharedStatusSelect';
import { Skeleton } from '@/components/ui/skeleton';
import { Handshake } from 'lucide-react';

import { useDealDrawerActions } from './useDealDrawerActions';
import { DealLostCancelDialog, type DealLostCancelReason } from './DealLostCancelDialog';
import { DealOverviewTab } from './DealOverviewTab';
import { DealContactsTab } from './DealContactsTab';
import { DealQuotesTab } from './DealQuotesTab';
import { DealActivityTab } from './DealActivityTab';
import { DealTeamAssignment } from './DealTeamAssignment';
import { DealTagsSection } from './DealTagsSection';
import { DealAttachmentsSection } from './DealAttachmentsSection';

const DEAL_STAGES: DealStage[] = [
  'new', 'qualified', 'requirement', 'proposal_sent', 'negotiation', 'won', 'lost', 'cancelled',
];

/**
 * The Deal Detail Drawer shell. Open/closed state is driven entirely by
 * `useSelectedDealStore`'s `selectedDealId` (not a local boolean prop) so
 * any part of the app can open a deal by id (e.g. the Kanban board, or the
 * Calendar deep-link that used to read `?dealId=` in Deals.tsx).
 */
export const DealDrawer = () => {
  const selectedDealId = useSelectedDealStore((s) => s.selectedDealId);
  const setSelectedDealId = useSelectedDealStore((s) => s.setSelectedDealId);
  const { data: fetchedDeal, isLoading } = useDeal(selectedDealId ?? undefined);

  const [activeTab, setActiveTab] = useState('overview');
  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);

  // Freeze the last-loaded deal locally instead of rendering straight off
  // `fetchedDeal`. Closing the sheet nulls `selectedDealId` immediately,
  // which would otherwise flip `fetchedDeal` to undefined mid-close and
  // swap the content to the loading skeleton while it's still sliding
  // out — that content swap is what read as "lag" on close, not the slide
  // animation itself. Keeping the last deal visible during close fixes it
  // without touching the Sheet's animation.
  const [deal, setDeal] = useState<Deal | undefined>(undefined);
  useEffect(() => {
    if (fetchedDeal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: freezes the last-loaded deal against `selectedDealId` clearing to avoid a loading-skeleton flash while the sheet slides shut (see comment above); this is state derived from history, not purely from current props, so it can't be computed inline or via useMemo.
      setDeal(fetchedDeal);
    } else if (selectedDealId && deal && deal.id !== selectedDealId) {
      setDeal(undefined);
      setActiveTab('overview');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedDeal, selectedDealId]);

  const actions = useDealDrawerActions();

  const handleClose = () => {
    setSelectedDealId(null);
    setPendingStage(null);
    // Tab is intentionally NOT reset here — resetting it immediately would
    // swap the visible tab content while the sheet is still sliding shut.
    // It resets on the next open instead (see the effect above's "opening a
    // different deal" branch).
  };

  const handleStageChange = (value: string) => {
    if (!deal) return;
    const stage = value as DealStage;
    const needsReason =
      (stage === 'lost' && !deal.lost_reason) || (stage === 'cancelled' && !deal.cancellation_reason);
    if (needsReason) {
      setPendingStage(stage);
    } else {
      actions.updateDeal.mutate({ id: deal.id, data: { stage } });
    }
  };

  const handleLostCancelConfirm = (reason: DealLostCancelReason) => {
    if (!deal || !pendingStage) return;
    actions.updateDeal.mutate(
      { id: deal.id, data: { stage: pendingStage, ...reason } },
      { onSuccess: () => setPendingStage(null) }
    );
  };

  return (
    <>
      <Sheet open={selectedDealId !== null} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 bg-brand-white border-brand-border/50">
          {isLoading || !deal ? (
            <div className="flex flex-col h-full">
              <SheetTitle className="sr-only">Loading deal…</SheetTitle>
              <div className="bg-brand-surface p-5 border-b border-brand-border/50 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <div className="flex-1 p-5 space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ) : (
            <div key={deal.id} className="flex flex-col h-full">
              <SheetHeader className="bg-brand-surface p-5 border-b border-brand-border/50 space-y-0 text-left flex-shrink-0">
                <div className="flex items-start justify-between gap-3 pr-6">
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-accent-light dark:bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
                      <Handshake size={18} className="text-brand-accent" />
                    </div>
                    <div className="min-w-0">
                      <SheetTitle className="text-[16px] font-bold text-brand-primary truncate">{deal.title}</SheetTitle>
                      <SheetDescription className="text-[13px] font-medium text-brand-subtle mt-0.5">
                        {deal.deal_code}
                      </SheetDescription>
                    </div>
                  </div>
                  <div className="w-44 flex-shrink-0">
                    <SharedStatusSelect value={deal.stage} onChange={handleStageChange} options={DEAL_STAGES} />
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="px-5 pt-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-brand-bg/50 border border-brand-border h-auto p-1 rounded-xl w-full justify-start gap-1">
                      <TabsTrigger value="overview" className="rounded-lg text-[12px] font-medium px-3 py-1.5">Overview</TabsTrigger>
                      <TabsTrigger value="contacts" className="rounded-lg text-[12px] font-medium px-3 py-1.5">Contacts</TabsTrigger>
                      <TabsTrigger value="quotes" className="rounded-lg text-[12px] font-medium px-3 py-1.5">Quotes</TabsTrigger>
                      <TabsTrigger value="activity" className="rounded-lg text-[12px] font-medium px-3 py-1.5">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4 outline-none">
                      <DealOverviewTab deal={deal} updateDeal={actions.updateDeal} />
                    </TabsContent>
                    <TabsContent value="contacts" className="mt-4 outline-none">
                      <DealContactsTab
                        deal={deal}
                        attachContact={actions.attachContact}
                        detachContact={actions.detachContact}
                        setPrimaryContact={actions.updateDeal}
                      />
                    </TabsContent>
                    <TabsContent value="quotes" className="mt-4 outline-none">
                      <DealQuotesTab deal={deal} />
                    </TabsContent>
                    <TabsContent value="activity" className="mt-4 outline-none">
                      <DealActivityTab dealId={deal.id} addActivity={actions.addActivity} />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Persistent sections — always visible regardless of active tab */}
                <div className="px-5 pb-5 pt-5 mt-1 border-t border-brand-border/50 space-y-5">
                  <DealTeamAssignment deal={deal} assignDeal={actions.assignDeal} />
                  <DealTagsSection deal={deal} attachTag={actions.attachTag} detachTag={actions.detachTag} />
                  <DealAttachmentsSection
                    deal={deal}
                    uploadAttachment={actions.uploadAttachment}
                    removeAttachment={actions.removeAttachment}
                  />
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <DealLostCancelDialog
        open={pendingStage !== null}
        targetStage={(pendingStage ?? 'lost') as 'lost' | 'cancelled'}
        onConfirm={handleLostCancelConfirm}
        onCancel={() => setPendingStage(null)}
        isSubmitting={actions.updateDeal.isPending}
      />
    </>
  );
};
