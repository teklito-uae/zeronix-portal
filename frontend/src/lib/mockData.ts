import type { Customer, Brand, Category, Supplier, Product, Enquiry, SupplierProduct, Quote, QuoteItem, Invoice, InvoiceItem, ChatRoom, ChatMessage } from '@/types';

// ── Mock Customers ─────────────────────────────────────

export const mockCustomers: Customer[] = [
  { id: 1, name: 'Ahmed Al Mansoori', company: 'Gulf Industrial Supplies', email: 'ahmed@gulfind.ae', phone: '+971 50 123 4567', created_at: '2025-11-15T10:00:00Z', enquiries_count: 12, quotes_count: 8, invoices_count: 5 },
  { id: 2, name: 'Sarah Johnson', company: 'Acme Trading LLC', email: 'sarah@acmetrading.com', phone: '+971 55 234 5678', created_at: '2025-12-01T09:00:00Z', enquiries_count: 7, quotes_count: 4, invoices_count: 3 },
  { id: 3, name: 'Mohammed Rashed', company: 'Desert Steel Works', email: 'mohammed@desertsteelworks.ae', phone: '+971 52 345 6789', created_at: '2026-01-20T14:00:00Z', enquiries_count: 3, quotes_count: 1, invoices_count: 0 },
  { id: 4, name: 'Priya Sharma', company: 'TechParts Global', email: 'priya@techparts.com', phone: '+971 56 456 7890', created_at: '2026-02-10T11:00:00Z', enquiries_count: 15, quotes_count: 10, invoices_count: 7 },
  { id: 5, name: 'Omar Khalil', company: 'Blue Ocean Marine', email: 'omar@blueoceanmarine.ae', phone: '+971 54 567 8901', created_at: '2026-03-05T08:30:00Z', enquiries_count: 5, quotes_count: 3, invoices_count: 2 },
  { id: 6, name: 'Fatima Al Hashimi', company: 'Emirates Automation', email: 'fatima@emiratesauto.ae', phone: '+971 50 678 9012', created_at: '2026-03-15T16:00:00Z', enquiries_count: 9, quotes_count: 6, invoices_count: 4 },
  { id: 7, name: 'James Wilson', company: 'Pacific Sourcing', email: 'james@pacificsourcing.com', phone: '+971 55 789 0123', created_at: '2026-03-28T12:00:00Z', enquiries_count: 2, quotes_count: 0, invoices_count: 0 },
  { id: 8, name: 'Aisha Noor', company: 'Al Noor Engineering', email: 'aisha@alnooreng.ae', phone: '+971 52 890 1234', created_at: '2026-04-01T10:00:00Z', enquiries_count: 1, quotes_count: 0, invoices_count: 0 },
];

// ── Mock Brands ────────────────────────────────────────

export const mockBrands: Brand[] = [
  { id: 1, name: 'Siemens', created_at: '2025-10-01T00:00:00Z' },
  { id: 2, name: 'ABB', created_at: '2025-10-01T00:00:00Z' },
  { id: 3, name: 'Schneider Electric', created_at: '2025-10-01T00:00:00Z' },
  { id: 4, name: 'Honeywell', created_at: '2025-10-01T00:00:00Z' },
  { id: 5, name: 'Emerson', created_at: '2025-10-01T00:00:00Z' },
  { id: 6, name: 'Danfoss', created_at: '2025-10-01T00:00:00Z' },
  { id: 7, name: 'Bosch Rexroth', created_at: '2025-10-01T00:00:00Z' },
  { id: 8, name: 'Parker Hannifin', created_at: '2025-10-01T00:00:00Z' },
];

// ── Mock Categories ────────────────────────────────────

export const mockCategories: Category[] = [
  { id: 1, name: 'Automation & Control', parent_id: null },
  { id: 2, name: 'PLCs', parent_id: 1 },
  { id: 3, name: 'Sensors', parent_id: 1 },
  { id: 4, name: 'Drives & Motors', parent_id: null },
  { id: 5, name: 'VFDs', parent_id: 4 },
  { id: 6, name: 'Servo Drives', parent_id: 4 },
  { id: 7, name: 'Electrical Distribution', parent_id: null },
  { id: 8, name: 'Circuit Breakers', parent_id: 7 },
  { id: 9, name: 'Switchgear', parent_id: 7 },
  { id: 10, name: 'Instrumentation', parent_id: null },
  { id: 11, name: 'Flow Meters', parent_id: 10 },
  { id: 12, name: 'Pressure Transmitters', parent_id: 10 },
];

// ── Mock Suppliers ─────────────────────────────────────

export const mockSuppliers: Supplier[] = [
  { id: 1, name: 'AutoTech Solutions', contact_person: 'Hans Mueller', email: 'hans@autotech.de', phone: '+49 89 1234 5678', website: 'https://autotech.de', address: 'Munich, Germany', created_at: '2025-10-15T00:00:00Z', brands_count: 3, products_count: 45 },
  { id: 2, name: 'Gulf Electrical Trading', contact_person: 'Khalid Abbas', email: 'khalid@gulfelectrical.ae', phone: '+971 4 567 8901', website: 'https://gulfelectrical.ae', address: 'Dubai, UAE', created_at: '2025-11-01T00:00:00Z', brands_count: 5, products_count: 120 },
  { id: 3, name: 'Pacific Components', contact_person: 'Yuki Tanaka', email: 'yuki@pacificcomp.jp', phone: '+81 3 1234 5678', website: 'https://pacificcomp.jp', address: 'Tokyo, Japan', created_at: '2025-11-20T00:00:00Z', brands_count: 2, products_count: 30 },
  { id: 4, name: 'Euro Parts GmbH', contact_person: 'Anna Schmidt', email: 'anna@europarts.de', phone: '+49 30 9876 5432', website: 'https://europarts.de', address: 'Berlin, Germany', created_at: '2026-01-05T00:00:00Z', brands_count: 4, products_count: 85 },
  { id: 5, name: 'India Controls Pvt Ltd', contact_person: 'Rajesh Patel', email: 'rajesh@indiacontrols.in', phone: '+91 22 4567 8901', website: 'https://indiacontrols.in', address: 'Mumbai, India', created_at: '2026-02-14T00:00:00Z', brands_count: 3, products_count: 60 },
  { id: 6, name: 'Nordic Instruments AB', contact_person: 'Erik Lindberg', email: 'erik@nordicinst.se', phone: '+46 8 765 4321', website: 'https://nordicinst.se', address: 'Stockholm, Sweden', created_at: '2026-03-01T00:00:00Z', brands_count: 2, products_count: 25 },
];

// ── Mock Products ──────────────────────────────────────

export const mockProducts: Product[] = [
  { id: 1, brand_id: 1, category_id: 2, part_number: 'S7-1500-CPU', model_number: '6ES7 515-2AM02-0AB0', name: 'SIMATIC S7-1500 CPU 1515-2', description: 'High-performance PLC CPU for demanding applications', specs: { 'Work Memory': '500 KB', 'Cycle Time': '10 ns/instruction', 'I/O': 'Up to 2048', 'Communication': 'PROFINET, PROFIBUS' }, brand: mockBrands[0], category: mockCategories[1], created_at: '2025-11-01T00:00:00Z', suppliers_count: 3 },
  { id: 2, brand_id: 2, category_id: 5, part_number: 'ACS580-01', model_number: 'ACS580-01-09A4-4', name: 'ABB ACS580 General Purpose Drive', description: 'Variable frequency drive for general purpose applications', specs: { 'Power': '4 kW', 'Voltage': '380-480V', 'Current': '9.4 A', 'Protection': 'IP21' }, brand: mockBrands[1], category: mockCategories[4], created_at: '2025-11-15T00:00:00Z', suppliers_count: 2 },
  { id: 3, brand_id: 3, category_id: 8, part_number: 'NSX100F', model_number: 'LV429630', name: 'Schneider NSX100F Circuit Breaker', description: 'Compact circuit breaker for power distribution', specs: { 'Rating': '100 A', 'Breaking Capacity': '36 kA', 'Poles': '3P', 'Type': 'Fixed' }, brand: mockBrands[2], category: mockCategories[7], created_at: '2025-12-01T00:00:00Z', suppliers_count: 4 },
  { id: 4, brand_id: 4, category_id: 3, part_number: 'STT850', model_number: 'STT850-E-N-0-AMS-I', name: 'Honeywell STT850 SmartLine Transmitter', description: 'Smart temperature transmitter with HART protocol', specs: { 'Input': 'RTD, TC, mV, Ohm', 'Output': '4-20 mA HART', 'Accuracy': '±0.01°C', 'Protocol': 'HART 7' }, brand: mockBrands[3], category: mockCategories[2], created_at: '2025-12-15T00:00:00Z', suppliers_count: 2 },
  { id: 5, brand_id: 5, category_id: 11, part_number: '8732ESM2A1', model_number: '8732ESM2A1N0M4', name: 'Emerson Rosemount 8732E Flow Meter', description: 'Magnetic flow meter transmitter for process measurement', specs: { 'Size': 'DN25-DN900', 'Accuracy': '±0.25%', 'Output': '4-20 mA, HART', 'Lining': 'PTFE' }, brand: mockBrands[4], category: mockCategories[10], created_at: '2026-01-10T00:00:00Z', suppliers_count: 1 },
  { id: 6, brand_id: 6, category_id: 5, part_number: 'FC-051', model_number: 'FC-051P1K5T4E20H', name: 'Danfoss VLT Micro Drive FC 051', description: 'Compact frequency converter for simple applications', specs: { 'Power': '1.5 kW', 'Voltage': '380-480V', 'Current': '3.7 A', 'Protection': 'IP20' }, brand: mockBrands[5], category: mockCategories[4], created_at: '2026-01-25T00:00:00Z', suppliers_count: 3 },
  { id: 7, brand_id: 1, category_id: 6, part_number: '1FK7042', model_number: '1FK7042-5AK71-1EG5', name: 'Siemens SIMOTICS S-1FK7 Servo Motor', description: 'High-dynamic servo motor for precise motion control', specs: { 'Torque': '2.1 Nm', 'Speed': '6000 rpm', 'Encoder': 'Absolute 22-bit', 'Frame': '42mm' }, brand: mockBrands[0], category: mockCategories[5], created_at: '2026-02-05T00:00:00Z', suppliers_count: 2 },
  { id: 8, brand_id: 3, category_id: 12, part_number: 'XMLK010B2D21', model_number: 'XMLK010B2D21', name: 'Schneider XMLK Pressure Switch', description: 'Electromechanical pressure switch for industrial use', specs: { 'Range': '1-10 bar', 'Output': 'SPDT', 'Connection': 'G1/4', 'IP': 'IP65' }, brand: mockBrands[2], category: mockCategories[11], created_at: '2026-02-20T00:00:00Z', suppliers_count: 3 },
  { id: 9, brand_id: 7, category_id: 4, part_number: 'MSK040B', model_number: 'MSK040B-0600-NN-M1-UG1', name: 'Bosch Rexroth IndraDyn S Motor', description: 'Synchronous servo motor for high-performance drives', specs: { 'Torque': '3.8 Nm', 'Speed': '4500 rpm', 'Feedback': 'EnDat 2.1', 'Protection': 'IP65' }, brand: mockBrands[6], category: mockCategories[3], created_at: '2026-03-10T00:00:00Z', suppliers_count: 1 },
  { id: 10, brand_id: 8, category_id: 10, part_number: 'SCPSDi-150', model_number: 'SCPSDi-150-14-07', name: 'Parker SensoControl Pressure Sensor', description: 'Digital pressure sensor for hydraulic systems', specs: { 'Range': '0-150 bar', 'Output': 'IO-Link', 'Accuracy': '±0.5%', 'Connection': 'G1/4' }, brand: mockBrands[7], category: mockCategories[9], created_at: '2026-03-25T00:00:00Z', suppliers_count: 2 },
];

// ── Mock Enquiries ─────────────────────────────────────

export const mockEnquiries: Enquiry[] = [
  { id: 1, customer_id: 1, source: 'portal', priority: 'normal', status: 'new', notes: 'Need pricing for PLC units', created_at: '2026-04-20T09:00:00Z', customer: mockCustomers[0], items_count: 3 },
  { id: 2, customer_id: 2, source: 'email', priority: 'high', status: 'in_progress', notes: 'Urgent requirement for VFDs', created_at: '2026-04-19T14:30:00Z', customer: mockCustomers[1], items_count: 2 },
  { id: 3, customer_id: 4, source: 'portal', priority: 'urgent', status: 'new', notes: 'Complete automation package needed', created_at: '2026-04-19T11:00:00Z', customer: mockCustomers[3], items_count: 5 },
  { id: 4, customer_id: 3, source: 'chat', priority: 'normal', status: 'quoted', notes: 'Circuit breakers for new project', created_at: '2026-04-18T16:00:00Z', customer: mockCustomers[2], items_count: 4 },
  { id: 5, customer_id: 5, source: 'phone', priority: 'high', status: 'in_progress', notes: 'Flow meter replacement parts', created_at: '2026-04-17T10:00:00Z', customer: mockCustomers[4], items_count: 1 },
  { id: 6, customer_id: 6, source: 'portal', priority: 'normal', status: 'closed', notes: 'Servo motors for production line', created_at: '2026-04-15T08:00:00Z', customer: mockCustomers[5], items_count: 3 },
  { id: 7, customer_id: 1, source: 'email', priority: 'normal', status: 'quoted', notes: 'Follow up on pressure sensors', created_at: '2026-04-14T13:00:00Z', customer: mockCustomers[0], items_count: 2 },
  { id: 8, customer_id: 7, source: 'portal', priority: 'high', status: 'new', notes: 'Looking for Schneider switchgear', created_at: '2026-04-13T15:30:00Z', customer: mockCustomers[6], items_count: 6 },
  { id: 9, customer_id: 4, source: 'chat', priority: 'normal', status: 'in_progress', notes: 'Temperature transmitters for HVAC', created_at: '2026-04-12T09:30:00Z', customer: mockCustomers[3], items_count: 2 },
  { id: 10, customer_id: 8, source: 'portal', priority: 'normal', status: 'new', created_at: '2026-04-11T11:00:00Z', customer: mockCustomers[7], items_count: 1 },
];

// ── Mock Supplier Products ─────────────────────────────

export const mockSupplierProducts: SupplierProduct[] = [
  { id: 1, supplier_id: 1, product_id: 1, price: 2450.00, currency: 'EUR', availability: true, supplier: mockSuppliers[0] },
  { id: 2, supplier_id: 2, product_id: 1, price: 9800.00, currency: 'AED', availability: true, supplier: mockSuppliers[1] },
  { id: 3, supplier_id: 2, product_id: 2, price: 3200.00, currency: 'AED', availability: true, supplier: mockSuppliers[1] },
  { id: 4, supplier_id: 4, product_id: 2, price: 720.00, currency: 'EUR', availability: false, supplier: mockSuppliers[3] },
  { id: 5, supplier_id: 2, product_id: 3, price: 1850.00, currency: 'AED', availability: true, supplier: mockSuppliers[1] },
  { id: 6, supplier_id: 5, product_id: 3, price: 14500.00, currency: 'INR', availability: true, supplier: mockSuppliers[4] },
  { id: 7, supplier_id: 1, product_id: 4, price: 1100.00, currency: 'EUR', availability: true, supplier: mockSuppliers[0] },
  { id: 8, supplier_id: 6, product_id: 5, price: 3800.00, currency: 'USD', availability: true, supplier: mockSuppliers[5] },
  { id: 9, supplier_id: 2, product_id: 6, price: 1450.00, currency: 'AED', availability: true, supplier: mockSuppliers[1] },
  { id: 10, supplier_id: 3, product_id: 7, price: 185000, currency: 'JPY', availability: true, supplier: mockSuppliers[2] },
];

// ── Mock Quotes ────────────────────────────────────────

export const mockQuotes: Quote[] = [
  { id: 1, enquiry_id: 4, customer_id: 3, status: 'accepted', subtotal: 4500.00, vat_rate: 5, vat_amount: 225.00, total: 4725.00, valid_until: '2026-05-18T23:59:59Z', notes: 'Includes delivery to Dubai site', created_at: '2026-04-18T10:00:00Z', customer: mockCustomers[2] },
  { id: 2, enquiry_id: 7, customer_id: 1, status: 'sent', subtotal: 1250.00, vat_rate: 5, vat_amount: 62.50, total: 1312.50, valid_until: '2026-05-14T23:59:59Z', created_at: '2026-04-15T09:30:00Z', customer: mockCustomers[0] },
  { id: 3, enquiry_id: null, customer_id: 4, status: 'draft', subtotal: 8200.00, vat_rate: 5, vat_amount: 410.00, total: 8610.00, valid_until: '2026-05-20T23:59:59Z', created_at: '2026-04-21T11:15:00Z', customer: mockCustomers[3] },
];

export const mockQuoteItems: QuoteItem[] = [
  { id: 1, quote_id: 1, product_id: 3, description: 'Schneider NSX100F Circuit Breaker', quantity: 4, unit_price: 1125.00, total: 4500.00, product: mockProducts[2] },
  { id: 2, quote_id: 2, product_id: 8, description: 'Schneider XMLK Pressure Switch', quantity: 2, unit_price: 625.00, total: 1250.00, product: mockProducts[7] },
  { id: 3, quote_id: 3, product_id: 1, description: 'SIMATIC S7-1500 CPU 1515-2', quantity: 1, unit_price: 8200.00, total: 8200.00, product: mockProducts[0] },
];

// ── Mock Invoices ──────────────────────────────────────

export const mockInvoices: Invoice[] = [
  { id: 1, quote_id: 1, customer_id: 3, status: 'draft', subtotal: 4500.00, vat_rate: 5, vat_amount: 225.00, total: 4725.00, due_date: '2026-05-18T23:59:59Z', notes: 'Payment via bank transfer', created_at: '2026-04-19T10:00:00Z', customer: mockCustomers[2] },
  { id: 2, quote_id: null, customer_id: 1, status: 'paid', subtotal: 3200.00, vat_rate: 5, vat_amount: 160.00, total: 3360.00, due_date: '2026-04-10T23:59:59Z', paid_at: '2026-04-05T14:20:00Z', created_at: '2026-03-10T09:30:00Z', customer: mockCustomers[0] },
];

export const mockInvoiceItems: InvoiceItem[] = [
  { id: 1, invoice_id: 1, product_id: 3, description: 'Schneider NSX100F Circuit Breaker', quantity: 4, unit_price: 1125.00, total: 4500.00, product: mockProducts[2] },
  { id: 2, invoice_id: 2, product_id: 2, description: 'ABB ACS580 General Purpose Drive', quantity: 1, unit_price: 3200.00, total: 3200.00, product: mockProducts[1] },
];

// ── Mock Chat Data ──────────────────────────────────────

export const mockChatRooms: ChatRoom[] = [
  {
    id: 1,
    customer_id: 1,
    last_message: 'Is the quote ready?',
    last_message_at: '2024-03-20T10:30:00Z',
    unread_count: 2,
    customer: mockCustomers[0],
    created_at: '2024-03-15T09:00:00Z',
    updated_at: '2024-03-20T10:30:00Z',
  },
  {
    id: 2,
    customer_id: 3,
    last_message: 'Thank you for the delivery!',
    last_message_at: '2024-03-21T15:45:00Z',
    unread_count: 0,
    customer: mockCustomers[2],
    created_at: '2024-03-16T11:00:00Z',
    updated_at: '2024-03-21T15:45:00Z',
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 1,
    chat_room_id: 1,
    sender_type: 'customer',
    message: 'Hello, I have an enquiry about the Cisco switches.',
    is_read: true,
    created_at: '2024-03-20T10:00:00Z',
  },
  {
    id: 2,
    chat_room_id: 1,
    sender_type: 'user',
    sender_id: 1,
    message: 'Hello! Sure, I can help with that. Which model are you interested in?',
    is_read: true,
    created_at: '2024-03-20T10:05:00Z',
  },
  {
    id: 3,
    chat_room_id: 1,
    sender_type: 'customer',
    message: 'The WS-C2960X-24PS-L. I need 10 units.',
    is_read: true,
    created_at: '2024-03-20T10:10:00Z',
  },
  {
    id: 4,
    chat_room_id: 2,
    sender_type: 'customer',
    message: 'Thank you for the delivery!',
    is_read: true,
    created_at: '2024-03-21T15:45:00Z',
  },
];
