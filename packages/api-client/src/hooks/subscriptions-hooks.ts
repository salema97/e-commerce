import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  SubscriptionPlan,
  CreateSubscriptionPlanDto,
  CustomerSubscription,
} from '@repo/shared-types';
import type { ApiClient } from '../client.js';
import { queryKeys } from '../query-keys.js';

export function createSubscriptionsHooks(client: ApiClient) {
  return {
    useSubscriptionPlans: (
      options?: Omit<UseQueryOptions<SubscriptionPlan[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.subscriptionPlans,
        queryFn: () => client.subscriptions.listPlans(),
        ...options,
      }),

    useMySubscriptions: (
      options?: Omit<UseQueryOptions<CustomerSubscription[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.mySubscriptions,
        queryFn: () => client.subscriptions.mine(),
        ...options,
      }),

    useCreateSubscriptionPlan: (
      options?: UseMutationOptions<SubscriptionPlan, Error, CreateSubscriptionPlanDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.subscriptions.createPlan(data),
        onSuccess: () =>
          void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans }),
        ...options,
      });
    },

    useSubscribe: (options?: UseMutationOptions<{ url: string }, Error, string>) =>
      useMutation({
        mutationFn: (planId) => client.subscriptions.subscribe(planId),
        ...options,
      }),

    useSubscriptionPortal: (options?: UseMutationOptions<{ url: string }, Error, void>) =>
      useMutation({
        mutationFn: () => client.subscriptions.portal(),
        ...options,
      }),
  };
}
