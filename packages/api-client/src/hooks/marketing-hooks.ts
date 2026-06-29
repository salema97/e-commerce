import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  MarketingPlacement,
  CreateMarketingPlacementDto,
  UpdateMarketingPlacementDto,
  ActivePlacementsResponse,
  ActiveMarketingPlatform,
  AdminMarketingPlacementsQuery,
} from '@repo/shared-types';
import type { ApiClient } from '../client.js';
import { queryKeys } from '../query-keys.js';

export function createMarketingHooks(client: ApiClient) {
  return {
    useActiveMarketingPlacements: (
      platform: ActiveMarketingPlatform,
      options?: Omit<
        UseQueryOptions<ActivePlacementsResponse, Error>,
        'queryKey' | 'queryFn'
      >,
    ) =>
      useQuery({
        queryKey: queryKeys.marketingPlacementsActive(platform),
        queryFn: () => client.marketing.getActivePlacements(platform),
        staleTime: 60 * 1000,
        ...options,
      }),

    useAdminMarketingPlacements: (
      filters?: AdminMarketingPlacementsQuery,
      options?: Omit<UseQueryOptions<MarketingPlacement[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.adminMarketingPlacements(filters),
        queryFn: () => client.marketing.listPlacementsAdmin(filters),
        ...options,
      }),

    useCreateMarketingPlacement: (
      options?: UseMutationOptions<MarketingPlacement, Error, CreateMarketingPlacementDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.marketing.createPlacement(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['marketing', 'placements'] });
        },
        ...options,
      });
    },

    useUpdateMarketingPlacement: (
      options?: UseMutationOptions<
        MarketingPlacement,
        Error,
        { id: string; data: UpdateMarketingPlacementDto }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.marketing.updatePlacement(id, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['marketing', 'placements'] });
        },
        ...options,
      });
    },

    useDeleteMarketingPlacement: (
      options?: UseMutationOptions<MarketingPlacement, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id) => client.marketing.deletePlacement(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['marketing', 'placements'] });
        },
        ...options,
      });
    },
  };
}
