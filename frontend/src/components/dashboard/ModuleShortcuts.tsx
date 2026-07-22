import { useNavigate } from 'react-router-dom';
import { getBasePath } from '@/hooks/useBasePath';
import {
  FcAreaChart, FcConferenceCall, FcCustomerSupport, FcDocument,
  FcRules, FcMoneyTransfer, FcPackage, FcShipped, FcPlanner,
  FcTimeline, FcReading, FcBusinessman, FcSalesPerformance,
  FcInTransit, FcCurrencyExchange, FcDebt, FcComboChart,
} from 'react-icons/fc';

const MODULE_REGISTRY: Record<string, { label: string; icon: any; path: string }> = {
  dashboard: { label: 'Dashboard', icon: FcAreaChart, path: '/dashboard' },
  leads: { label: 'Leads', icon: FcBusinessman, path: '/leads' },
  companies: { label: 'Companies', icon: FcConferenceCall, path: '/companies' },
  enquiries: { label: 'Enquiries', icon: FcCustomerSupport, path: '/enquiries' },
  quotes: { label: 'Quotes', icon: FcDocument, path: '/quotes' },
  'sales-orders': { label: 'Sales Orders', icon: FcSalesPerformance, path: '/sales-orders' },
  deliveries: { label: 'Deliveries', icon: FcInTransit, path: '/deliveries' },
  invoices: { label: 'Invoices', icon: FcRules, path: '/invoices' },
  receipts: { label: 'Receipts', icon: FcMoneyTransfer, path: '/payment-receipts' },
  products: { label: 'Products', icon: FcPackage, path: '/products' },
  suppliers: { label: 'Suppliers', icon: FcShipped, path: '/suppliers' },
  purchases: { label: 'Purchasing', icon: FcCurrencyExchange, path: '/purchases' },
  expenses: { label: 'Expenses', icon: FcDebt, path: '/expenses' },
  reports: { label: 'Reports', icon: FcComboChart, path: '/reports' },
  attendance: { label: 'Attendance', icon: FcPlanner, path: '/attendance' },
  activities: { label: 'Activities', icon: FcTimeline, path: '/activities' },
  users: { label: 'Team', icon: FcReading, path: '/users' },
};

export const ModuleShortcuts = ({ permissions }: { permissions: string[] }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 py-5 px-2 md:px-6">
      {permissions.slice(0, 8).map((perm) => {
        const mod = MODULE_REGISTRY[perm];
        if (!mod) return null;
        const Icon = mod.icon;
        return (
          <button
            key={perm}
            onClick={() => navigate(`${getBasePath()}${mod.path}`)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="h-14 w-14 flex items-center justify-center rounded-full bg-brand-white border border-brand-border hover:border-brand-accent/40 hover:bg-brand-surface transition-all duration-150">
              <Icon size={28} />
            </div>
            <span className="text-[11px] font-medium text-brand-muted group-hover:text-brand-primary transition-colors">{mod.label}</span>
          </button>
        );
      })}
      {permissions.length > 8 && (
        <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
          <div className="h-14 w-14 flex items-center justify-center rounded-full bg-brand-surface border border-brand-border hover:border-brand-border-strong transition-all">
            <span className="text-[18px] font-bold text-brand-muted">+{permissions.length - 8}</span>
          </div>
          <span className="text-[11px] font-medium text-brand-muted group-hover:text-brand-primary transition-colors">More</span>
        </div>
      )}
    </div>
  );
};
