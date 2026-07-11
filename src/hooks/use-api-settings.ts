import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  settingsService,
  type UpdateSettingsPayload,
} from '@/services/settings.service';

const settingsQueryKey = ['settings'] as const;

export function useApiSettings() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: settingsQueryKey,
    queryFn: () => settingsService.getSettings(),
    staleTime: 30_000,
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSettingsPayload) =>
      settingsService.updateSettings(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(settingsQueryKey, response);
    },
  });

  return {
    settings: settingsQuery.data?.data ?? null,
    isLoading: settingsQuery.isLoading,
    loadError: settingsQuery.error,
    refetch: settingsQuery.refetch,
    updateSettings: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
  };
}
