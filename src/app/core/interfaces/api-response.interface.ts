/**
 * Estructura estandar de respuesta del backend
 * Todas las respuestas del API vienen envueltas en este formato
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  code?: string;
  timestamp?: string;
  errors?: Record<string, string>;
  path?: string;
  status?: number;
}
