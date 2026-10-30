import type { Role } from './index';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  address: string;
  role: Role;
  created_at: string;
  store_rating: string | number | null; // only for store owners
  store_name: string | null;            // only for store owners
}

export interface AdminStore {
  id: number;
  name: string;
  email: string;
  address: string;
  average_rating: string | number;
  total_ratings: number;
  created_at: string;
  owner: {
    id: number | null;
    name: string | null;
    email: string | null;
  };
}

export interface StoreOwner {
  id: number;
  name: string;
  email: string;
  address: string;
}