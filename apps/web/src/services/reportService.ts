import { apiClient } from '@/lib/api/api-client';

interface SubmitReportRequest {
  type: 'USER' | 'PRODUCT' | 'MESSAGE';
  targetId: string;
  reason: string;
  comment?: string;
}

interface Report {
  id: string;
  reporterId: string;
  type: 'USER' | 'PRODUCT' | 'MESSAGE';
  targetUserId?: string;
  targetProductId?: string;
  targetMessageId?: string;
  reason: string;
  comment?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reporter: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

class ReportService {
  async submitReport(
    data: SubmitReportRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Transform the data to match the expected API format
      const reportData = {
        type: data.type,
        reason: data.reason,
        comment: data.comment,
        ...(data.type === 'USER' && { targetUserId: data.targetId }),
        ...(data.type === 'PRODUCT' && { targetProductId: data.targetId }),
        ...(data.type === 'MESSAGE' && { targetMessageId: data.targetId }),
      };

      const result = await apiClient.request<{
        success: boolean;
        message: string;
      }>('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });

      return result;
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  }
  async getReports(): Promise<Report[]> {
    try {
      const result = await apiClient.request<Report[]>('/reports');
      return result;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }
  async resolveReport(
    reportId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await apiClient.request<{
        success: boolean;
        message: string;
      }>(`/reports/${reportId}/resolve`, {
        method: 'PATCH',
      });

      return result;
    } catch (error) {
      console.error('Error resolving report:', error);
      throw error;
    }
  }
  async dismissReport(
    reportId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await apiClient.request<{
        success: boolean;
        message: string;
      }>(`/reports/${reportId}/dismiss`, {
        method: 'PATCH',
      });

      return result;
    } catch (error) {
      console.error('Error dismissing report:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
export type { SubmitReportRequest, Report };
