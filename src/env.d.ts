/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** URL base del API (ej. http://localhost:3000/api) */
  readonly PUBLIC_API_URL?: string;
  /** Clave pública Weglot (opcional; si no hay, no se inicializa el widget) */
  readonly PUBLIC_WEGLOT_API_KEY?: string;
}
