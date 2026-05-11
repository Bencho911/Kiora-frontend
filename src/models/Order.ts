export interface SaleItem {
  id: number;
  fk_id_vent: number;
  cod_prod: number;
  cantidad: number;
  precio_unit: number;
  nom_prod?: string; // Optional joined field
}

export interface OrderItem {
  id?: number;
  cod_prod: number;
  cantidad: number;
  precio_unit: number;
  nom_prod?: string;
  url_imagen?: string;
  stock_actual?: number;
}

export interface Order {
  id_vent?: number;
  fecha_vent?: string;
  montofinal_vent?: number;
  metodopago_usu?: string;
  estado?: 'pendiente' | 'completada' | 'cancelada' | 'reembolsada' | 'pagado' | 'pagada';
  items?: OrderItem[];
  productos_resumen?: string;
}

export interface Invoice {
  id_fact: number;
  fecha_fact: string;
  total_fact: number;
  id_pedido: number;
  id_usu: number;
  cantidad_vent: number;
  precio_prod: number;
}

export interface PaginatedOrders {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface CreateOrderDto {
  metodopago_usu: string;
  items: OrderItem[];
}
