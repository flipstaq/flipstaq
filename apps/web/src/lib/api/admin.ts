import { apiClient } from './api-client';

export interface ProductForAdmin {
  id: string;
  title: string;
  description?: string;
  category?: string;
  price: number;
  currency: string;
  location: string;
  slug: string;
  imageUrl?: string;
  userId: string;
  username: string;
  isActive: boolean;
  isSold: boolean;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  totalReviews: number;
}

export interface ReviewForAdmin {
  id: string;
  rating: number;
  comment: string;
  productId: string;
  userId: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  product: {
    id: string;
    title: string;
    slug: string;
    user: {
      username: string;
    };
  };
}

export const adminApi = {
  // Product management
  async getAllProducts(): Promise<ProductForAdmin[]> {
    return apiClient.request<ProductForAdmin[]>('/products/admin/all');
  },

  async toggleProductVisibility(
    productId: string
  ): Promise<{ visible: boolean }> {
    return apiClient.request<{ visible: boolean }>(
      `/products/admin/${productId}/visibility`,
      {
        method: 'PATCH',
      }
    );
  },

  async deleteProductPermanently(
    productId: string
  ): Promise<{ message: string }> {
    return apiClient.request<{ message: string }>(
      `/products/admin/${productId}/permanent`,
      {
        method: 'DELETE',
      }
    );
  },
  // Review management
  async getAllReviews(): Promise<ReviewForAdmin[]> {
    return apiClient.request<ReviewForAdmin[]>('/products/reviews/admin/all');
  },

  async getProductReviews(productId: string): Promise<ReviewForAdmin[]> {
    return apiClient.request<ReviewForAdmin[]>(
      `/products/reviews/admin/product/${productId}`
    );
  },

  async toggleReviewVisibility(
    reviewId: string
  ): Promise<{ visible: boolean }> {
    return apiClient.request<{ visible: boolean }>(
      `/products/reviews/admin/${reviewId}/visibility`,
      {
        method: 'PATCH',
      }
    );
  },

  async deleteReviewPermanently(
    reviewId: string
  ): Promise<{ message: string }> {
    return apiClient.request<{ message: string }>(
      `/products/reviews/admin/${reviewId}/permanent`,
      {
        method: 'DELETE',
      }
    );
  },
};
