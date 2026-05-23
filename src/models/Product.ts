export interface Product {
  cod_prod: number;
  nom_prod: string;
  desc_prod?: string;
  precio_prod: number;
  stock_actual: number;
  stock_minimo: number;
  imagen_prod?: string;
  fk_cod_cats?: number[];
  nom_cat?: string;
  descrip_cat?: string;
  fechaven_prod?: string | null;
  /** Referencia de lote o trazabilidad (p. ej. en descripción o campo extendido del API). */
  ref_lote?: string | null;

  alerta_stock_critico?: boolean;
  descuento?: number;
  codigo_barras?: string;
}

export interface Category {
  cod_cat: number;
  nom_cat: string;
  descrip_cat: string | null;
}

export interface PaginatedProducts {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
