export type Role = 'NORMAL_USER' | 'STORE_OWNER' | 'SYSTEM_ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  address: string;
  role: Role;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Store {
  id: number;
  name: string;
  email: string;
  address: string;
  average_rating: string | number;
  total_ratings: number;
  created_at: string;
  owner_name: string | null;
  user_rating?: number | null; // only present for NORMAL_USER
}

export interface MyRating {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  store_id: number;
  store_name: string;
  store_address: string;
  store_average_rating: string | number;
}