export interface MaintenanceReport {
  id_rep: number;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta';
  estado: 'pendiente' | 'en_proceso' | 'resuelto';
  fk_id_usu: number;
  cod_prod?: number;
  fecha_rep: string;
  observaciones_tecnicas?: string;
}

export interface CreateReportDto {
  descripcion: string;
  prioridad?: string;
  cod_prod?: number;
}
