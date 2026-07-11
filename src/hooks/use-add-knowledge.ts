import { useMutation } from '@tanstack/react-query';
import {
  knowledgeService,
  type AddKnowledgePayload,
} from '@/services/knowledge.service';

export function useAddKnowledge() {
  return useMutation({
    mutationFn: (payload: AddKnowledgePayload) =>
      knowledgeService.addKnowledge(payload),
  });
}
