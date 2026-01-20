export interface Medidor {
  idMedidor: number;
  codigo: string;
  marca: string;
  modelo: string;
  estado: EstadoMedidor;
  fechaInstalacion: string;
  fechaCreacion: string;
  personaCedula: string;
  personaNombre: string;
  personaApellido: string;
}

export type EstadoMedidor = 'NUEVO' | 'ACTIVO' | 'INACTIVO' | 'AVERIADO' | 'REEMPLAZADO' | 'RETIRADO';

export interface BuscarMedidorRequest {
  page: number;
  size: number;
  filtros: {
    codigo?: string;
  };
}

export interface BuscarMedidorResponse {
  success: boolean;
  message: string;
  data: {
    content: Medidor[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
