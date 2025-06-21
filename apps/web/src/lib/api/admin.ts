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

export interface ReportForAdmin {
  id: string;
  reporterId: string;
  type: 'USER' | 'PRODUCT' | 'MESSAGE';
  targetUserId?: string;
  targetProductId?: string;
  targetMessageId?: string;
  reason: string;
  comment?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
  resolvedById?: string;
  ipAddress?: string;
  reporterData: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  targetData?: {
    user?: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      createdAt: string;
      isActive: boolean;
    };
    product?: {
      id: string;
      title: string;
      description: string;
      price: number;
      currency: string;
      location: string;
      isActive: boolean;
      visible: boolean;
      owner: {
        username: string;
        firstName: string;
        lastName: string;
      };
    };
    message?: {
      id: string;
      content: string;
      createdAt: string;
      sender: {
        username: string;
        firstName: string;
        lastName: string;
      };
      conversationParticipants: {
        username: string;
        firstName: string;
        lastName: string;
      }[];
    };
  };
  resolvedByData?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
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
  }, // Report management
  async getAllReports(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    reporterUsername?: string;
    reporterId?: string;
    targetUsername?: string;
    targetId?: string;
    reason?: string;
    dateFrom?: string;
    dateTo?: string;
    ipAddress?: string;
    resolvedBy?: string;
  }): Promise<ReportForAdmin[]> {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.reporterUsername)
      params.append('reporterUsername', filters.reporterUsername);
    if (filters?.reporterId) params.append('reporterId', filters.reporterId);
    if (filters?.targetUsername)
      params.append('targetUsername', filters.targetUsername);
    if (filters?.targetId) params.append('targetId', filters.targetId);
    if (filters?.reason) params.append('reason', filters.reason);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.ipAddress) params.append('ipAddress', filters.ipAddress);
    if (filters?.resolvedBy) params.append('resolvedBy', filters.resolvedBy);

    const queryString = params.toString();
    const url = `/reports${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.request<{
      reports: ReportForAdmin[];
      total: number;
      pages: number;
    }>(url);

    return response.reports || [];
  },

  async exportReportsJson(filters?: {
    status?: string;
    type?: string;
    reporterUsername?: string;
    reporterId?: string;
    targetUsername?: string;
    targetId?: string;
    reason?: string;
    dateFrom?: string;
    dateTo?: string;
    ipAddress?: string;
    resolvedBy?: string;
  }): Promise<{
    data: ReportForAdmin[];
    exportedAt: string;
    totalRecords: number;
  }> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.reporterUsername)
      params.append('reporterUsername', filters.reporterUsername);
    if (filters?.reporterId) params.append('reporterId', filters.reporterId);
    if (filters?.targetUsername)
      params.append('targetUsername', filters.targetUsername);
    if (filters?.targetId) params.append('targetId', filters.targetId);
    if (filters?.reason) params.append('reason', filters.reason);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.ipAddress) params.append('ipAddress', filters.ipAddress);
    if (filters?.resolvedBy) params.append('resolvedBy', filters.resolvedBy);

    const queryString = params.toString();
    const url = `/reports/export/json${queryString ? `?${queryString}` : ''}`;

    return apiClient.request<{
      data: ReportForAdmin[];
      exportedAt: string;
      totalRecords: number;
    }>(url);
  },

  async exportReportsHtml(filters?: {
    status?: string;
    type?: string;
    reporterUsername?: string;
    reporterId?: string;
    targetUsername?: string;
    targetId?: string;
    reason?: string;
    dateFrom?: string;
    dateTo?: string;
    ipAddress?: string;
    resolvedBy?: string;
  }): Promise<{ html: string; exportedAt: string; totalRecords: number }> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.reporterUsername)
      params.append('reporterUsername', filters.reporterUsername);
    if (filters?.reporterId) params.append('reporterId', filters.reporterId);
    if (filters?.targetUsername)
      params.append('targetUsername', filters.targetUsername);
    if (filters?.targetId) params.append('targetId', filters.targetId);
    if (filters?.reason) params.append('reason', filters.reason);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.ipAddress) params.append('ipAddress', filters.ipAddress);
    if (filters?.resolvedBy) params.append('resolvedBy', filters.resolvedBy);

    const queryString = params.toString();
    const url = `/reports/export/html${queryString ? `?${queryString}` : ''}`;

    return apiClient.request<{
      html: string;
      exportedAt: string;
      totalRecords: number;
    }>(url);
  },

  async exportSingleReportJson(
    reportId: string
  ): Promise<{ data: ReportForAdmin; exportedAt: string }> {
    return apiClient.request<{ data: ReportForAdmin; exportedAt: string }>(
      `/reports/${reportId}/export/json`
    );
  },

  async exportSingleReportHtml(
    reportId: string
  ): Promise<{ html: string; exportedAt: string }> {
    return apiClient.request<{ html: string; exportedAt: string }>(
      `/reports/${reportId}/export/html`
    );
  },
  async resolveReport(reportId: string): Promise<{ message: string }> {
    return apiClient.request<{ message: string }>(
      `/reports/${reportId}/resolve`,
      {
        method: 'PATCH',
      }
    );
  },

  async setReportUnderReview(reportId: string): Promise<{ message: string }> {
    return apiClient.request<{ message: string }>(
      `/reports/${reportId}/under-review`,
      {
        method: 'PATCH',
      }
    );
  },

  async dismissReport(reportId: string): Promise<{ message: string }> {
    return apiClient.request<{ message: string }>(
      `/reports/${reportId}/dismiss`,
      {
        method: 'PATCH',
      }
    );
  },
};
