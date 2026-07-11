import { z } from 'zod';
import { api } from '@/lib/api';

export const knowledgeTypes = ['RULE', 'COMPLIANCE', 'CONVERSATION'] as const;
export type KnowledgeType = (typeof knowledgeTypes)[number];

export interface AddKnowledgePayload {
  text: string;
  type: KnowledgeType;
}

const addKnowledgeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    type: z.enum(knowledgeTypes),
    text: z.string(),
  }),
  meta: z
    .object({ message: z.string().optional() })
    .passthrough()
    .optional(),
});

export type AddKnowledgeResponse = z.infer<typeof addKnowledgeResponseSchema>;

export const knowledgeService = {
  /** POST /knowledge - creates one authenticated knowledge-base rule. */
  async addKnowledge(payload: AddKnowledgePayload): Promise<AddKnowledgeResponse> {
    const text = payload.text.trim();
    if (!text) throw new Error('Knowledge content is required');

    const response = await api.post('/knowledge', {
      text,
      type: payload.type,
    });
    const parsed = addKnowledgeResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The add-knowledge response has an invalid schema');
    }

    return parsed.data;
  },
};
