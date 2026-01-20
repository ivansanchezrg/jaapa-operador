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

## Estado del Proyecto

Ver `docs/PLAN_APP_OPERADOR.md` para el progreso detallado de implementacion.

## Documentacion

- `docs/PLAN_APP_OPERADOR.md` - Plan de implementacion y checklist
- `docs/GUIA_CONFIGURACION_PROYECTO.md` - Configuracion inicial detallada
