import { getServerApiClient } from '@/lib/api';
import { GiftCardsView } from './gift-cards-view';

export default async function GiftCardsPage() {
  const api = await getServerApiClient();
  const giftCards = await api.finance.giftCards.findAll().catch(() => []);

  return <GiftCardsView initialGiftCards={giftCards} />;
}
