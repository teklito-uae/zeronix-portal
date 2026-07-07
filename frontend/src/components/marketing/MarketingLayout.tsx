import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/shared/SEO';
import {
  LayoutDashboard,
  Send,
  FileText,
  Filter,
  Ban,
  ListOrdered,
  Activity,
  BarChart3,
  Settings,
  Megaphone,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const SUB_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/workspace/marketing/dashboard' },
  { id: 'campaigns', label: 'Campaigns', icon: Send, path: '/workspace/marketing/campaigns' },
  { id: 'templates', label: 'Templates', icon: FileText, path: '/workspace/marketing/templates' },
  { id: 'segments', label: 'Segments', icon: Filter, path: '/workspace/marketing/segments' },
  { id: 'suppressions', label: 'Suppressions', icon: Ban, path: '/workspace/marketing/suppressions' },
  { id: 'queue', label: 'Queue', icon: ListOrdered, path: '/workspace/marketing/queue' },
  { id: 'activity', label: 'Activity', icon: Activity, path: '/workspace/marketing/activity' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/workspace/marketing/reports' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/workspace/marketing/settings', adminOnly: true },
];

interface MarketingLayoutProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const MarketingLayout = ({ title, children, actions }: MarketingLayoutProps) => {
  const admin = useAuthStore((s) => s.admin);
  const items = SUB_NAV.filter((item) => !item.adminOnly || admin?.role === 'admin' || admin?.role === 'super_admin');

  return (
    <div className="bg-brand-white md:border border-brand-border md:rounded-xl shadow-sm flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
      <SEO title={`Marketing — ${title}`} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-brand-border flex-shrink-0">
        <h1 className="text-[16px] md:text-[18px] font-bold text-brand-primary flex items-center gap-2">
          <Megaphone size={18} className="text-brand-subtle" />
          Marketing
          <span className="text-brand-subtle font-normal hidden sm:inline">/ {title}</span>
        </h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Sub navigation */}
      <div className="px-4 md:px-5 border-b border-brand-border flex items-center gap-5 flex-shrink-0 overflow-x-auto no-scrollbar">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'py-3 text-[13px] whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5',
                  isActive
                    ? 'font-semibold text-brand-primary border-brand-accent'
                    : 'font-medium text-brand-subtle hover:text-brand-primary border-transparent'
                )
              }
            >
              <Icon size={14} />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4 md:p-5">{children}</div>
    </div>
  );
};
