import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'ecommerce-wishlist';

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

interface WishlistContextValue {
  items: WishlistItem[];
  isLoading: boolean;
  addItem: (item: WishlistItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

async function readItems(): Promise<WishlistItem[]> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WishlistItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeItems(items: WishlistItem[]): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(items));
}

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void readItems().then((stored) => {
      setItems(stored);
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (next: WishlistItem[]) => {
    setItems(next);
    await writeItems(next);
  }, []);

  const addItem = useCallback(
    async (item: WishlistItem) => {
      if (items.some((entry) => entry.productId === item.productId)) {
        return;
      }
      await persist([...items, item]);
    },
    [items, persist],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      await persist(items.filter((entry) => entry.productId !== productId));
    },
    [items, persist],
  );

  const isInWishlist = useCallback(
    (productId: string) => items.some((entry) => entry.productId === productId),
    [items],
  );

  const value = useMemo(
    () => ({ items, isLoading, addItem, removeItem, isInWishlist }),
    [items, isLoading, addItem, removeItem, isInWishlist],
  );

  return React.createElement(WishlistContext.Provider, { value }, children);
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
