/**
 * Interfaces de autenticacion
 */

export interface LoginRequest {
  cedula: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userInfo: UserInfo;
}

export interface UserInfo {
  idPersona?: number;
  cedula?: string;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
  roles: string[];
  email?: string;
  estado?: string;
  ultimoAcceso?: string;
}

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  userInfo: UserInfo;
  expiresAt: number;
}
