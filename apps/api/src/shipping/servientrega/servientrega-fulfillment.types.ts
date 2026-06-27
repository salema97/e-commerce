export interface ServientregaSoapAuth {
  login: string;
  password: string;
  billingCode: string;
  loadName: string;
}

export interface ServientregaEnvioExterno {
  Num_Guia?: number;
  Num_Alto?: number;
  Num_Ancho?: number;
  Num_Largo?: number;
  Num_PesoTotal?: number;
  Num_ValorDeclaradoTotal?: number;
  Nom_Contacto?: string;
  Des_Direccion?: string;
  Des_Ciudad?: string;
  Des_DepartamentoDestino?: string;
  Des_Telefono?: string;
  Num_Piezas?: number;
  Des_IdArchivoOrigen?: string;
  Ide_Num_Referencia_Dest?: string;
  Ide_CodigoCiudadDestino?: number;
  Ide_CodigoCiudadOrigen?: number;
  Ide_CodigoPostalDest?: string;
}

export interface ServientregaGuideCreateResult {
  guideNumbers: string[];
  raw: unknown;
}

export interface ServientregaTrackingSnapshot {
  guideNumber: string;
  statusText: string;
  isDelivered: boolean;
  receivedBy?: string;
  movementAt?: string;
  raw: unknown;
}
