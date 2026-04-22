import { mockEnquiries, mockQuotes, mockInvoices } from '@/lib/mockData';
import { StatCard } from '@/components/shared/StatCard';
import { MessageSquareText, FileText, Receipt, Package } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/shared/SEO';

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { company } = useParams();
  // Assuming customer ID = 3
  const customerId = 3;
  
  const myEnquiries = mockEnquiries.filter(e => e.customer_id === customerId);
  const myQuotes = mockQuotes.filter(q => q.customer_id === customerId);
  const myInvoices = mockInvoices.filter(i => i.customer_id === customerId);

  return (
    <div className="space-y-4 md:space-y-6">
      <SEO title="Dashboard" description="Welcome back to your Zeronix customer portal." />
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/portal/${company}/products`)} size="sm" className="bg-zeronix-blue hover:bg-zeronix-blue-hover text-white md:h-10">
            <Package size={16} className="mr-2" /> Browse
          </Button>
          <Button onClick={() => navigate(`/portal/${company}/request-form`)} size="sm" variant="outline" className="border-admin-border text-admin-text-primary hover:bg-admin-surface-hover md:h-10">
            <MessageSquareText size={16} className="mr-2" /> Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <StatCard
          title="Total Enquiries"
          value={myEnquiries.length}
          icon={<MessageSquareText size={20} />}
        />
        <StatCard
          title="Active Quotes"
          value={myQuotes.length}
          icon={<FileText size={20} />}
        />
        <StatCard
          title="Invoices"
          value={myInvoices.length}
          icon={<Receipt size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        <div className="bg-admin-surface border border-admin-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-admin-text-primary mb-4">Recent Enquiries</h3>
          {myEnquiries.length > 0 ? (
            <div className="space-y-4">
              {myEnquiries.slice(0, 5).map(enq => (
                <div key={enq.id} className="flex items-center justify-between p-3 rounded-lg border border-admin-border bg-admin-bg hover:border-zeronix-blue/50 transition-colors cursor-pointer" onClick={() => navigate(`/portal/${company}/enquiries`)}>
                  <div>
                    <p className="font-medium text-admin-text-primary text-sm">REQ-{String(enq.id).padStart(4, '0')}</p>
                    <p className="text-xs text-admin-text-secondary mt-1">{enq.created_at ? new Date(enq.created_at).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      enq.status === 'quoted' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {enq.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-admin-text-secondary text-sm">No recent enquiries found.</p>
          )}
        </div>

        <div className="bg-admin-surface border border-admin-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-admin-text-primary mb-4">Recent Quotes</h3>
          {myQuotes.length > 0 ? (
            <div className="space-y-4">
              {myQuotes.slice(0, 5).map(quote => (
                <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg border border-admin-border bg-admin-bg hover:border-zeronix-blue/50 transition-colors cursor-pointer" onClick={() => navigate(`/portal/${company}/quotes`)}>
                  <div>
                    <p className="font-medium text-admin-text-primary text-sm">{quote.quote_number}</p>
                    <p className="text-xs text-admin-text-secondary mt-1">${quote.total.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      quote.status === 'accepted' ? 'bg-success/10 text-success' : 'bg-zeronix-blue/10 text-zeronix-blue'
                    }`}>
                      {quote.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-admin-text-secondary text-sm">No recent quotes found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
