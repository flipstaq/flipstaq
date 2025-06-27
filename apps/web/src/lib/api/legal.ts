import { apiClient } from './api-client';

export interface LegalDocument {
  id: string;
  type: string;
  language: string;
  title: string;
  content: string;
  updatedBy?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLegalDocumentDto {
  type: string;
  language: string;
  title: string;
  content: string;
}

export interface UpdateLegalDocumentDto {
  title?: string;
  content?: string;
}

export const legalApi = {
  // Public endpoints
  getDocumentByType: async (
    type: string,
    language: string = 'en'
  ): Promise<LegalDocument> => {
    return await apiClient.get<LegalDocument>(
      `/legal/documents/${type}?language=${language}`
    );
  },

  getDocumentTypes: async (): Promise<string[]> => {
    return await apiClient.get<string[]>('/legal/documents/types');
  },

  getDocumentLanguages: async (type: string): Promise<string[]> => {
    return await apiClient.get<string[]>(
      `/legal/documents/types/${type}/languages`
    );
  },

  // Admin endpoints
  getAllDocuments: async (): Promise<LegalDocument[]> => {
    return await apiClient.get<LegalDocument[]>('/legal/documents');
  },

  getDocumentById: async (id: string): Promise<LegalDocument> => {
    return await apiClient.get<LegalDocument>(`/legal/documents/id/${id}`);
  },

  createDocument: async (
    data: CreateLegalDocumentDto
  ): Promise<LegalDocument> => {
    return await apiClient.post<LegalDocument>('/legal/documents', data);
  },

  updateDocument: async (
    id: string,
    data: UpdateLegalDocumentDto
  ): Promise<LegalDocument> => {
    return await apiClient.put<LegalDocument>(`/legal/documents/${id}`, data);
  },

  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/legal/documents/${id}`);
  },
};
