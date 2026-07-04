import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, ShieldAlert, Users, Code, Server, BookOpen } from 'lucide-react';

export const SystemDocs = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg dark:bg-emerald-900/30">
          <BookOpen size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zeronix CRM Architecture</h1>
          <p className="text-slate-500">Live Technical Documentation & System Specifications</p>
        </div>
      </div>

      <Tabs defaultValue="architecture" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="architecture" className="flex gap-2"><Server size={16}/> Architecture</TabsTrigger>
          <TabsTrigger value="rbac" className="flex gap-2"><ShieldAlert size={16}/> Role Based Access</TabsTrigger>
          <TabsTrigger value="database" className="flex gap-2"><Database size={16}/> Data Structures</TabsTrigger>
          <TabsTrigger value="modules" className="flex gap-2"><Code size={16}/> Core Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Multi-Tenancy Strategy (Row-Level Isolation)</CardTitle>
              <CardDescription>How we separate client data securely without overhead.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700 dark:text-slate-300">
                Zeronix employs a <strong>Single Database, Row-Level Multi-Tenancy</strong> model. Rather than creating a separate physical database for every registered company, all data is housed centrally. 
              </p>
              <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-sm">
                // Every tenant-bound table includes:
                <br/>
                $table-&gt;foreignId('company_id')-&gt;constrained('companies');
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                Security is enforced at the Laravel ORM layer using <strong>Global Query Scopes</strong>. If a user logs in via the Client Portal, the system automatically appends <code>WHERE company_id = ?</code> to every single query (Quotes, Invoices, Enquiries). This guarantees zero data leakage between tenants.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Path-Based Routing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Instead of managing hundreds of subdomains (e.g., company1.zeronix.com), the system uses unified authentication gateways. The backend identifies the user and restricts data accordingly.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                <li><strong>/admin/*</strong> - Internal Zeronix operations (requires `users` table auth).</li>
                <li><strong>/staff/*</strong> - Internal Zeronix sales team (requires `users` table auth).</li>
                <li><strong>/portal/*</strong> - Tenant workspace (requires `customers` table auth).</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rbac" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users size={20} className="text-emerald-500"/> The 4-Tier Hierarchy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-lg text-purple-600">1. SaaS Admin (God Mode)</h3>
                  <p className="text-sm text-slate-500">Database: `users` | Role: `super_admin`</p>
                  <p className="mt-2">Platform owner. Bypasses all tenant scopes. Can approve new company registrations, view master financial metrics, and suspend workspaces.</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-lg text-blue-600">2. Staff (Zeronix Personnel)</h3>
                  <p className="text-sm text-slate-500">Database: `users` | Role: `staff`</p>
                  <p className="mt-2">Internal employees. Their visibility is restricted by assignment (e.g., they only see Quotes/Enquiries where `assigned_to = auth-&gt;id()`).</p>
                </div>
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="font-bold text-lg text-emerald-600">3. Company Admin (Tenant Owner)</h3>
                  <p className="text-sm text-slate-500">Database: `customers` | Flag: `is_company_admin = true`</p>
                  <p className="mt-2">The primary contact of a registered company. Has unrestricted access to their specific `company_id` dataset. Can invite their own employees.</p>
                </div>
                <div className="border-l-4 border-slate-500 pl-4">
                  <h3 className="font-bold text-lg text-slate-600">4. Customer (Tenant Employee)</h3>
                  <p className="text-sm text-slate-500">Database: `customers` | Flag: `is_company_admin = false`</p>
                  <p className="mt-2">Standard end-client. Primarily interacts with the system via tokenized Magic Links to quickly approve quotes or view specific invoices.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company (Tenant)</CardTitle>
                <CardDescription>Core business entity</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`{
  "id": 1,
  "name": "Acme Corp",
  "status": "approved", // pending, approved, suspended
  "is_client_portal_enabled": true,
  "tax_number": "TRN123456789",
  "currency": "AED",
  "license_attachment": "docs/license.pdf",
  "created_at": "2024-01-01T00:00:00Z"
}`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer (Tenant User)</CardTitle>
                <CardDescription>Authenticatable portal user</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-900 text-blue-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`{
  "id": 105,
  "company_id": 1, // Links to Acme Corp
  "is_company_admin": true, // Tenant Owner
  "name": "John Doe",
  "email": "john@acme.com",
  "is_portal_active": true,
  "password": "$2y$10$..." 
}`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User (Internal Team)</CardTitle>
                <CardDescription>Zeronix staff operators</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-900 text-purple-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`{
  "id": 5,
  "name": "Jane Smith",
  "email": "jane@zeronix.com",
  "role": "super_admin", // or 'staff'
  "permissions": ["view_invoices", "approve_companies"],
  "password": "$2y$10$..."
}`}
                </pre>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice (Scoped Data)</CardTitle>
                <CardDescription>Example of tenant-bound data</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-900 text-orange-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`{
  "id": 402,
  "company_id": 1, // Scoped to Tenant
  "customer_id": 105, // Specific contact
  "invoice_number": "INV-2024-001",
  "total_amount": 5000.00,
  "status": "PAID" // PAID, UNPAID, PARTIAL
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Activity Log Ledger (Spatie Integration)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                The CRM maintains an immutable audit trail using <code>spatie/laravel-activitylog</code>. 
              </p>
              <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-x-auto mb-4">
{`// Expected Log Structure
{
  "id": 1,
  "log_name": "default",
  "description": "updated",
  "subject_type": "App\\\\Models\\\\Quote",
  "subject_id": 12,
  "causer_type": "App\\\\Models\\\\User",
  "causer_id": 5, // Staff member ID
  "properties": {
    "old": { "status": "DRAFT", "total": 100 },
    "attributes": { "status": "SENT", "total": 150 } // JSON Diff Matrix
  },
  "company_id": 1 // Tenant scope attached via custom migration
}`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
