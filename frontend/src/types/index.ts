export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
}
// more types as needed
