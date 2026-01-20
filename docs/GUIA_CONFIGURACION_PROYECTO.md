# Configuracion Inicial - App Operador JAAPA

Guia para recrear el proyecto desde cero si es necesario.

## Stack Tecnologico

| Componente | Version |
|------------|---------|
| Ionic Angular | 8.x |
| Angular | 20.x |
| Capacitor | 8.x |
| Node.js | 22.x |

---

## Crear Proyecto Nuevo

### 1. Requisitos Previos

```bash
npm install -g @angular/cli
npm install -g @ionic/cli@latest
```

### 2. Crear Proyecto

```bash
ionic start jaapa-operador blank --type=angular --capacitor
cd jaapa-operador
```

### 3. Instalar Dependencias

```bash
# Plugins Capacitor
npm install @capacitor/network@latest
npm install @capacitor/preferences@latest
npm install @capacitor/splash-screen@latest
npm install @capacitor/status-bar@latest

# SQLite (para dispositivos moviles)
npm install @capacitor-community/sqlite@latest
```

### 4. Agregar Plataforma Android

```bash
ionic build
npm install @capacitor/android
npx cap add android
npx cap sync
```

---

## Configuracion

### capacitor.config.ts

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

### Environments

**environment.ts** (desarrollo)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

**environment.prod.ts** (produccion)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.jaapa.ec/api'
};
```

---

## Comandos Utiles

```bash
# Desarrollo web
ionic serve

# Build y sync Android
ionic build && npx cap sync android

# Abrir en Android Studio
npx cap open android

# Ver info del proyecto
ionic info
```

---

## Notas de Desarrollo

- **Modo Web**: Usa localStorage como almacenamiento (para desarrollo)
- **Modo Android/iOS**: Usa SQLite nativo (para produccion)
- El DatabaseService detecta automaticamente la plataforma y usa el almacenamiento apropiado
