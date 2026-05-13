export type IncidentStatus = 'pendiente' | 'en_proceso' | 'resuelto' | 'cancelado' | 'cerrado';

export interface Incident {
  id_rep: number;
  titulo: string | null;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta';
  estado: IncidentStatus;
  fecha_rep: string;
  fk_id_usu: number;
  cod_prod?: number | null;
  categoria?: string | null;
  observaciones_tecnicas?: string | null;
}

export interface CreateIncidentDto {
  titulo: string;
  descripcion: string;
  prioridad?: 'baja' | 'media' | 'alta';
  fk_id_usu: number;
  cod_prod?: number;
  categoria?: string;
}
