import type { Order } from '@prisma/client';
import type { ServientregaEnvioExterno } from './servientrega-fulfillment.types.js';
import { parseOrderShippingAddress } from './servientrega-order.util.js';

export interface ServientregaGuideBuildInput {
  order: Pick<Order, 'orderNumber' | 'subtotal' | 'shippingAddress'>;
  destinationCityId: number;
  originCityId: number;
  originContactName: string;
  originStreet: string;
  originCityName: string;
  originProvince?: string;
  originPhone?: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export function buildServientregaEnvioExterno(
  input: ServientregaGuideBuildInput,
): ServientregaEnvioExterno {
  const address = parseOrderShippingAddress(input.order.shippingAddress);
  if (!address) {
    throw new Error('Order is missing a valid shipping address');
  }

  const declaredValue = Math.max(1, Math.round(Number(input.order.subtotal)));
  const weightKg = Math.max(1, Math.round(input.weightKg ?? 1));

  return {
    Num_Guia: 0,
    Num_Alto: Math.max(1, Math.round(input.heightCm ?? 10)),
    Num_Ancho: Math.max(1, Math.round(input.widthCm ?? 15)),
    Num_Largo: Math.max(1, Math.round(input.lengthCm ?? 20)),
    Num_PesoTotal: weightKg,
    Num_ValorDeclaradoTotal: declaredValue,
    Nom_Contacto: address.recipientName,
    Des_Direccion: address.street,
    Des_Ciudad: address.city,
    Des_DepartamentoDestino: address.state ?? address.city,
    Des_Telefono: address.phone ?? '0000000000',
    Num_Piezas: 1,
    Des_IdArchivoOrigen: input.order.orderNumber,
    Ide_Num_Referencia_Dest: input.order.orderNumber,
    Ide_CodigoCiudadDestino: input.destinationCityId,
    Ide_CodigoCiudadOrigen: input.originCityId,
    Ide_CodigoPostalDest: address.zipCode,
  };
}
