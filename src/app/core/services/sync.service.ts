import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DatabaseService } from './database.service';
import { NetworkService } from './network.service';
import { Lectura, LecturaDTO, SyncResult } from '../interfaces';

interface SyncProgress {
  total: number;
  sincronizadas: number;
  fallidas: number;
  enProceso: boolean;
}

const ERRORES_NO_REINTENTABLES = [
  'Medidor no encontrado',
  'El medidor no esta activo',
  'Operador no autorizado',
  'no puede ser menor'
];

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private http = inject(HttpClient);
  private databaseService = inject(DatabaseService);
  private networkService = inject(NetworkService);

  private syncInProgress = false;

  async sincronizarTodas(): Promise<SyncProgress> {
    if (this.syncInProgress) {
      return { total: 0, sincronizadas: 0, fallidas: 0, enProceso: true };
    }

    if (!this.networkService.isOnline) {
      return { total: 0, sincronizadas: 0, fallidas: 0, enProceso: false };
    }

    this.syncInProgress = true;
    const pendientes = await this.databaseService.obtenerLecturasPendientes();
    const progress: SyncProgress = {
      total: pendientes.length,
      sincronizadas: 0,
      fallidas: 0,
      enProceso: true
    };

    for (const lectura of pendientes) {
      const result = await this.sincronizarLectura(lectura);
      if (result.success) {
        progress.sincronizadas++;
      } else {
        progress.fallidas++;
      }
    }

    this.syncInProgress = false;
    progress.enProceso = false;

    return progress;
  }

  async sincronizarLectura(lectura: Lectura): Promise<SyncResult> {
    if (!lectura.id) {
      return { success: false, error: 'Lectura sin ID', reintentar: false };
    }

    try {
      const dto: LecturaDTO = {
        codigoMedidor: lectura.codigoMedidor,
        lectura: lectura.lectura,
        observacion: lectura.observacion,
        fechaHora: lectura.fechaHora,
        cedulaOperador: lectura.cedulaOperador
      };

      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/lecturas`, dto)
      );

      await this.databaseService.marcarComoSincronizada(lectura.id);

      return { success: true };
    } catch (error: any) {
      const mensaje = this.parseErrorMessage(error);
      const reintentar = !this.esErrorFinal(mensaje);

      console.error(`Error sincronizando lectura ${lectura.id}:`, mensaje);

      return {
        success: false,
        error: mensaje,
        reintentar
      };
    }
  }

  async guardarYSincronizar(lectura: Omit<Lectura, 'id'>): Promise<{ id: number; sincronizado: boolean; error?: string }> {
    // Siempre guardar localmente primero
    const id = await this.databaseService.insertarLectura(lectura);

    // Intentar sincronizar si hay conexión
    if (this.networkService.isOnline) {
      const lecturaCompleta: Lectura = { ...lectura, id };
      const result = await this.sincronizarLectura(lecturaCompleta);

      return {
        id,
        sincronizado: result.success,
        error: result.error
      };
    }

    return { id, sincronizado: false };
  }

  private parseErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Error desconocido';
  }

  private esErrorFinal(mensaje: string): boolean {
    return ERRORES_NO_REINTENTABLES.some(e =>
      mensaje.toLowerCase().includes(e.toLowerCase())
    );
  }
}
