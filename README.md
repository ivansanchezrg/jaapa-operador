# JAAPA Operador

App movil para operadores de campo que registran lecturas de medidores en zonas rurales con soporte offline.

## Stack Tecnologico

| Tecnologia | Version |
|------------|---------|
| Ionic | 8.x |
| Angular | 20.x |
| Capacitor | 8.x |
| Node.js | 22.x |

## Requisitos

- Node.js 18+
- npm 9+
- Android Studio (para compilar APK)

## Instalacion

```bash
# Clonar repositorio
git clone [url-del-repo]
cd jaapa-operador

# Instalar dependencias
npm install
```

## Desarrollo

```bash
# Servidor de desarrollo
ionic serve

# El backend debe estar corriendo en localhost:8080
```

## Build Android

```bash
ionic build
npx cap sync android
npx cap open android
```

## Estructura del Proyecto

```
src/app/
├── core/
│   ├── services/       # Servicios (auth, database, sync, etc.)
│   ├── interfaces/     # Tipos e interfaces TypeScript
│   ├── guards/         # Guards de navegacion
│   └── interceptors/   # Interceptores HTTP
├── pages/
│   ├── login/          # Pantalla de login
│   ├── captura/        # Formulario de captura de lecturas
│   └── pendientes/     # Lista de lecturas pendientes
└── app.routes.ts       # Configuracion de rutas
```

## Servicios Principales

| Servicio | Descripcion |
|----------|-------------|
| `AuthService` | Login, logout, manejo de sesion JWT |
| `DatabaseService` | Almacenamiento local (SQLite en movil, localStorage en web) |
| `NetworkService` | Deteccion de estado de conexion |
| `SyncService` | Sincronizacion de lecturas con el backend |
| `MedidoresService` | Validacion de codigos de medidor |

## Flujo de la App

```
Login (cedula) -> Captura -> Validar medidor -> Ingresar lectura -> Guardar local -> Sincronizar
```

## Configuracion del Backend

Editar `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

## Notas Importantes de Implementacion

### Change Detection en Async
Las operaciones async (login, buscar medidor, guardar lectura) requieren `ChangeDetectorRef.detectChanges()` en el `finally` block para que Angular actualice la UI correctamente.

### Ciclo de Vida Ionic
Usar `ionViewWillEnter` en lugar de `ngOnInit` para refrescar datos cuando se regresa a una pagina (ej: contador de pendientes).

### Manejo de Errores de Sincronizacion
- **Error de conexion** (`reintentar: true`): Mantiene el registro local para sincronizar despues
- **Error de validacion** (`reintentar: false`): Elimina el registro local (ej: "lectura menor que anterior")

### Almacenamiento Local
- **Movil**: SQLite via `@capacitor-community/sqlite`
- **Web (desarrollo)**: localStorage como fallback

### Respuestas del Backend
Todas las respuestas estan envueltas en `ApiResponse<T>`:
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}
```

## Estado del Proyecto

Ver `docs/PLAN_APP_OPERADOR.md` para el progreso detallado de implementacion.

## Documentacion

- `docs/PLAN_APP_OPERADOR.md` - Plan de implementacion y checklist
- `docs/GUIA_CONFIGURACION_PROYECTO.md` - Configuracion inicial detallada
