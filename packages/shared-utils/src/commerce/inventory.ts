import type { Inventory } from '@repo/shared-types';

export function getProductAvailableQuantity(inventory: unknown[] | undefined): number {
  if (!inventory?.length) {
    return 0;
  }

  return (inventory as Inventory[]).reduce((total, row) => {
    const available = row.quantity - row.reservedQuantity;
    return total + Math.max(available, 0);
  }, 0);
}
