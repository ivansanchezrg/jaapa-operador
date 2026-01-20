import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Medidor, BuscarMedidorResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class MedidoresService {
  private http = inject(HttpClient);

  async buscarPorCodigo(codigo: string): Promise<{ medidor: Medidor | null; mensaje: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<BuscarMedidorResponse>(`${environment.apiUrl}/medidores/buscar`, {
          page: 0,
          size: 1,
          filtros: { codigo }
        })
      );

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
    } catch (error) {
      console.error('Error buscando medidor:', error);
      throw new Error('Error al buscar medidor. Verifique su conexión.');
    }
  }

  async validarMedidor(codigo: string): Promise<boolean> {
    const result = await this.buscarPorCodigo(codigo);
    return result.medidor !== null && result.medidor.estado === 'ACTIVO';
  }

  getNombreCompleto(medidor: Medidor): string {
    return `${medidor.personaNombre} ${medidor.personaApellido}`.trim();
  }
}
