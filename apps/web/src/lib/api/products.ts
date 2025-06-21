import { apiClient } from './api-client';

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  location: string;
  slug: string;
  imageUrl?: string;
  userId: string;
  username: string;
  isActive: boolean;
  isSold: boolean;
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  totalReviews?: number;
}

export const productsApi = {
  async getAll(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products');
  },

  async getByUsernameAndSlug(username: string, slug: string): Promise<Product> {
    return apiClient.get<Product>(`/products/@${username}/${slug}`);
  },

  async getMyProducts(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products/user/me');
  },

  async create(productData: FormData): Promise<Product> {
    return apiClient.post<Product>('/products', productData);
  },

  async update(productId: string, productData: any): Promise<Product> {
    return apiClient.put<Product>(`/products/${productId}`, productData);
  },
  async delete(productId: string): Promise<void> {
    return apiClient.delete<void>(`/products/${productId}`);
  },
};
