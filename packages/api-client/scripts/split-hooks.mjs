import fs from 'node:fs';
import path from 'node:path';

const DOMAIN_HOOKS = {
  auth: ['useMe'],
  catalog: [
    'useCategories',
    'useCategory',
    'useCreateCategory',
    'useUpdateCategory',
    'useProducts',
    'useProduct',
    'useProductBySlug',
    'useCreateProduct',
    'useUpdateProduct',
  ],
  commerce: [
    'useOrders',
    'useOrder',
    'useCreateOrder',
    'useUpdateOrderStatus',
    'useCreatePaymentIntent',
    'useCart',
    'useAddCartItem',
    'useUpdateCartItem',
    'useRemoveCartItem',
  ],
  admin: [
    'useUsers',
    'useSuppliers',
    'useCreateSupplier',
    'useUpdateSupplier',
    'useInventory',
    'useCreateInventory',
    'useUpdateInventory',
  ],
  invoices: [
    'useIssueInvoice',
    'useInvoices',
    'useInvoice',
    'useRetryInvoice',
    'useCreditNotes',
    'useCreditNote',
    'useRetryCreditNote',
  ],
  payments: [
    'useCreateRefund',
    'useApproveRefund',
    'useListRefunds',
    'useGenerateReceipt',
    'useGetReceipt',
  ],
  returns: [
    'useReturns',
    'useReturn',
    'useCreateReturnRequest',
    'useCreateGuestReturnRequest',
    'useUpdateReturnStatus',
    'useResolveReturn',
    'useMyStoreCredit',
  ],
  support: [
    'useConversations',
    'useConversation',
    'useUpdateConversation',
    'useMessages',
    'useCreateMessage',
    'useQuickReplies',
  ],
  finance: [
    'useFinanceIncomes',
    'useCreateFinanceIncome',
    'useNotificationPreferences',
    'useUpdateNotificationPreferences',
    'useFinanceExpenseCategories',
    'useCreateFinanceExpenseCategory',
    'useFinanceExpenses',
    'useCreateFinanceExpense',
    'useFinanceCashFlow',
    'useFinanceStoreCredits',
    'useSubscribeBackInStock',
  ],
  discovery: [
    'useProductSearch',
    'useCatalog',
    'useCreateChatSession',
    'useChatMessages',
    'useSendChatMessage',
  ],
  content: [
    'useProductContentDraft',
    'useGenerateProductContent',
    'useApproveProductContent',
    'useRejectProductContent',
    'usePublishedFaqs',
    'useAdminFaqs',
    'useCreateFaq',
    'useUpdateFaq',
    'useDeleteFaq',
    'useCmsPageBySlug',
    'useAdminCmsPages',
    'useCreateCmsPage',
    'useUpdateCmsPage',
    'useDeleteCmsPage',
  ],
  ops: [
    'useMarketingPromotions',
    'useDistributePromo',
    'useUploadExpenseReceipt',
    'useRegisterPushToken',
    'useRemovePushToken',
  ],
  marketing: [
    'useActiveMarketingPlacements',
    'useAdminMarketingPlacements',
    'useCreateMarketingPlacement',
    'useUpdateMarketingPlacement',
    'useDeleteMarketingPlacement',
  ],
  promotions: [
    'usePromotions',
    'usePromotion',
    'useCreatePromotion',
    'useUpdatePromotion',
    'useDeletePromotion',
    'useCreatePromotionCoupon',
    'useUpdatePromotionCoupon',
    'useDeletePromotionCoupon',
    'useCreatePromotionDiscountRule',
    'useUpdatePromotionDiscountRule',
    'useDeletePromotionDiscountRule',
  ],
  analytics: ['useAnalyticsOverview', 'useAnalyticsFunnel', 'useAnalyticsCohorts'],
  reviews: [
    'useProductReviews',
    'useProductReviewSummary',
    'useCreateProductReview',
    'usePendingReviews',
    'useModerateReview',
  ],
  engagement: [
    'useLoyaltyAccount',
    'useLoyaltyTransactions',
    'useLoyaltyRedemptionQuote',
    'useReferralCode',
    'useReferralPerformance',
  ],
  platform: [
    'useCompanies',
    'useMyCompany',
    'useQuotes',
    'useQuote',
    'useMarketplaceChannels',
    'useMarketplaceListings',
    'useAccountingProviders',
    'useAccountingSyncRecords',
    'useCreateCompany',
    'useUpdateQuoteStatus',
    'useConvertQuote',
    'useSyncMarketplaceProduct',
    'useImportMarketplaceOrder',
    'useSyncAccountingInvoice',
    'useMarketplaceFeeReconciliations',
    'useSyncMarketplaceFee',
    'usePrivacyExport',
    'usePrivacyDelete',
    'useCcpaOptOut',
  ],
};

const hookToDomain = new Map();
for (const [domain, hooks] of Object.entries(DOMAIN_HOOKS)) {
  for (const hook of hooks) {
    hookToDomain.set(hook, domain);
  }
}

const src = fs.readFileSync('src/hooks.ts', 'utf8');
const lines = src.split(/\r?\n/);

const headerEnd = lines.findIndex((l) => l.startsWith('export const queryKeys'));
const queryKeysEnd = lines.findIndex((l) => l.startsWith('export function createQueryHooks'));
const queryKeysBlock = lines.slice(headerEnd, queryKeysEnd).join('\n');
const bodyLines = lines.slice(queryKeysEnd + 1);
const bodyStart = bodyLines.findIndex((l) => l.trim() === 'return {');
const bodyEnd = bodyLines.lastIndexOf('  };');
const hookLines = bodyLines.slice(bodyStart + 1, bodyEnd);

const blocks = [];
let current = [];
for (const line of hookLines) {
  if (/^    use[A-Z]\w*:/.test(line) && current.length > 0) {
    blocks.push(current.join('\n'));
    current = [line];
  } else {
    current.push(line);
  }
}
if (current.length > 0) {
  blocks.push(current.join('\n'));
}

const domainChunks = new Map();
for (const block of blocks) {
  const match = block.match(/^    (use[A-Z]\w*):/);
  if (!match) continue;
  const hookName = match[1];
  const domain = hookToDomain.get(hookName);
  if (!domain) {
    throw new Error(`Unmapped hook: ${hookName}`);
  }
  const existing = domainChunks.get(domain) ?? '';
  domainChunks.set(domain, existing ? `${existing}\n\n${block}` : block);
}

const typeImports = lines
  .slice(7, headerEnd)
  .filter((line) => !line.includes('ApiClient'))
  .join('\n')
  .trimEnd();

const sharedImports = `import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
${typeImports}
import type { ApiClient } from '../client.js';
import { queryKeys } from '../query-keys.js';
`;

fs.mkdirSync('src/hooks', { recursive: true });
fs.writeFileSync('src/query-keys.ts', `${queryKeysBlock}\n`);

for (const [domain, chunk] of domainChunks.entries()) {
  const fnName = `create${domain.charAt(0).toUpperCase()}${domain.slice(1)}Hooks`;
  const content = `${sharedImports}

export function ${fnName}(client: ApiClient) {
  return {
${chunk}
  };
}
`;
  fs.writeFileSync(path.join('src/hooks', `${domain}-hooks.ts`), content);
}

const domainNames = [...domainChunks.keys()];
const imports = domainNames
  .map((name) => {
    const fn = `create${name.charAt(0).toUpperCase()}${name.slice(1)}Hooks`;
    return `import { ${fn} } from './hooks/${name}-hooks.js';`;
  })
  .join('\n');

const merges = domainNames
  .map((name) => {
    const fn = `create${name.charAt(0).toUpperCase()}${name.slice(1)}Hooks`;
    return `    ...${fn}(client),`;
  })
  .join('\n');

const index = `${imports}
import type { ApiClient } from './client.js';

export { queryKeys } from './query-keys.js';

export function createQueryHooks(client: ApiClient) {
  return {
${merges}
  };
}

export type ApiQueryHooks = ReturnType<typeof createQueryHooks>;
`;

fs.writeFileSync('src/hooks.ts', index);
console.log(`Split ${blocks.length} hooks into ${domainNames.length} modules`);
