/**
 * Configuración de Google AdSense.
 *
 * Pasos para activar la monetización:
 *  1. Creá una cuenta en https://adsense.google.com y sumá tu sitio para revisión.
 *  2. Una vez aprobado, copiá tu ID de editor (ca-pub-XXXXXXXXXXXXXXXX).
 *  3. Creá unidades de anuncio "display" y copiá los IDs de espacio (slots).
 *  4. Completá los valores acá y volvé a compilar/subir el sitio.
 *  5. Subí un archivo ads.txt a la raíz del repo con:
 *       google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
 *     (reemplazando por tu número de publisher, sin el prefijo "ca-").
 *
 * Mientras los IDs estén vacíos no se carga ningún script externo, y en
 * producción no se muestra nada (en desarrollo se ven marcadores de posición
 * punteados para poder maquetar).
 */
export const ADSENSE_CLIENT = 'ca-pub-6416877213060621'; // ej: 'ca-pub-1234567890123456'

export const AD_SLOTS = {
  /** Banner vertical (160×600) en /watch. */
  watchVertical: '', // ej: '1234567890'
  /** Banner vertical (160×600) en /record. */
  recordVertical: '',
  /** Banner horizontal responsive (pantallas chicas y móviles). */
  horizontal: '',
};

/** ¿El ID de editor está configurado? */
export function adsenseConfigured(): boolean {
  return ADSENSE_CLIENT.startsWith('ca-pub-');
}

/** ¿Esta unidad de anuncio específica está lista para mostrarse? */
export function adUnitReady(slot: keyof typeof AD_SLOTS): boolean {
  return adsenseConfigured() && AD_SLOTS[slot].trim() !== '';
}
