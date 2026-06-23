import { describe, it, expect } from 'vitest';
import { OrderLookupTool } from './order-lookup.tool.js';

describe('OrderLookupTool', () => {
  const tool = new OrderLookupTool({} as never);

  it('extracts order numbers from text', () => {
    expect(tool.extractOrderNumber('Estado de mi pedido ORD-ABC-123 por favor')).toBe('ORD-ABC-123');
    expect(tool.extractOrderNumber('sin número de pedido')).toBeNull();
  });
});
