import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Medidor, PageResponse, ApiResponse } from '../interfaces';

/**
 * Servicio para validar medidores contra el backend
 */
@Injectable({
  providedIn: 'root'
})
export class MedidoresService {
  private http = inject(HttpClient);

  /**
   * Busca un medidor por su codigo
   * @returns El medidor encontrado o null con mensaje descriptivo
   */
  async buscarPorCodigo(codigo: string): Promise<{ medidor: Medidor | null; mensaje: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<PageResponse<Medidor>>>(`${environment.apiUrl}/medidores/buscar`, {
          page: 0,
          size: 1,
          filtros: { codigo }
        })
      );

      if (!response.success || !response.data) {
        return {
          medidor: null,
          mensaje: response.message || 'Error al buscar medidor'
        };
      }

      if (response.data.totalElements === 0) {
        return {
          medidor: null,
          mensaje: 'Medidor no encontrado'
        };
      }

      const medidor = response.data.content[0];

      if (medidor.estado !== 'ACTIVO') {
        return {
          medidor,
          mensaje: `Medidor no activo. Estado: ${medidor.estado}`
        };
      }

      return {
        medidor,
        mensaje: 'Medidor encontrado'
      };
    } catch (error: any) {
      console.error('Error al buscar medidor:', error);
      const mensaje = error?.error?.message || 'Error al buscar medidor. Verifique su conexion.';
      throw new Error(mensaje);
    }
  }

  /**
   * Valida si un medidor existe y esta activo
   */
  async validarMedidor(codigo: string): Promise<boolean> {
    const result = await this.buscarPorCodigo(codigo);
    return result.medidor !== null && result.medidor.estado === 'ACTIVO';
  }

  /**
   * Obtiene el nombre completo del propietario del medidor
   */
  getNombreCompleto(medidor: Medidor): string {
    return `${medidor.personaNombre} ${medidor.personaApellido}`.trim();
  }
}
