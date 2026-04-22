import { useAuthStore } from '@/store/useAuthStore';
import { User, Mail, Building } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';

export const CustomerProfile = () => {
  const customer = useAuthStore((s) => s.customer);

  if (!customer) return null;

  return (
    <div className="space-y-6">
      <SEO title="My Profile" description="Manage your personal and company details." />
      
      <div className="bg-admin-surface border border-admin-border rounded-xl p-8 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-zeronix-blue to-zeronix-blue-hover opacity-10"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="flex-shrink-0">
            <div className="h-32 w-32 rounded-2xl border-4 border-admin-surface shadow-lg overflow-hidden bg-admin-bg">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.name}`} 
                alt={customer.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left pt-4">
            <h1 className="text-3xl font-bold text-admin-text-primary">{customer.name}</h1>
            <p className="text-admin-text-secondary mt-1 flex items-center justify-center md:justify-start gap-2">
              <Mail size={16} /> {customer.email}
            </p>
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-3 py-1 bg-zeronix-blue/10 text-zeronix-blue rounded-full text-sm font-semibold">
                B2B Customer
              </span>
              <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-semibold">
                Active Account
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-admin-surface border border-admin-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-admin-text-primary mb-4 flex items-center gap-2">
            <Building size={20} className="text-zeronix-blue" />
            Company Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-admin-border pb-2">
              <span className="text-admin-text-muted text-sm font-medium">Company Name</span>
              <span className="text-admin-text-primary font-medium">{customer.company}</span>
            </div>
            <div className="flex justify-between border-b border-admin-border pb-2">
              <span className="text-admin-text-muted text-sm font-medium">Business Type</span>
              <span className="text-admin-text-primary font-medium">Industrial Wholesale</span>
            </div>
            <div className="flex justify-between border-b border-admin-border pb-2">
              <span className="text-admin-text-muted text-sm font-medium">Tax ID</span>
              <span className="text-admin-text-primary font-medium">TRN-982347102</span>
            </div>
          </div>
        </div>

        <div className="bg-admin-surface border border-admin-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-admin-text-primary mb-4 flex items-center gap-2">
            <User size={20} className="text-zeronix-blue" />
            Contact Details
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-admin-border pb-2">
              <span className="text-admin-text-muted text-sm font-medium">Contact Person</span>
              <span className="text-admin-text-primary font-medium">{customer.name}</span>
            </div>
            <div className="flex justify-between border-b border-admin-border pb-2">
              <span className="text-admin-text-muted text-sm font-medium">Email Address</span>
              <span className="text-admin-text-primary font-medium">{customer.email}</span>
            </div>
            <div className="flex justify-between border-b border-admin-border pb-2">
              <span className="text-admin-text-muted text-sm font-medium">Phone Number</span>
              <span className="text-admin-text-primary font-medium">+971 50 123 4567</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
