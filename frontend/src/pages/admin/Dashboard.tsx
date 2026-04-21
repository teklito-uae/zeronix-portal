
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { FileText, Users, ShoppingCart, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const dummyData = [
  { name: 'Jan', enquiries: 400, quotes: 240 },
  { name: 'Feb', enquiries: 300, quotes: 139 },
  { name: 'Mar', enquiries: 200, quotes: 980 },
  { name: 'Apr', enquiries: 278, quotes: 390 },
  { name: 'May', enquiries: 189, quotes: 480 },
  { name: 'Jun', enquiries: 239, quotes: 380 },
];

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your portal activities." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Enquiries" value="1,284" icon={<MessageSquare size={20} />} />
        <StatCard title="Pending Quotes" value="45" icon={<FileText size={20} />} />
        <StatCard title="Active Customers" value="320" icon={<Users size={20} />} />
        <StatCard title="Products" value="8,401" icon={<ShoppingCart size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-admin-surface p-6 rounded-brand border border-admin-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-admin-text-primary">Enquiries vs Quotes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dummyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-admin-border)" />
                <XAxis dataKey="name" stroke="var(--color-admin-text-muted)" />
                <YAxis stroke="var(--color-admin-text-muted)" />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: 'var(--color-admin-surface)', color: 'var(--color-admin-text-primary)', borderColor: 'var(--color-admin-border)', borderRadius: '8px'}} />
                <Bar dataKey="enquiries" fill="var(--color-zeronix-blue)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quotes" fill="var(--color-zeronix-green)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-admin-surface p-6 rounded-brand border border-admin-border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-admin-text-primary">Quote Value (6 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dummyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-admin-border)" />
                <XAxis dataKey="name" stroke="var(--color-admin-text-muted)" />
                <YAxis stroke="var(--color-admin-text-muted)" />
                <Tooltip contentStyle={{backgroundColor: 'var(--color-admin-surface)', color: 'var(--color-admin-text-primary)', borderColor: 'var(--color-admin-border)', borderRadius: '8px'}} />
                <Line type="monotone" dataKey="quotes" stroke="var(--color-zeronix-blue)" strokeWidth={3} dot={{r: 4, fill: 'var(--color-zeronix-blue)'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-admin-surface rounded-brand border border-admin-border overflow-hidden">
        <div className="p-4 border-b border-admin-border">
          <h3 className="text-lg font-semibold text-admin-text-primary">Recent Enquiries</h3>
        </div>
        <DataTable 
          data={[
            { id: 'ENQ-001', customer: 'Acme Corp', status: 'Pending', date: '2023-10-01' },
            { id: 'ENQ-002', customer: 'Stark Ind', status: 'Quoted', date: '2023-10-02' },
          ]} 
          columns={[
            { accessorKey: 'id', header: 'ID' },
            { accessorKey: 'customer', header: 'Customer' },
            { accessorKey: 'status', header: 'Status' },
            { accessorKey: 'date', header: 'Date' },
          ]} 
        />
      </div>
    </div>
  );
};
