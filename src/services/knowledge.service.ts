import { api } from '@/lib/api';

export interface AddKnowledgeParams {
  text: string;
  type: string;
}

export const knowledgeService = {
  /**
   * POST /knowledge
   * Add knowledge base entry
   */
  async addKnowledge(data: AddKnowledgeParams): Promise<{ success: boolean; data: any; meta?: { message?: string } }> {
    const response = (await api.post('/knowledge', data)) as {
      success: boolean;
      data: any;
      meta?: { message?: string };
      error?: { message?: string };
    };

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to add knowledge');
    }

    return response;
  },
};
