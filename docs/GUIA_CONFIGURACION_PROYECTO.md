# Configuración Inicial - App Operador JAAPA

## Stack Verificado Compatible

- **Ionic**: 8.x
- **Angular**: 20.x
- **Capacitor**: 8.x
- **Node.js**: 22.x (compatible con 18.x, 20.x)

---

## Instalación Paso a Paso

### 1. Requisitos Previos

```bash
# Instalar CLIs globales
npm install -g @angular/cli
npm install -g @ionic/cli@latest
```

### 2. Crear Proyecto

```bash
cd C:\Users\ivan\Desktop\jaapa

# Crear proyecto Ionic 8 + Angular + Capacitor
ionic start jaapa-operador blank --type=angular --capacitor

cd jaapa-operador
```

### 3. Instalar Dependencias

```bash
# Plugins Capacitor oficiales
npm install @capacitor/network@latest
npm install @capacitor/preferences@latest
npm install @capacitor/splash-screen@latest
npm install @capacitor/status-bar@latest

# SQLite
npm install @capacitor-community/sqlite@latest
npm install jeep-sqlite
npm install sql.js
```

### 4. Compilar y Sincronizar

```bash
# Compilar proyecto (crea carpeta www)
ionic build

# Sincronizar Capacitor
npx cap sync
```

### 5. Agregar Plataformas

```bash
# Android
npm install @capacitor/android
npx cap add android

# iOS (solo Mac)
npm install @capacitor/ios
npx cap add ios
```

### 6. Configurar capacitor.config.ts

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ec.jaapa.operador',
  appName: 'JAAPA Operador',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false
    }
  }
};

export default config;
```

### 7. Copiar sql-wasm.wasm (para desarrollo Web)

```bash
# Windows
copy node_modules\sql.js\dist\sql-wasm.wasm src\assets\

# Linux/Mac
cp node_modules/sql.js/dist/sql-wasm.wasm src/assets/
```

### 8. Configurar Android (android/variables.gradle)

El archivo ya viene configurado con valores actualizados:

```gradle
ext {
    minSdkVersion = 24
    compileSdkVersion = 36
    targetSdkVersion = 36
    // ... otras dependencias
}
```

### 9. Configurar Android (android/app/build.gradle)

Actualizar namespace y applicationId, y agregar packagingOptions:

```gradle
android {
    namespace = "ec.jaapa.operador"
    // ...
    defaultConfig {
        applicationId "ec.jaapa.operador"
        // ...
    }
    // ...
    packagingOptions {
        exclude 'build-data.properties'
    }
}
```

---

## Estructura del Proyecto

```
jaapa-operador/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/          # Aquí tus servicios
│   │   │   ├── interfaces/        # Tus interfaces
│   │   │   └── guards/            # Guards de autenticación
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   ├── captura/
│   │   │   └── pendientes/
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   └── assets/
│       └── sql-wasm.wasm          # IMPORTANTE para dev web
├── android/
├── ios/
└── capacitor.config.ts
```

---

## Generar Páginas y Servicios

```bash
# Páginas
ionic generate page pages/login
ionic generate page pages/captura
ionic generate page pages/pendientes

# Servicios
ionic generate service core/services/database
ionic generate service core/services/auth
ionic generate service core/services/network
ionic generate service core/services/sync
ionic generate service core/services/medidores

# Guards
ionic generate guard core/guards/auth
```

---

## Configurar Environments

**src/environments/environment.ts**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

**src/environments/environment.prod.ts**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.jaapa.ec/api'
};
```

---

## Comandos de Desarrollo

```bash
# Desarrollo web
ionic serve

# Build para Android
ionic build
npx cap sync android
npx cap open android

# Build para iOS
ionic build
npx cap sync ios
npx cap open ios
```

---

## Verificar Instalación

```bash
ionic info

# Debe mostrar algo similar a:
# Ionic CLI        : 7.x+
# Ionic Framework  : @ionic/angular 8.x
# Angular          : 20.x
# Capacitor CLI    : 8.x
```

---

## Compatibilidad Confirmada

| Componente | Versión | Estado |
|------------|---------|--------|
| Ionic Angular | 8.7.x | Compatible con Angular 20 |
| Angular | 20.x | Última versión estable |
| Capacitor | 8.x | Última versión estable |
| @capacitor/network | 8.x | Actualizado |
| @capacitor/preferences | 8.x | Actualizado |
| @capacitor-community/sqlite | 7.x | Compatible con Capacitor 8 |
| Node.js | 22.x | LTS |

---

## Notas Importantes

1. **Ionic 8** es compatible con Angular 18, 19 y 20
2. **Capacitor 8** funciona perfectamente con Angular 20
3. Todos los plugins están actualizados a sus últimas versiones compatibles
4. El archivo `sql-wasm.wasm` es necesario para desarrollo web con SQLite
5. Para producción, compila directamente en Android/iOS
6. Las versiones de CLIs globales pueden diferir de las del proyecto - esto es normal

---

**Proyecto listo para implementar servicios y lógica de negocio.**
