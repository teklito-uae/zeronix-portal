import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Building2, CheckCircle, XCircle, FileText, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

type Company = {
  id: number;
  name: string;
  number: string;
  tax_number: string;
  website: string;
  description: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  license_attachment: string | null;
  vat_attachment: string | null;
  created_at: string;
};

export const TenantManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.admin);
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['admin-companies'],
    queryFn: async () => {
      const res = await api.get('/admin/companies');
      return res.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/companies/${id}/approve`),
    onSuccess: () => {
      toast.success('Company approved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      setIsDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Approval failed')
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number, reason: string }) => api.post(`/admin/companies/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Company rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      setIsDialogOpen(false);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Rejection failed')
  });

  const suspendMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/companies/${id}/suspend`),
    onSuccess: () => {
      toast.success('Company suspended');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      setIsDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Suspension failed')
  });

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending Approval</Badge>;
      case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      case 'suspended': return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Suspended</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getDocumentUrl = (path: string) => {
    return `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${path}`;
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Company Directory"
        description="Manage registered businesses and portal access"
        action={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Company Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Contact Person</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Contact Info</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Registered</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
                    </td>
                  </tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-32 text-center text-slate-500">No companies found</td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold">
                            {company.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{company.name}</p>
                            <p className="text-xs text-slate-500">TRN: {company.tax_number || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900 dark:text-white font-medium">{company.first_name} {company.last_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900 dark:text-white">{company.email}</p>
                        <p className="text-xs text-slate-500">{company.phone || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(company.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(company.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsDialogOpen(true);
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Review Sheet */}
      <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[600px] p-0 flex flex-col gap-0">
          <div className="p-6 border-b flex-shrink-0">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="flex items-center gap-2 pr-6">
                <Building2 className="text-emerald-500" />
                Company Review
              </SheetTitle>
              <SheetDescription>
                Review company details and uploaded documents to verify their application.
              </SheetDescription>
            </SheetHeader>
          </div>

          {selectedCompany && (
            <div className="flex-1 overflow-y-auto space-y-6 p-6">
              {/* Status Header */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                <div>
                  <h3 className="font-bold text-lg">{selectedCompany.name}</h3>
                  <p className="text-sm text-slate-500">Reg No: {selectedCompany.number || 'N/A'}</p>
                </div>
                {getStatusBadge(selectedCompany.status)}
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-slate-500">Attached Documents</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedCompany.license_attachment ? (
                    <a href={getDocumentUrl(selectedCompany.license_attachment)} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border rounded-lg hover:border-emerald-500 transition-colors group">
                      <FileText className="text-emerald-500" />
                      <div>
                        <p className="font-medium text-sm group-hover:text-emerald-600 transition-colors">Trade License</p>
                        <p className="text-xs text-slate-500">Click to view</p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg text-slate-400">
                      <FileText />
                      <div className="flex flex-col">
                        <p className="text-sm">No License Provided</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Building2 size={13} className="text-slate-400" />
                          <span className="truncate">{selectedCompany.name}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCompany.vat_attachment ? (
                    <a href={getDocumentUrl(selectedCompany.vat_attachment)} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border rounded-lg hover:border-emerald-500 transition-colors group">
                      <FileText className="text-emerald-500" />
                      <div>
                        <p className="font-medium text-sm group-hover:text-emerald-600 transition-colors">VAT Certificate</p>
                        <p className="text-xs text-slate-500">Click to view</p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg text-slate-400">
                      <FileText />
                      <p className="text-sm">No VAT Provided</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              {isSuperAdmin && selectedCompany.status === 'pending' && (
                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Super Admin Actions</h4>
                  <div className="flex flex-col gap-3">
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(selectedCompany.id)}
                    >
                      {approveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle className="mr-2" size={16} />}
                      Approve & Grant Portal Access
                    </Button>
                    
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Reason for rejection (optional)" 
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        variant="destructive"
                        disabled={rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate({ id: selectedCompany.id, reason: rejectReason })}
                      >
                        {rejectMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <XCircle className="mr-2" size={16} />}
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isSuperAdmin && selectedCompany.status === 'approved' && (
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    disabled={suspendMutation.isPending}
                    onClick={() => suspendMutation.mutate(selectedCompany.id)}
                  >
                    <Ban className="mr-2" size={16} /> Suspend Portal Access
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
