import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Lectura } from '../interfaces';

const DB_NAME = 'jaapa_operador';
const STORAGE_KEY = 'jaapa_lecturas';

/**
 * Servicio de base de datos local para almacenar lecturas
 * - En dispositivos moviles (Android/iOS): usa SQLite nativo
 * - En navegador web (desarrollo): usa localStorage como fallback
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite!: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private isReady = false;
  private isWebFallback = false;

  /**
   * Inicializa la base de datos segun la plataforma
   */
  async initializeDatabase(): Promise<void> {
    if (this.isReady) return;

    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      this.isWebFallback = true;
      this.isReady = true;
      return;
    }

    try {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);

      const retCC = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

      if (retCC.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
      } else {
        this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
      }

      await this.db.open();
      await this.createTables();
      this.isReady = true;
    } catch (error) {
      console.error('Error initializing SQLite:', error);
      this.isWebFallback = true;
      this.isReady = true;
    }
  }

  private async createTables(): Promise<void> {
    const schema = `
      CREATE TABLE IF NOT EXISTS lecturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_medidor TEXT NOT NULL,
        lectura REAL NOT NULL,
        observacion TEXT,
        fecha_hora TEXT NOT NULL,
        cedula_operador TEXT NOT NULL,
        sincronizado INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_sincronizado ON lecturas(sincronizado);
    `;
    await this.db.execute(schema);
  }

  // =============================================
  // LocalStorage Helpers (fallback para web)
  // =============================================

  private getStoredLecturas(): Lectura[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveStoredLecturas(lecturas: Lectura[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lecturas));
  }

  private getNextId(): number {
    const lecturas = this.getStoredLecturas();
    if (lecturas.length === 0) return 1;
    return Math.max(...lecturas.map(l => l.id || 0)) + 1;
  }

  // =============================================
  // CRUD Methods
  // =============================================

  async insertarLectura(lectura: Omit<Lectura, 'id'>): Promise<number> {
    if (this.isWebFallback) {
      const lecturas = this.getStoredLecturas();
      const id = this.getNextId();
      lecturas.push({ ...lectura, id });
      this.saveStoredLecturas(lecturas);
      return id;
    }

    const sql = `
      INSERT INTO lecturas (codigo_medidor, lectura, observacion, fecha_hora, cedula_operador, sincronizado)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      lectura.codigoMedidor,
      lectura.lectura,
      lectura.observacion || '',
      lectura.fechaHora,
      lectura.cedulaOperador,
      lectura.sincronizado ? 1 : 0
    ];

    const result = await this.db.run(sql, values);
    return result.changes?.lastId || 0;
  }

  async obtenerLecturasPendientes(): Promise<Lectura[]> {
    if (this.isWebFallback) {
      return this.getStoredLecturas()
        .filter(l => !l.sincronizado)
        .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
    }

    const sql = 'SELECT * FROM lecturas WHERE sincronizado = 0 ORDER BY fecha_hora DESC';
    const result = await this.db.query(sql);
    return this.mapRowsToLecturas(result.values || []);
  }

  async obtenerTodasLasLecturas(): Promise<Lectura[]> {
    if (this.isWebFallback) {
      return this.getStoredLecturas()
        .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
    }

    const sql = 'SELECT * FROM lecturas ORDER BY fecha_hora DESC';
    const result = await this.db.query(sql);
    return this.mapRowsToLecturas(result.values || []);
  }

  async marcarComoSincronizada(id: number): Promise<void> {
    if (this.isWebFallback) {
      const lecturas = this.getStoredLecturas();
      const index = lecturas.findIndex(l => l.id === id);
      if (index !== -1) {
        lecturas[index].sincronizado = true;
        this.saveStoredLecturas(lecturas);
      }
      return;
    }

    const sql = 'UPDATE lecturas SET sincronizado = 1 WHERE id = ?';
    await this.db.run(sql, [id]);
  }

  async contarPendientes(): Promise<number> {
    if (this.isWebFallback) {
      return this.getStoredLecturas().filter(l => !l.sincronizado).length;
    }

    const sql = 'SELECT COUNT(*) as count FROM lecturas WHERE sincronizado = 0';
    const result = await this.db.query(sql);
    return result.values?.[0]?.count || 0;
  }

  async eliminarLectura(id: number): Promise<void> {
    if (this.isWebFallback) {
      const lecturas = this.getStoredLecturas().filter(l => l.id !== id);
      this.saveStoredLecturas(lecturas);
      return;
    }

    const sql = 'DELETE FROM lecturas WHERE id = ?';
    await this.db.run(sql, [id]);
  }

  async limpiarSincronizadas(diasAntiguedad: number = 7): Promise<number> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    if (this.isWebFallback) {
      const lecturas = this.getStoredLecturas();
      const filtradas = lecturas.filter(l =>
        !l.sincronizado || new Date(l.fechaHora) >= fechaLimite
      );
      const eliminadas = lecturas.length - filtradas.length;
      this.saveStoredLecturas(filtradas);
      return eliminadas;
    }

    const sql = 'DELETE FROM lecturas WHERE sincronizado = 1 AND fecha_hora < ?';
    const result = await this.db.run(sql, [fechaLimite.toISOString()]);
    return result.changes?.changes || 0;
  }

  private mapRowsToLecturas(rows: any[]): Lectura[] {
    return rows.map(row => ({
      id: row.id,
      codigoMedidor: row.codigo_medidor,
      lectura: row.lectura,
      observacion: row.observacion,
      fechaHora: row.fecha_hora,
      cedulaOperador: row.cedula_operador,
      sincronizado: row.sincronizado === 1
    }));
  }
}
