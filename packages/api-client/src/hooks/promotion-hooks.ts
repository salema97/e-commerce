import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  Promotion,
  CreatePromotionDto,
  UpdatePromotionDto,
  CreateAdminCouponDto,
  UpdateCouponDto,
  CreateDiscountRuleDto,
  UpdateDiscountRuleDto,
  AdminPromotionsQuery,
  Coupon,
  DiscountRule,
} from '@repo/shared-types';
import type { ApiClient } from '../client.js';
import { queryKeys } from '../query-keys.js';

function invalidatePromotionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  promotionId?: string,
) {
  queryClient.invalidateQueries({ queryKey: ['promotions'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.marketingPromotions });
  if (promotionId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.promotion(promotionId) });
  }
}

export function createPromotionHooks(client: ApiClient) {
  return {
    usePromotions: (
      filters?: AdminPromotionsQuery,
      options?: Omit<UseQueryOptions<Promotion[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.promotions(filters),
        queryFn: () => client.promotions.findAll(filters),
        ...options,
      }),

    usePromotion: (
      id: string,
      options?: Omit<UseQueryOptions<Promotion, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.promotion(id),
        queryFn: () => client.promotions.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),

    useCreatePromotion: (
      options?: UseMutationOptions<Promotion, Error, CreatePromotionDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.promotions.create(data),
        onSuccess: () => invalidatePromotionQueries(queryClient),
        ...options,
      });
    },

    useUpdatePromotion: (
      options?: UseMutationOptions<
        Promotion,
        Error,
        { id: string; data: UpdatePromotionDto }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.promotions.update(id, data),
        onSuccess: (_data, { id }) => invalidatePromotionQueries(queryClient, id),
        ...options,
      });
    },

    useDeletePromotion: (options?: UseMutationOptions<Promotion, Error, string>) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id) => client.promotions.delete(id),
        onSuccess: () => invalidatePromotionQueries(queryClient),
        ...options,
      });
    },

    useCreatePromotionCoupon: (
      options?: UseMutationOptions<
        Coupon,
        Error,
        { promotionId: string; data: CreateAdminCouponDto }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ promotionId, data }) =>
          client.promotions.createCoupon(promotionId, data),
        onSuccess: (_data, { promotionId }) =>
          invalidatePromotionQueries(queryClient, promotionId),
        ...options,
      });
    },

    useUpdatePromotionCoupon: (
      options?: UseMutationOptions<
        Coupon,
        Error,
        { promotionId: string; couponId: string; data: UpdateCouponDto }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ couponId, data }) => client.promotions.updateCoupon(couponId, data),
        onSuccess: (_data, { promotionId }) =>
          invalidatePromotionQueries(queryClient, promotionId),
        ...options,
      });
    },

    useDeletePromotionCoupon: (
      options?: UseMutationOptions<
        Coupon,
        Error,
        { promotionId: string; couponId: string }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ couponId }) => client.promotions.deleteCoupon(couponId),
        onSuccess: (_data, { promotionId }) =>
          invalidatePromotionQueries(queryClient, promotionId),
        ...options,
      });
    },

    useCreatePromotionDiscountRule: (
      options?: UseMutationOptions<
        DiscountRule,
        Error,
        { promotionId: string; data: CreateDiscountRuleDto }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ promotionId, data }) =>
          client.promotions.createDiscountRule(promotionId, data),
        onSuccess: (_data, { promotionId }) =>
          invalidatePromotionQueries(queryClient, promotionId),
        ...options,
      });
    },

    useUpdatePromotionDiscountRule: (
      options?: UseMutationOptions<
        DiscountRule,
        Error,
        { promotionId: string; ruleId: string; data: UpdateDiscountRuleDto }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ ruleId, data }) => client.promotions.updateDiscountRule(ruleId, data),
        onSuccess: (_data, { promotionId }) =>
          invalidatePromotionQueries(queryClient, promotionId),
        ...options,
      });
    },

    useDeletePromotionDiscountRule: (
      options?: UseMutationOptions<
        DiscountRule,
        Error,
        { promotionId: string; ruleId: string }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ ruleId }) => client.promotions.deleteDiscountRule(ruleId),
        onSuccess: (_data, { promotionId }) =>
          invalidatePromotionQueries(queryClient, promotionId),
        ...options,
      });
    },
  };
}
