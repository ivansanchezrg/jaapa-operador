export interface Lectura {
  id?: number;
  codigoMedidor: string;
  lectura: number;
  observacion: string;
  fechaHora: string;
  cedulaOperador: string;
  sincronizado: boolean;
}

export interface LecturaDTO {
  codigoMedidor: string;
  lectura: number;
  observacion: string;
  fechaHora: string;
  cedulaOperador: string;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  reintentar?: boolean;
}
