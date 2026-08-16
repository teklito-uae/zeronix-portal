import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MessageSquareText, Package, Loader2, Calendar, ChevronRight, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/shared/SEO';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { Deal, DealItem, PaginatedResponse, User } from '@/types';

// The customer-facing "enquiry" detail is a `Deal` (backend: `App\Models\Deal`,
// table `enquiries`), plus a legacy `status` column that's still physically on
// the table (unused by the current stage-based lifecycle) and an
// `assigned_user` field the UI reads speculatively (the `show` endpoint
// currently loads the relation as `user`, not `assigned_user`).
interface CustomerEnquiry extends Deal {
  status?: string;
  assigned_user?: User;
}

export const CustomerEnquiries = () => {
  const navigate = useNavigate();
  const { company } = useParams();
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<number | null>(null);
  
  const { data: enquiriesData, isLoading } = useQuery({
    queryKey: ['customer-enquiries'],
    queryFn: async (): Promise<PaginatedResponse<CustomerEnquiry>> => {
      const res = await api.get('/customer/enquiries');
      return res.data;
    }
  });

  const { data: selectedEnquiry, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['customer-enquiry', selectedEnquiryId],
    queryFn: async (): Promise<CustomerEnquiry> => {
      const res = await api.get(`/customer/enquiries/${selectedEnquiryId}`);
      return res.data;
    },
    enabled: !!selectedEnquiryId
  });

  const enquiries = enquiriesData?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-[20vh]">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-brand-accent" />
          <div className="absolute inset-0 blur-xl bg-brand-accent/20 animate-pulse" />
        </div>
        <p className="text-slate-500 mt-6 font-medium animate-pulse">Syncing your requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <SEO title="My Enquiries" description="View and track your product enquiries." />
      
      <PageHeader
        title="My Enquiries"
        description="Track the status of your procurement requests."
        action={
          <Button onClick={() => navigate(`/portal/${company}/products`)} className="bg-brand-accent hover:bg-brand-accent-hover text-white h-10 px-6 font-bold shadow-lg shadow-brand-accent/20">
            <MessageSquareText size={18} className="mr-2" /> New Enquiry
          </Button>
        }
      />

      {enquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No Enquiries Yet"
          description="Start browsing our product catalog to request quotes for your enterprise hardware needs."
          actionLabel="Create your first enquiry"
          onAction={() => navigate(`/portal/${company}/products`)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enquiries.map((enq) => {
            const hasAdminResponded = enq.status !== 'new';
            return (
              <div 
                key={enq.id} 
                className="group relative bg-brand-white border border-brand-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1 hover:border-brand-accent/30"
              >
                <div className="p-6 border-b border-brand-border flex justify-between items-start bg-brand-bg/30">
                  <div>
                    <span className="font-mono text-sm font-black text-brand-accent tracking-tighter">
                      ENQ-{String(enq.id).padStart(5, '0')}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-brand-subtle mt-1.5 uppercase font-bold tracking-widest">
                      <Calendar size={12} />
                      {enq.created_at ? new Date(enq.created_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <StatusBadge status={enq.status ?? ''} />
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-brand-bg rounded-xl border border-brand-border group-hover:border-brand-accent/40 transition-colors">
                      <Package size={20} className="text-brand-subtle group-hover:text-brand-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-primary">{enq.items_count || 0} Products</p>
                      <p className="text-[10px] text-brand-subtle uppercase tracking-widest font-bold">Request List</p>
                    </div>
                  </div>
                  
                  {enq.notes && (
                    <div className="bg-brand-bg/50 rounded-xl p-4 text-xs text-brand-secondary italic line-clamp-3 mb-6 border border-brand-border/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-brand-border" />
                      "{enq.notes}"
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-brand-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hasAdminResponded ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-500 tracking-wider">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                          In Review
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-500 tracking-wider">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                          Pending
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-brand-accent hover:text-brand-accent hover:bg-brand-accent/10 font-bold text-xs gap-2 group-hover:translate-x-1 transition-transform"
                      onClick={() => setSelectedEnquiryId(enq.id)}
                    >
                      Details <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}      {/* Enquiry Details Sheet */}
      <Sheet open={!!selectedEnquiryId} onOpenChange={(open) => !open && setSelectedEnquiryId(null)}>
        <SheetContent side="right" className="bg-brand-white border-brand-border text-brand-primary w-full sm:max-w-[700px] p-0 flex flex-col gap-0">
          {isLoadingDetails ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-brand-accent" />
            </div>
          ) : selectedEnquiry && (
            <div className="flex flex-col h-full">
              <div className="p-8 border-b border-brand-border bg-brand-bg/30 flex-shrink-0 pr-14">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-brand-primary tracking-tight flex items-center gap-3">
                      Enquiry Details
                      <span className="text-sm font-mono text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-full">
                        #ENQ-{String(selectedEnquiry.id).padStart(5, '0')}
                      </span>
                    </h2>
                    <div className="flex items-center gap-6 mt-3">
                      <div className="flex items-center gap-2 text-xs text-brand-subtle font-bold uppercase tracking-widest">
                        <Calendar size={14} />
                        {selectedEnquiry.created_at ? new Date(selectedEnquiry.created_at).toLocaleDateString() : '—'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-brand-subtle font-bold uppercase tracking-widest">
                        <StatusBadge status={selectedEnquiry.status ?? ''} />
                      </div>
                    </div>
                  </div>
                  {selectedEnquiry.assigned_user && (
                    <div className="bg-brand-bg p-3 rounded-xl border border-brand-border flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-[10px] font-bold text-white">
                        {selectedEnquiry.assigned_user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[10px] text-brand-subtle uppercase font-black">Account Manager</p>
                        <p className="text-xs font-bold text-brand-primary">{selectedEnquiry.assigned_user.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {selectedEnquiry.status === 'cancelled' && (
                  <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500/40" />
                    <div className="flex items-center justify-between">
                       <h3 className="text-red-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                         <XCircle size={16} /> Cancellation Feedback
                       </h3>
                       {selectedEnquiry.cancelled_at && (
                         <span className="text-[10px] text-red-500/60 font-bold uppercase tracking-tighter">
                           {new Date(selectedEnquiry.cancelled_at).toLocaleDateString()}
                         </span>
                       )}
                    </div>
                    <p className="text-sm text-red-100/80 leading-relaxed italic">
                      "{selectedEnquiry.cancellation_reason || 'No reason provided.'}"
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-brand-accent" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-brand-subtle">Items Requested</h3>
                  </div>
                  
                  <div className="bg-brand-bg rounded-2xl border border-brand-border overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-bg/50">
                          <th className="p-4 text-[10px] font-black text-brand-subtle uppercase tracking-widest border-b border-brand-border">Product / Description</th>
                          <th className="p-4 text-[10px] font-black text-brand-subtle uppercase tracking-widest border-b border-brand-border text-center">Qty</th>
                          <th className="p-4 text-[10px] font-black text-brand-subtle uppercase tracking-widest border-b border-brand-border text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/50">
                        {selectedEnquiry.items?.map((item: DealItem) => (
                          <tr key={item.id} className="hover:bg-brand-bg/20">
                            <td className="p-4">
                              <p className="text-sm font-bold text-brand-primary">
                                {item.product?.name || item.description}
                              </p>
                              {item.product?.model_code && (
                                <p className="text-[10px] font-mono text-brand-subtle mt-1 uppercase tracking-tighter">
                                  {item.product.model_code}
                                </p>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-brand-white rounded-lg text-sm font-bold text-brand-primary border border-brand-border">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Processing</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedEnquiry.notes && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquareText size={18} className="text-brand-accent" />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-brand-subtle">Additional Notes</h3>
                    </div>
                    <div className="bg-brand-bg/30 p-6 rounded-2xl border border-brand-border text-sm text-brand-secondary leading-relaxed italic">
                      "{selectedEnquiry.notes}"
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-brand-border bg-brand-bg/20 flex justify-between items-center flex-shrink-0">
                 <p className="text-xs text-brand-subtle max-w-[300px]">
                   If you have any changes to this request, please contact your account manager directly.
                 </p>
                 <Button onClick={() => setSelectedEnquiryId(null)} className="bg-brand-white hover:bg-brand-bg text-brand-primary font-bold h-11 px-8 rounded-xl border border-brand-border shadow-sm">
                   Close Details
                 </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
