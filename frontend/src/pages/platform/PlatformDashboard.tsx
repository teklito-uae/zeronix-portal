import React from 'react';
import { SEO } from '@/components/shared/SEO';
import { LayoutDashboard, Building2, Activity, Users, ShoppingCart, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export const PlatformDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => (await api.get('/admin/platform/stats')).data,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-zeronix-blue h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <SEO title="Platform Overview" description="Zeronix SaaS God Mode Dashboard" />
      
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Zeronix Mission Control</h1>
        <p className="text-slate-500">Global overview of all active tenants and system health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Companies</CardTitle>
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.total_companies || 0}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
              <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">{stats?.growth?.companies || '+0%'}</span> Active: {stats?.active_companies || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Platform Users</CardTitle>
            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.total_users || 0}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
              <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">{stats?.growth?.users || '+0%'}</span> Staff & Admins: {stats?.active_users || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Customers</CardTitle>
            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats?.total_customers || 0}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
              Registered across all tenants
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</CardTitle>
            <div className="h-10 w-10 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(stats?.total_revenue || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
              <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">{stats?.growth?.revenue || '+0%'}</span> Network Volume
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};