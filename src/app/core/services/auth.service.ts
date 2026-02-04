import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, AuthResponse, UserInfo, StoredSession, ApiResponse } from '../interfaces';

const SESSION_KEY = 'jaapa_session';

/**
 * Servicio de autenticacion para operadores
 * Maneja login, logout, sesion y tokens JWT
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private currentUser$ = new BehaviorSubject<UserInfo | null>(null);
  private isAuthenticated$ = new BehaviorSubject<boolean>(false);

  get user$(): Observable<UserInfo | null> {
    return this.currentUser$.asObservable();
  }

  get authenticated$(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticated$.value;
  }

  get currentUser(): UserInfo | null {
    return this.currentUser$.value;
  }

  /**
   * Inicializa el servicio verificando si hay una sesion valida guardada
   */
  async initialize(): Promise<void> {
    const session = await this.getStoredSession();
    if (session && this.isSessionValid(session)) {
      this.currentUser$.next(session.userInfo);
      this.isAuthenticated$.next(true);
    } else {
      await this.clearSession();
    }
  }

  /**
   * Autentica al operador con cedula y password
   * @throws Error si las credenciales son invalidas o el usuario no tiene rol de operador
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const apiResponse = await firstValueFrom(
      this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, credentials)
    );

    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.message || 'Error al iniciar sesion');
    }

    const response = apiResponse.data;

    if (!this.hasOperadorRole(response.userInfo)) {
      throw new Error('Usuario no tiene permisos de operador');
    }

    await this.storeSession(response);
    this.currentUser$.next(response.userInfo);
    this.isAuthenticated$.next(true);

    return response;
  }

  /**
   * Cierra la sesion del operador
   */
  async logout(): Promise<void> {
    await this.clearSession();
    this.currentUser$.next(null);
    this.isAuthenticated$.next(false);
  }

  /**
   * Obtiene el token de acceso actual, renovandolo si es necesario
   */
  async getAccessToken(): Promise<string | null> {
    const session = await this.getStoredSession();
    if (!session) return null;

    if (this.isSessionValid(session)) {
      return session.accessToken;
    }

    try {
      const newSession = await this.refreshToken(session.refreshToken);
      return newSession.accessToken;
    } catch {
      await this.logout();
      return null;
    }
  }

  private async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const apiResponse = await firstValueFrom(
      this.http.post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
    );

    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.message || 'Error al refrescar sesion');
    }

    const response = apiResponse.data;
    await this.storeSession(response);
    this.currentUser$.next(response.userInfo);

    return response;
  }

  private hasOperadorRole(userInfo: UserInfo): boolean {
    if (!userInfo || !userInfo.roles) {
      return false;
    }
    return userInfo.roles.some(role => role === 'OPERADOR' || role === 'ROLE_OPERADOR');
  }

  private isSessionValid(session: StoredSession): boolean {
    return Date.now() < session.expiresAt;
  }

  private async storeSession(response: AuthResponse): Promise<void> {
    const session: StoredSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      userInfo: response.userInfo,
      expiresAt: Date.now() + (response.expiresIn * 1000)
    };

    await Preferences.set({
      key: SESSION_KEY,
      value: JSON.stringify(session)
    });
  }

  private async getStoredSession(): Promise<StoredSession | null> {
    const { value } = await Preferences.get({ key: SESSION_KEY });
    if (!value) return null;

    try {
      return JSON.parse(value) as StoredSession;
    } catch {
      return null;
    }
  }

  private async clearSession(): Promise<void> {
    await Preferences.remove({ key: SESSION_KEY });
  }
}
