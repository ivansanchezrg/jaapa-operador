# Plan de Implementacion - App Operador JAAPA

> Aplicacion movil para operadores de campo que registran lecturas de medidores en zonas rurales con soporte offline.

**Fecha:** 2026-01-19
**Version:** 2.0
**Estado:** En desarrollo

> **Nota:** Para configuracion del proyecto, instalacion y comandos ver `GUIA_CONFIGURACION_PROYECTO.md`

---

## 1. Resumen Ejecutivo

### Objetivo
Desarrollar una aplicacion movil para operadores que permita:
- Registrar lecturas de medidores en campo
- Trabajar sin conexion a internet (zonas rurales)
- Sincronizar datos cuando recupere conexion

### Flujo Principal
```
Login (cedula) -> Ingresar codigo medidor -> Validar existe -> Ingresar lectura -> Guardar local -> Sincronizar
```

---

## 2. Decision Tecnica: Proyecto Separado

### ¿Por que NO integrar en jaapa-dashboard?

| Aspecto | Dashboard | App Operador |
|---------|-----------|--------------|
| Plataforma | Web Desktop | Movil (Android/iOS) |
| Usuarios | Admin, Empleados | Operadores de campo |
| Conexion | Siempre online | Frecuentemente offline |
| Complejidad | Alta (AG-Grid, modales) | Simple (formulario) |
| Build | ng build | Capacitor (APK/IPA) |

### Estructura de proyectos

```
jaapa/
├── jaapa-dashboard/          # Proyecto actual (Angular web)
├── jaapa-operador/           # App movil Ionic + Capacitor
└── jaapa-shared/ (opcional)  # Interfaces compartidas (futuro)
```

### Estructura de la App (archivos a crear)

```
src/app/
├── core/
│   ├── services/
│   │   ├── database.service.ts       # SQLite CRUD
│   │   ├── sync.service.ts           # Sincronizacion con backend
│   │   ├── network.service.ts        # Estado de conexion
│   │   ├── auth.service.ts           # Login/sesion operador
│   │   └── medidores.service.ts      # Validar codigo medidor
│   ├── interfaces/
│   │   ├── lectura.interface.ts
│   │   └── auth.interface.ts
│   └── guards/
│       └── auth.guard.ts
├── pages/
│   ├── login/
│   │   ├── login.page.ts
│   │   ├── login.page.html
│   │   └── login.page.scss
│   ├── captura/
│   │   ├── captura.page.ts
│   │   ├── captura.page.html
│   │   └── captura.page.scss
│   └── pendientes/
│       ├── pendientes.page.ts
│       ├── pendientes.page.html
│       └── pendientes.page.scss
├── app.component.ts
├── app.routes.ts
└── app.config.ts
```

---

## 3. Interfaces

```typescript
// src/app/core/interfaces/lectura.interface.ts

export interface Lectura {
  id?: number;                  // SQLite local (autoincrement)
  codigoMedidor: string;
  lectura: number;
  observacion: string;
  fechaHora: string;            // ISO 8601
  cedulaOperador: string;
  sincronizado: boolean;
}

// DTO para enviar al backend
export interface LecturaDTO {
  codigoMedidor: string;
  lectura: number;
  observacion: string;
  fechaHora: string;
  cedulaOperador: string;
}
```

```typescript
// src/app/core/interfaces/auth.interface.ts

export interface LoginRequest {
  cedula: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  success: boolean;
  userInfo: UserInfo;
}

export interface UserInfo {
  nombreCompleto: string;
  roles: string[];           // ["ROLE_OPERADOR"]
  cedula?: string;
  email?: string;
}
```

---

## 4. Pantallas de la App

### 4.1 Login

```
┌─────────────────────────────────────┐
│           JAAPA                     │
│         [Logo]                      │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Cedula: [_______________]     │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Password: [_______________]   │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │         INGRESAR              │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### 4.2 Captura (Pantalla Principal)

```
┌─────────────────────────────────────┐
│ ≡  Nueva Lectura        🔴 Offline │
├─────────────────────────────────────┤
│                                     │
│  Codigo Medidor                     │
│  ┌───────────────────────────────┐  │
│  │ [MED-001____________]  [🔍]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ✓ Medidor encontrado           ││
│  │   Propietario: Maria Garcia    ││
│  │   Estado: ACTIVO               ││
│  │   Ultima lectura: 1200 kWh     ││
│  └─────────────────────────────────┘│
│                                     │
│  Lectura Actual                     │
│  ┌───────────────────────────────┐  │
│  │ [1234_______________] kWh     │  │
│  └───────────────────────────────┘  │
│  ℹ️ Debe ser >= 1200               │
│                                     │
│  Observacion (opcional)             │
│  ┌───────────────────────────────┐  │
│  │ [Sin novedad__________]       │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       GUARDAR LECTURA         │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  📋 Pendientes (5)                  │
└─────────────────────────────────────┘
```

### 4.3 Pendientes

```
┌─────────────────────────────────────┐
│ ←  Lecturas Pendientes    🟢 Online│
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │ MED-001                       │  │
│  │ Lectura: 1234 kWh             │  │
│  │ 19/01/2026 10:30              │  │
│  │ Estado: ⏳ Pendiente          │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ MED-002                       │  │
│  │ Lectura: 5678 kWh             │  │
│  │ 19/01/2026 10:45              │  │
│  │ Estado: ✅ Sincronizado       │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │      SINCRONIZAR TODO         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 4.4 Estados de Error

```
┌─────────────────────────────────────┐
│  ❌ Error de Validacion            │
│  ┌─────────────────────────────────┐│
│  │ El medidor no esta activo      ││
│  │ Estado actual: INACTIVO        ││
│  │ Contacte a supervision.        ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

```
┌─────────────────────────────────────┐
│  ⚠️ Lectura Invalida               │
│  ┌─────────────────────────────────┐│
│  │ La lectura (1100) no puede     ││
│  │ ser menor a la anterior (1200) ││
│  │ Verifique el medidor.          ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## 5. Flujo de Datos

### 5.1 Guardar Lectura

```
Usuario ingresa datos
        ↓
Validar formulario
        ↓
Guardar en SQLite (sincronizado = false)
        ↓
¿Hay conexion?
    ↓ Si                    ↓ No
Enviar al backend      Mostrar "Guardado local"
    ↓
¿Exito?
    ↓ Si                    ↓ No
Marcar sincronizado    Mantener pendiente
= true
```

### 5.2 Sincronizacion

```
App detecta conexion (Network plugin)
        ↓
Buscar lecturas con sincronizado = false
        ↓
Por cada lectura:
    ↓
POST /api/lecturas
    ↓
¿Exito?
    ↓ Si                    ↓ No
UPDATE sincronizado    Reintentar despues
= true
```

---

## 6. Endpoints Backend Requeridos

### 6.1 Autenticacion (EXISTENTE)

```
POST /auth/login
Request:
{
  "cedula": "0926547895",
  "password": "****"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 1800,
  "success": true,
  "userInfo": {
    "nombreCompleto": "Juan Perez",
    "roles": ["ROLE_OPERADOR"],
    "cedula": "0926547895"
  }
}
```

### 6.2 Validar Medidor (EXISTENTE)

```
POST /medidores/buscar
Request:
{
  "page": 0,
  "size": 1,
  "filtros": {
    "codigo": "MED-001"
  }
}

Response (existe):
{
  "success": true,
  "data": {
    "content": [
      {
        "idMedidor": 1,
        "codigo": "MED-001",
        "estado": "ACTIVO",
        "personaNombre": "Maria",
        "personaApellido": "Garcia"
      }
    ],
    "totalElements": 1
  }
}
```

### 6.3 Registrar Lectura (NUEVO - Requiere Backend)

```
POST /lecturas
Request:
{
  "codigoMedidor": "MED-001",
  "lectura": 1234,
  "observacion": "Sin novedad",
  "fechaHora": "2026-01-19T10:30:00",
  "cedulaOperador": "0926547895"
}

Response:
{
  "success": true,
  "message": "Lectura registrada"
}
```

### 6.4 Sincronizacion Masiva (NUEVO - Opcional)

```
POST /lecturas/batch
Request:
{
  "lecturas": [
    { "codigoMedidor": "MED-001", "lectura": 1234, ... },
    { "codigoMedidor": "MED-002", "lectura": 5678, ... }
  ]
}

Response:
{
  "success": true,
  "procesadas": 2,
  "fallidas": 0
}
```

### 6.5 Resumen: Estado de Endpoints

| Endpoint | Estado | Accion |
|----------|--------|--------|
| `POST /auth/login` | EXISTE | Reutilizar |
| `POST /auth/refresh` | EXISTE | Reutilizar |
| `POST /medidores/buscar` | EXISTE | Reutilizar |
| `GET /consumos/medidor/{id}` | EXISTE | Reutilizar |
| `POST /lecturas` | **NO EXISTE** | Crear en backend |
| `POST /lecturas/batch` | **NO EXISTE** | Crear (opcional) |

---

## 7. Esquema SQLite Local

```sql
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
```

---

## 8. Plan de Implementacion por Fases

### Fase 1: Setup Inicial
- [x] Crear proyecto Ionic + Angular + Capacitor
- [x] Instalar plugins necesarios
- [x] Configurar capacitor.config.ts
- [x] Configurar environments
- [x] Agregar plataforma Android

### Fase 2: Core Services
- [x] Implementar DatabaseService (SQLite)
- [x] Implementar NetworkService (detectar conexion)
- [x] Implementar AuthService (login/sesion)
- [x] Implementar SyncService (sincronizacion)
- [x] Implementar MedidoresService (validar codigo)
- [x] Implementar AuthInterceptor (extra - manejo de tokens)

### Fase 3: Pantallas
- [x] Implementar LoginPage
- [x] Implementar CapturaPage (formulario principal)
- [x] Implementar PendientesPage (lista de lecturas)
- [x] Configurar navegacion y guards

### Fase 4: Integracion Backend
- [x] Conectar con endpoint de login
- [x] Conectar con endpoint de validar medidor
- [x] Conectar con endpoint de registrar lectura
- [x] Implementar logica de reintento

### Fase 5: Testing y Build
- [x] Probar flujo offline completo (web)
- [x] Probar sincronizacion (web)
- [ ] Generar APK de prueba
- [ ] Testing en dispositivo real

### Fase 6: Produccion
- [ ] Configurar firma de APK
- [ ] Generar APK release

---

## 9. Validaciones de Negocio

### 9.1 Reglas del Backend

| Regla | Validacion | Mensaje Error |
|-------|------------|---------------|
| Estado Medidor | Solo `ACTIVO` acepta lecturas | "El medidor no esta activo" |
| Lectura Minima | lectura >= lecturaAnterior | "Lectura no puede ser menor a la anterior" |
| Medidor Existente | Codigo debe existir | "Medidor no encontrado" |
| Operador Valido | Cedula con rol ROLE_OPERADOR | "Operador no autorizado" |

### 9.2 Estados del Medidor

```
NUEVO -> ACTIVO -> INACTIVO <-> ACTIVO
                      ↓
                  AVERIADO -> REEMPLAZADO
                      ↓
                  RETIRADO
```

Solo medidores con estado `ACTIVO` pueden recibir lecturas.

### 9.3 Validacion en la App

```typescript
async validarMedidor(codigo: string): Promise<void> {
  const response = await this.medidoresService.buscarPorCodigo(codigo);

  if (response.totalElements === 0) {
    this.mostrarError('Medidor no encontrado');
    return;
  }

  const medidor = response.content[0];

  if (medidor.estado !== 'ACTIVO') {
    this.mostrarError(`Medidor no activo. Estado: ${medidor.estado}`);
    return;
  }

  this.medidorActual = medidor;
  this.medidorValido = true;
}
```

### 9.4 Manejo de Errores de Sincronizacion

```typescript
async sincronizarLectura(lectura: Lectura): Promise<SyncResult> {
  try {
    await this.lecturaService.registrar(lectura);
    return { success: true };
  } catch (error) {
    const mensaje = this.parseErrorMessage(error);

    // Errores que NO se deben reintentar
    const erroresFinales = [
      'Medidor no encontrado',
      'El medidor no esta activo',
      'Operador no autorizado'
    ];

    return {
      success: false,
      error: mensaje,
      reintentar: !erroresFinales.some(e => mensaje.includes(e))
    };
  }
}
```

---

## 10. Notas Tecnicas de Implementacion

### 10.1 Change Detection en Angular + Ionic

Las operaciones async no activan automaticamente el change detection de Angular. Solucion:

```typescript
import { ChangeDetectorRef } from '@angular/core';

private cdr = inject(ChangeDetectorRef);

async operacionAsync(): Promise<void> {
  try {
    // operacion async
  } finally {
    this.cdr.detectChanges(); // Forzar actualizacion de UI
  }
}
```

**Afecta a:** `LoginPage`, `CapturaPage`, `PendientesPage`

### 10.2 Ciclo de Vida Ionic vs Angular

`ngOnInit` solo se ejecuta una vez. Para refrescar datos al volver a una pagina usar `ionViewWillEnter`:

```typescript
import { ViewWillEnter } from '@ionic/angular/standalone';

export class CapturaPage implements ViewWillEnter {
  ionViewWillEnter(): void {
    this.actualizarContadorPendientes(); // Se ejecuta cada vez que la pagina se muestra
  }
}
```

### 10.3 Logica de Reintento en Sincronizacion

| Tipo de Error | `reintentar` | Accion |
|---------------|--------------|--------|
| Conexion (backend caido, sin red) | `true` | Mantener en pendientes |
| Validacion (lectura menor, medidor inactivo) | `false` | Eliminar registro local |

```typescript
// sync.service.ts
const ERRORES_NO_REINTENTABLES = [
  'Medidor no encontrado',
  'El medidor no esta activo',
  'Operador no autorizado',
  'no puede ser menor'
];
```

### 10.4 Wrapper ApiResponse del Backend

Todas las respuestas del backend estan envueltas:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// Uso correcto
const apiResponse = await http.post<ApiResponse<AuthResponse>>(url, body);
if (!apiResponse.success || !apiResponse.data) {
  throw new Error(apiResponse.message);
}
const data = apiResponse.data; // Datos reales
```

### 10.5 Validacion de Rol Operador

El backend puede devolver el rol como `"OPERADOR"` o `"ROLE_OPERADOR"`. Validar ambos:

```typescript
private hasOperadorRole(userInfo: UserInfo): boolean {
  return userInfo.roles.some(role =>
    role === 'OPERADOR' || role === 'ROLE_OPERADOR'
  );
}
```

### 10.6 Almacenamiento Local

| Plataforma | Storage | Plugin |
|------------|---------|--------|
| Android/iOS | SQLite | `@capacitor-community/sqlite` |
| Web (desarrollo) | localStorage | Fallback en `DatabaseService` |

El `DatabaseService` detecta la plataforma y usa el storage apropiado automaticamente.

---

## 11. Checklist de Compatibilidad

Verificaciones completadas:

- [x] El rol `OPERADOR` existe en el sistema
- [x] Los operadores tienen asignado el rol
- [x] Backend tiene `POST /lecturas` implementado
- [x] Medidores de prueba tienen estado `ACTIVO`
- [x] Existe medidor con lecturas previas para probar
- [x] Backend devuelve respuestas en formato `ApiResponse<T>`
- [x] Permisos de endpoint `/medidores/buscar` para rol OPERADOR

---

## 12. Documentacion Relacionada

| Documento | Contenido |
|-----------|-----------|
| `GUIA_CONFIGURACION_PROYECTO.md` | Setup, instalacion, comandos |
| `BACKEND_ENDPOINTS_OPERADOR.md` | Especificacion endpoints a crear |

---

**Estado Actual:** Fases 1-4 completadas. Flujo offline probado en desarrollo web. Siguiente: Fase 5 (Generar APK y testing en dispositivo real).
