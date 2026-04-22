import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockEnquiries } from '@/lib/mockData';
import type { Enquiry } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MessageSquareText, FileText, ExternalLink, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CustomerEnquiries = () => {
  const navigate = useNavigate();
  const { company } = useParams();
  // Mock customer ID
  const [enquiries] = useState<Enquiry[]>(mockEnquiries.filter(e => e.customer_id === 3));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate(`/portal/${company}/request-form`)} size="sm" className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white h-9">
          <MessageSquareText size={16} className="mr-2" /> New Enquiry
        </Button>
      </div>
      {enquiries.length === 0 ? (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-12 text-center">
          <MessageSquareText size={48} className="mx-auto text-admin-text-muted mb-4 opacity-20" />
          <h3 className="text-xl font-semibold text-admin-text-primary mb-2">No Enquiries Yet</h3>
          <p className="text-admin-text-secondary mb-6">You haven't submitted any requests yet.</p>
          <Button onClick={() => navigate(`/portal/${company}/request-form`)}>
            Create your first enquiry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {enquiries.map((enq) => {
            const hasAdminResponded = enq.status !== 'new';
            return (
              <div key={enq.id} className="bg-admin-surface border border-admin-border rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                <div className="p-5 border-b border-admin-border flex justify-between items-start bg-admin-bg">
                  <div>
                    <span className="font-mono text-sm font-bold text-zeronix-blue">
                      REQ-{String(enq.id).padStart(4, '0')}
                    </span>
                    <p className="text-xs text-admin-text-secondary mt-1">
                      {enq.created_at ? new Date(enq.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <StatusBadge status={enq.status} />
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4 text-sm text-admin-text-secondary">
                    <Package size={16} />
                    <span>{enq.items_count || 0} Products requested</span>
                  </div>
                  
                  {enq.notes && (
                    <div className="bg-admin-bg rounded p-3 text-sm text-admin-text-secondary italic line-clamp-3 mb-4">
                      "{enq.notes}"
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-admin-border flex items-center justify-between">
                    <div className="text-xs font-medium">
                      {hasAdminResponded ? (
                        <span className="text-success flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-success"></div>
                          Admin Responded
                        </span>
                      ) : (
                        <span className="text-warning flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
                          Awaiting Response
                        </span>
                      )}
                    </div>
                    {enq.status === 'quoted' ? (
                      <Button variant="outline" size="sm" className="text-success border-success hover:bg-success hover:text-white" onClick={() => navigate(`/portal/${company}/quotes`)}>
                        <FileText size={14} className="mr-2" /> View Quote
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-zeronix-blue hover:bg-zeronix-blue/10">
                        <ExternalLink size={14} className="mr-2" /> Details
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
