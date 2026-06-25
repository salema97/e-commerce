'use client';

import Link from 'next/link';
import { m, useReducedMotion } from 'motion/react';
import { formatPrice, orderStatusLabel } from '@repo/shared-utils';
import type { Order, OrderStatus } from '@repo/shared-types';
import { Badge } from '@/components/ui/badge';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import {
  fadeUpVariants,
  kanbanCardVariants,
  kanbanColumnVariants,
  reducedMotionTransition,
} from '@/lib/neo-motion';

interface OrdersKanbanProps {
  orders: Order[];
  totalRevenue: number;
}

const columns: {
  id: string;
  title: string;
  subtitle: string;
  headerClass: string;
  statuses: OrderStatus[];
  sticker?: string;
}[] = [
  {
    id: 'new',
    title: 'Nuevos',
    subtitle: 'Pendientes de pago',
    headerClass: 'bg-neo-gold',
    statuses: ['PENDING', 'PAYMENT_PENDING', 'PAYMENT_FAILED'],
    sticker: 'RECIENTES',
  },
  {
    id: 'processing',
    title: 'Proceso',
    subtitle: 'Preparación y empaque',
    headerClass: 'bg-neo-onyx text-white',
    statuses: ['PROCESSING'],
  },
  {
    id: 'shipped',
    title: 'Enviados',
    subtitle: 'En tránsito',
    headerClass: 'bg-white',
    statuses: ['SHIPPED'],
  },
  {
    id: 'done',
    title: 'Entregados',
    subtitle: 'Completados',
    headerClass: 'bg-neo-green text-white',
    statuses: ['DELIVERED'],
  },
  {
    id: 'closed',
    title: 'Cerrados',
    subtitle: 'Cancelados / reembolsos',
    headerClass: 'bg-neo-scarlet text-white',
    statuses: ['CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
  },
];

export function OrdersKanban({ orders, totalRevenue }: OrdersKanbanProps) {
  const prefersReducedMotion = useReducedMotion();
  const activeCount = orders.filter((o) =>
    ['PENDING', 'PAYMENT_PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status),
  ).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-10">
      <m.div
        variants={fadeUpVariants}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate={prefersReducedMotion ? undefined : 'visible'}
        transition={prefersReducedMotion ? reducedMotionTransition : undefined}
      >
        <AdminPageHeader
          title="Pedidos"
          subtitle="Operaciones / cumplimiento"
          metrics={[
            { label: 'Ingresos (muestra)', value: formatPrice(totalRevenue) },
            { label: 'Pedidos activos', value: String(activeCount), accent: true },
          ]}
        />
      </m.div>

      <div className="kanban-scroll">
        {columns.map((column, columnIndex) => {
          const columnOrders = orders.filter((order) => column.statuses.includes(order.status));

          return (
            <m.section
              key={column.id}
              className="kanban-col"
              custom={columnIndex}
              variants={kanbanColumnVariants}
              initial={prefersReducedMotion ? false : 'hidden'}
              whileInView={prefersReducedMotion ? undefined : 'visible'}
              viewport={{ once: true, amount: 0.3 }}
              transition={prefersReducedMotion ? reducedMotionTransition : undefined}
            >
              <div
                className={`relative mb-8 border-[4px] border-neo-onyx p-5 shadow-[8px_8px_0_0_#111111] ${column.headerClass}`}
              >
                {column.sticker ? (
                  <div className="absolute -top-4 -right-2 rotate-12 border-[3px] border-neo-onyx bg-neo-scarlet px-3 py-1 font-anton text-lg text-white shadow-[3px_3px_0_#111]">
                    {column.sticker}
                  </div>
                ) : null}
                <h2 className="font-anton text-4xl uppercase leading-none">{column.title}</h2>
                <p className="mt-2 text-xs font-black uppercase tracking-widest opacity-80">
                  {columnOrders.length} pedidos · {column.subtitle}
                </p>
              </div>

              <div className="flex flex-col gap-6">
                {columnOrders.length === 0 ? (
                  <div className="dashed-box border-[3px] border-dashed border-neo-onyx p-8 text-center text-sm font-bold uppercase text-muted-foreground">
                    Sin pedidos
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <m.div
                      key={order.id}
                      variants={kanbanCardVariants}
                      initial={prefersReducedMotion ? false : 'hidden'}
                      whileInView={prefersReducedMotion ? undefined : 'visible'}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={prefersReducedMotion ? reducedMotionTransition : undefined}
                    >
                      <OrderKanbanCard order={order} />
                    </m.div>
                  ))
                )}
              </div>
            </m.section>
          );
        })}
      </div>
    </div>
  );
}

function OrderKanbanCard({ order }: { order: Order }) {
  const prefersReducedMotion = useReducedMotion();
  const firstItem = order.items?.[0];
  const itemSummary =
    order.items && order.items.length > 1
      ? `${firstItem?.name ?? 'Producto'} +${order.items.length - 1} más`
      : (firstItem?.name ?? 'Pedido');

  return (
    <m.div
      whileHover={
        prefersReducedMotion
          ? undefined
          : { x: -4, y: -4, boxShadow: '12px 12px 0 0 #111111' }
      }
      transition={{ duration: 0.15 }}
    >
      <Link href={`/admin/orders/${order.id}`} className="brutalist-card block p-5">
        <div className="mb-4 flex items-start justify-between gap-2">
          <span className="bg-neo-onyx px-3 py-1 font-mono text-xs font-bold text-neo-gold">
            {order.orderNumber}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {orderStatusLabel(order.status)}
          </Badge>
        </div>

        <div className="flex gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border-[4px] border-neo-onyx bg-neo-lace shadow-[4px_4px_0_#111]">
            <span className="font-anton text-2xl">#</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-anton text-xl uppercase leading-none">
              {order.customerEmail ?? 'Cliente'}
            </h3>
            <p className="mt-2 text-xs font-bold italic leading-relaxed text-muted-foreground">
              {itemSummary}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t-[3px] border-neo-onyx pt-4">
          <span className="font-anton text-2xl">{formatPrice(order.total)}</span>
        </div>
      </Link>
    </m.div>
  );
}
