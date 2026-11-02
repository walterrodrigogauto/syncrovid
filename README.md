# Syncrovid ⏯️

**Reacciones de YouTube en perfecta sincronía.** Graba tu reacción con la webcam mientras controlas
el video musical original, exporta un archivo `.sync` con cada marca temporal (`play` / `pause` /
`seek`) y comparte un enlace donde ambos videos se reproducen sincronizados.

Implementación completa de la _Guía de Implementación Técnica y Roadmap de Desarrollo End-to-End_
(FASES 1–5), con tema visual oscuro estilo YouTube.

## Stack (FASE 1)

- **Vite + React + TypeScript** — bundle ligero y tipado estricto para las marcas temporales
- **Tailwind CSS** — tema oscuro estilo YouTube
- **react-youtube** — reproductor IFrame de YouTube
- **lucide-react** · **file-saver (FileSaver.js)** · **lz-string**
- **react-router-dom** — navegación entre módulos

## Páginas (rutas)

| Ruta      | Fase    | Función                                                                      |
| --------- | ------- | ---------------------------------------------------------------------------- |
| `/`       | —       | Landing y explicación del flujo + motor de sincronización                     |
| `/record` | FASE 2  | Grabación de la reacción (webcam + VM) y registro de eventos → exporta `.sync` |
| `/upload` | FASE 3  | Ingesta de URLs VM/VR + `.sync` y generación del enlace de visitante          |
| `/watch`  | FASE 4  | Reproductor sincronizado Master-Slave para visitantes                         |

## Flujo de uso

1. **Grabar** (`/record`): pega la URL del video musical (VM), activa la cámara y presiona **GRABAR**.
   Dale play/pause/seek al VM mientras reaccionas: cada evento se registra como
   `{ type, vrTimeSec, vmTimeSec }`.
2. Al presionar **DETENER** se descargan dos archivos:
   - El video de la reacción (WebM o MP4, según el navegador).
   - `syncrovid-reaccion-….sync` — JSON estructurado con las marcas temporales.
3. Sube el video descargado a tu canal de YouTube: será el **VR** (video de la reacción).
4. **Publicar** (`/upload`): completa la URL del VM, la URL del VR y carga el `.sync`.
   Se genera un enlace tipo `…/watch?vm=ID_VM&vr=ID_VR&data=eJzLSM3…`
5. Comparte el enlace: en `/watch` el VR (**Master**) controla al VM (**Slave**).

## Formato del archivo `.sync`

```json
{
  "version": "1.0.0",
  "createdAt": "2026-09-10T12:00:00.000Z",
  "vmUrl": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  "events": [
    { "type": "play",  "vrTimeSec": 2.1,  "vmTimeSec": 0 },
    { "type": "pause", "vrTimeSec": 45.8, "vmTimeSec": 43.7 },
    { "type": "seek",  "vrTimeSec": 58.2, "vmTimeSec": 61.0 },
    { "type": "play",  "vrTimeSec": 58.4, "vmTimeSec": 61.0 }
  ]
}
```

`vrTimeSec` son los segundos desde el inicio de la grabación (la línea de tiempo del Master coincide
con la del video VR subido sin editar); `vmTimeSec` es la posición del VM en ese instante.

## Motor de sincronización (FASE 4 · `useSyncEngine`)

- El reproductor del **VR es el MASTER**; el del **VM es el SLAVE**.
- Bucle periódico de **100 ms** que consulta la posición del Master:
  1. Lee `vrCurrentTime`.
  2. Busca en el vector de eventos el estado correspondiente a ese segundo.
  3. Calcula `vmTargetTime = vrCurrentTime − eventOffset` (interpolado desde el evento activo).
- **Drift Control**: si `|vmRealTime − vmTargetTime| > 0.35 s` → `vmPlayer.seekTo(vmTargetTime)` para
  re-alinear sin interrumpir el audio.
- **Buffering**: si el VR entra en buffering, se pausa inmediatamente el VM; al reanudar el VR, se
  reanuda el VM.
- Durante segmentos `pause` el VM queda congelado en `vmTimeSec` del evento (soporta seeks en pausa).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build y despliegue (FASE 5)

```bash
npm run build    # tsc -b && vite build  → dist/
npm run preview  # sirve dist/ localmente
```

### GitHub Pages

El proyecto incluye el workflow `.github/workflows/deploy.yml`, que compila y publica
automáticamente en cada push a `main`:

1. El repo debe llamarse **`syncrovid`** (sin mayúsculas): `vite.config.ts` compila con la
   subruta `base: '/syncrovid/'` para `https://tu-usuario.github.io/syncrovid/`.
2. En el repo: **Settings → Pages → Source: GitHub Actions**.
3. Haz push (o re-ejecuta el workflow).

> Importante: GitHub Pages sirve archivos estáticos; hay que desplegar el **build** (`dist/`),
> no el código fuente (`src/`). El workflow se encarga de eso y además copia `index.html` como
> `404.html` para que las rutas del SPA (`/record`, `/upload`, `/watch`) funcionen al recargar.

### Dominio propio (syncrovid.com)

Cuando conectes el dominio en **Settings → Pages → Custom domain**, el sitio pasa a servirse
desde la raíz y hay que compilar con base `/`:

```bash
VITE_BASE_PATH=/ npm run build
```

El `basename` del router se ajusta solo, y los enlaces viejos de la época `/syncrovid/…` y
`/SyncReact2026/…` se redirigen automáticamente al abrirlos en el dominio.

### Vercel / Netlify

- **Vercel**: importa el repo desde GitHub. El `vercel.json` incluido ya reescribe todas las rutas a
  `index.html` (SPA).
- **Netlify**: el `public/_redirects` incluido hace lo mismo (`/* /index.html 200`).

## Guardado de `.sync` en el Drive de cada creador (opcional)

En **Publicar**, el creador puede conectar su cuenta de Google (OAuth, scope mínimo `drive.file`:
la app solo toca los archivos que ella misma crea) y guardar sus `.sync` en una carpeta
`Syncrovid/` de **su propio Drive**, con nombre `DDMMAAAA_HHMM.sync` y metadatos (vm/vr).

- **Enlace corto**: `/watch?vm=ID&vr=ID&sync=FILE_ID` — el visitante descarga el `.sync` público
  desde Drive con solo la API key (sin login), e incluye `data=` embebido como **respaldo
  automático** si Drive no responde.
- **Mis reacciones**: lista de los `.sync` guardados (copiar enlace / eliminar).
- Configuración en `src/config/google.ts` (Client ID + API Key del proyecto `syncrovid` en
  Google Cloud; app en modo testing → hasta 100 usuarios de prueba hasta verificarla).

## Monetización con Google AdSense

La app incluye la infraestructura de anuncios lista para activar:

| Ubicación | Formato | Cuándo se ve |
| --- | --- | --- |
| `/watch` columna derecha | Vertical 160×600 | Pantallas ≥ 1280px |
| `/record` columna derecha | Vertical 160×600 | Pantallas ≥ 1280px |
| `/watch` y `/record`, abajo | Horizontal responsive | Pantallas chicas / móviles |

### Activación

1. Creá la cuenta en [adsense.google.com](https://adsense.google.com) y sumá el sitio para revisión
   (la página `/privacidad` ya está incluida — AdSense la exige).
2. Copiá tu **ID de editor** (`ca-pub-…`) y completalo en `src/config/ads.ts`.
3. Creá unidades de anuncio **display** en AdSense y copiá los **IDs de espacio** a
   `AD_SLOTS` (`watchVertical`, `recordVertical`, `horizontal`).
4. Subí un archivo `ads.txt` a la raíz del repo:
   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
   (tu número de publisher, sin el prefijo `ca-`).
5. Recompilá (`npm run build`) y subí el nuevo `dist/`.

Mientras no haya IDs configurados: en desarrollo se ven marcadores punteados de posición y en
producción no se carga ningún script ni se muestra nada.

> Consejos de aprobación: AdSense prefiere sitios con contenido propio y tráfico real; un dominio
> propio (en vez de `usuario.github.io`) ayuda mucho. Revisá también los límites de uso de GitHub
> Pages para sitios con publicidad: para escalar, considerá Vercel/Netlify + dominio propio.

## Notas y limitaciones

- La cámara requiere un contexto seguro (HTTPS o `localhost`) y permisos del navegador. En vistas
  previas incrustadas (iframes) el navegador puede bloquearla: abre la app en una pestaña propia.
- El Slave inicia **silenciado** (la música suele estar en la pista del VR); el visitante puede activar
  su audio.
- La opción client-side incrusta el `.sync` comprimido en la URL: para reacciones muy largas el enlace
  crece. La alternativa recomendada por la guía es un backend (Supabase / Firebase / Node) que guarde
  la configuración y genere un slug corto (`/watch/v8aF9x2`).
- Autoplay: el Slave arranca silenciado precisamente para que los navegadores permitan su reproducción
  programática junto al Master.
- **Publicidad de YouTube**: durante un anuncio, `getDuration()` devuelve la duración del anuncio (mucho
  menor que la del video). El motor lo detecta y: (a) si el ad está en la reacción (Master), congela el
  video musical hasta que termine; (b) si está en el video musical (Slave), deja que el anuncio corra
  silenciado sin spamear correcciones, y al volver el contenido real el Drift Control realinea al
  instante. Si un anuncio aparece **durante la grabación** en `/record`, las marcas temporales del
  `.sync` quedan corrompidas: conviene repetir la toma.
