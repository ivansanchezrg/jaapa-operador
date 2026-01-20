# Guía para Generar APK - JAAPA Operador

> Guía paso a paso para compilar y generar el APK de la aplicación.

**Última actualización:** 2026-01-20

---

## Requisitos Previos

| Software | Descripción |
|----------|-------------|
| Node.js 18+ | Runtime de JavaScript |
| Android Studio | IDE + SDK de Android |
| Java JDK 17+ | Requerido por Gradle |

---

## Pasos para Generar APK

### Paso 1: Compilar el proyecto Angular/Ionic

```bash
ionic build
```

Este comando compila el proyecto Angular y genera los archivos en la carpeta `www/`.

**Salida esperada:**
```
Application bundle generation complete. [X.XXX seconds]
```

### Paso 2: Sincronizar con Android

```bash
npx cap sync android
```

Este comando:
- Copia los archivos compilados (`www/`) al proyecto Android
- Sincroniza los plugins de Capacitor
- Actualiza las dependencias nativas

**Salida esperada:**
```
✔ Copying web assets from www to android/app/src/main/assets/public
✔ Creating capacitor.config.json in android/app/src/main/assets
✔ copy android
✔ Updating Android plugins
✔ update android
```

### Paso 3: Abrir en Android Studio

**Opción A - Comando automático:**
```bash
npx cap open android
```

**Opción B - Manual:**
1. Abrir Android Studio
2. Click en **"Open"**
3. Navegar a: `C:\Users\ivan\Desktop\jaapa\jaapa-operador\android`
4. Seleccionar la carpeta `android` y click en **"OK"**

### Paso 4: Esperar sincronización de Gradle

- Al abrir el proyecto, Gradle comenzará a sincronizar automáticamente
- Verás una barra de progreso en la parte inferior
- **Primera vez:** Puede tomar 3-5 minutos
- **Siguientes veces:** Menos de 1 minuto

### Paso 5: Generar el APK

1. En Android Studio, ir al menú:
   - **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**

2. Esperar que termine la compilación

3. Aparecerá una notificación abajo a la derecha:
   - Click en **"locate"** para abrir la carpeta del APK

**Ubicación del APK:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Paso 6: Instalar en el dispositivo

1. Copiar `app-debug.apk` al celular (USB, Drive, etc.)
2. En el celular, habilitar **"Instalar apps de orígenes desconocidos"** en Configuración
3. Abrir el archivo APK e instalar

---

## Resumen de Comandos

```bash
# Compilar proyecto
ionic build

# Sincronizar con Android
npx cap sync android

# Abrir Android Studio (opcional)
npx cap open android
```

**Comando combinado (todo en uno):**
```bash
ionic build && npx cap sync android && npx cap open android
```

---

## Solución de Errores Comunes

### Error: "No encuentra la clase MainActivity"

**Síntoma:**
```
java.lang.ClassNotFoundException: ec.jaapa.operador.MainActivity
```
O mensaje similar indicando que no encuentra `MainActivity`.

**Causa:**
El `appId` en `capacitor.config.ts` no coincide con la ubicación del archivo `MainActivity.java`.

**Diagnóstico:**

| Archivo | Qué verificar |
|---------|---------------|
| `capacitor.config.ts` | `appId: 'ec.jaapa.operador'` |
| `android/app/build.gradle` | `applicationId "ec.jaapa.operador"` |
| `MainActivity.java` | Debe estar en `java/ec/jaapa/operador/` |

**Solución:**

1. Verificar el `appId` en `capacitor.config.ts`:
   ```typescript
   const config: CapacitorConfig = {
     appId: 'ec.jaapa.operador',  // Este es el package name
     // ...
   };
   ```

2. El `MainActivity.java` debe estar en la ruta correcta:
   ```
   android/app/src/main/java/ec/jaapa/operador/MainActivity.java
   ```

   **NO en:** `java/io/ionic/starter/` (ubicación por defecto incorrecta)

3. El contenido de `MainActivity.java` debe tener el package correcto:
   ```java
   package ec.jaapa.operador;  // Debe coincidir con appId

   import com.getcapacitor.BridgeActivity;

   public class MainActivity extends BridgeActivity {}
   ```

4. Si la carpeta no existe, crearla:
   ```bash
   mkdir -p android/app/src/main/java/ec/jaapa/operador
   ```

5. Eliminar la carpeta vieja si existe:
   ```bash
   rm -rf android/app/src/main/java/io
   ```

6. Regenerar el APK:
   ```bash
   npx cap sync android
   ```
   Luego en Android Studio: **File > Sync Project with Gradle Files** y **Build > Build APK(s)**

---

### Error: Gradle sync failed

**Síntoma:**
Android Studio muestra errores de sincronización de Gradle.

**Soluciones:**
1. **File > Invalidate Caches and Restart**
2. Eliminar carpeta `.gradle` y volver a sincronizar
3. Verificar conexión a internet (Gradle descarga dependencias)

---

### Error: SDK not found

**Síntoma:**
```
SDK location not found
```

**Solución:**
1. En Android Studio: **File > Project Structure > SDK Location**
2. Configurar la ruta del Android SDK (normalmente `C:\Users\[usuario]\AppData\Local\Android\Sdk`)

---

## Notas Adicionales

### Para aplicaciones nuevas

Al crear una nueva app con Capacitor, asegurarse de:

1. Definir el `appId` correcto desde el inicio en `capacitor.config.ts`
2. Usar formato de package name válido: `com.empresa.app` o `ec.empresa.app`
3. Después de `npx cap add android`, verificar que `MainActivity.java` esté en la carpeta correcta

### APK Debug vs Release

| Tipo | Uso | Comando |
|------|-----|---------|
| Debug | Desarrollo y pruebas | Build > Build APK(s) |
| Release | Producción (Play Store) | Build > Generate Signed Bundle/APK |

Para generar APK Release se necesita configurar firma (keystore).

---

## Estructura de Archivos Android

```
android/
├── app/
│   ├── build.gradle                 # Configuración de la app
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml  # Permisos y configuración
│   │       ├── assets/
│   │       │   └── public/          # Archivos web compilados
│   │       ├── java/
│   │       │   └── ec/jaapa/operador/
│   │       │       └── MainActivity.java  # Actividad principal
│   │       └── res/                 # Recursos (iconos, strings, etc.)
│   └── build/
│       └── outputs/
│           └── apk/
│               └── debug/
│                   └── app-debug.apk  # APK generado
├── build.gradle                     # Configuración del proyecto
└── capacitor.config.json            # Config de Capacitor (generado)
```
