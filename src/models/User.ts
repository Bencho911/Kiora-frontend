/**
 * Usuario en el dominio de la aplicación.
 * Campos opcionales reflejan el contrato del API; evitar índice `[key: string]` para mantener el contrato explícito.
 */
export interface User {
  id?: string | number;
  id_usu?: string | number;
  nom_usu?: string;
  nombres_usu?: string;
  apellidos_usu?: string;
  correo_usu: string;
  tel_usu?: string;
  rol_usu?: string;
  estado_usu?: boolean;
  intentos_fallidos?: number;
  bloqueado_hasta?: string | Date | null;
  /** Metadatos adicionales no mapeados aún (evitar depender de esto en lógica de negocio). */
  meta?: Record<string, unknown>;
}
