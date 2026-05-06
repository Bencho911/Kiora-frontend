export interface Supplier {
  cod_prov: number;
  id_prov: string | null;
  nom_prov: string;
  tel_prov: string | null;
  tipoid_prov: string | null;
  correo_prov?: string | null;
}

export interface Movement {
  id_mov: number;
  tipo_mov: string;
  fecha_mov: string;
  cantidad: number;
  cod_prod: number;
  desc_mov: string;
}

export interface Suministra {
  id: number;
  fk_cod_prov: number;
  cod_prod: number;
  stock: number;
  stock_minimo: number;
  nom_prov?: string;
}

export interface LowStockItem {
  cod_prod: number;
  nom_prod: string;
  stock_actual: number;
  stock_minimo: number;
}

export interface PaginatedSuppliers {
  data: Supplier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedMovements {
  data: Movement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
