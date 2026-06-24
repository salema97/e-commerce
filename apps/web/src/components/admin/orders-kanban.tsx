'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { formatPrice, orderStatusLabel } from '@repo/shared-utils';
import type { Order, OrderStatus } from '@repo/shared-types';
import { Badge } from '@/components/ui/badge';
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
    <div className="flex flex-col gap-10">
      <motion.header
        className="flex flex-col justify-between gap-8 border-b-[8px] border-neo-onyx pb-10 xl:flex-row xl:items-end"
        variants={fadeUpVariants}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate={prefersReducedMotion ? undefined : 'visible'}
        transition={prefersReducedMotion ? reducedMotionTransition : undefined}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="bg-neo-onyx px-3 py-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-neo-gold">
              Panel central
            </span>
            <span className="flex items-center gap-2 text-xs font-black uppercase">
              <span className="h-3 w-3 animate-pulse rounded-full border border-neo-onyx bg-neo-scarlet" />
              Red activa
            </span>
          </div>
          <h1 className="font-anton text-6xl uppercase leading-[0.8] tracking-tighter md:text-8xl">
            Pedidos
          </h1>
          <p className="border-l-8 border-neo-gold pl-6 text-xl font-bold">
            Operaciones / cumplimiento
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="brutalist-card flex min-w-[180px] flex-col justify-between p-5">
            <span className="mb-2 text-xs font-black uppercase text-muted-foreground">
              Ingresos (muestra)
            </span>
            <span className="font-anton text-4xl">{formatPrice(totalRevenue)}</span>
          </div>
          <div className="brutalist-card flex min-w-[180px] flex-col justify-between bg-neo-gold p-5">
            <span className="mb-2 text-xs font-black uppercase">Pedidos activos</span>
            <span className="font-anton text-4xl">{activeCount}</span>
          </div>
        </div>
      </motion.header>

      <div className="kanban-scroll">
        {columns.map((column, columnIndex) => {
          const columnOrders = orders.filter((order) => column.statuses.includes(order.status));

          return (
            <motion.section
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
                    <motion.div
                      key={order.id}
                      variants={kanbanCardVariants}
                      initial={prefersReducedMotion ? false : 'hidden'}
                      whileInView={prefersReducedMotion ? undefined : 'visible'}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={prefersReducedMotion ? reducedMotionTransition : undefined}
                    >
                      <OrderKanbanCard order={order} />
                    </motion.div>
                  ))
                )}
              </div>
            </motion.section>
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
    <motion.div
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
    </motion.div>
  );
}
