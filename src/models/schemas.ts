import { z } from 'zod';

export const UserSchema = z.object({
  id_usu: z.number().optional(),
  nom_usu: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  correo_usu: z.string().email('Email inválido'),
  tel_usu: z.string().optional(),
  rol_usu: z.enum(['admin', 'empleado', 'cliente', '']).default('cliente'),
  isBlocked: z.boolean().optional(),
});

export const ProductSchema = z.object({
  cod_prod: z.coerce.number().optional(),
  nom_prod: z.string().min(1, 'El nombre es obligatorio'),
  desc_prod: z.string().optional().nullable(),
  precio_prod: z.coerce.number().nonnegative().optional().default(0),
  stock_actual: z.coerce.number().nonnegative().optional().default(0),
  stock_minimo: z.coerce.number().nonnegative().optional(),
  imagen_prod: z.string().optional().nullable(),
  fk_cod_cats: z.array(z.coerce.number()).optional().default([]),
});

export const CategorySchema = z.object({
  cod_cat: z.number().optional(),
  nom_cat: z.string().min(2, 'Nombre demasiado corto'),
  descrip_cat: z.string().optional(),
});

export const OrderItemSchema = z.object({
  cod_prod: z.number(),
  cantidad: z.number().int().positive(),
  precio_unit: z.number(),
  nom_prod: z.string(),
  url_imagen: z.string().optional(),
  stock_actual: z.number().optional(),
});

export const OrderSchema = z.object({
  id_vent: z.number().optional(),
  metodopago_usu: z.enum(['efectivo', 'tarjeta', 'digital']),
  items: z.array(OrderItemSchema).min(1, 'La orden debe tener al menos un producto'),
  total_vent: z.number().optional(),
  fecha_vent: z.string().optional(),
  estado_vent: z.string().optional(),
});

export type UserDto = z.infer<typeof UserSchema>;
export type ProductDto = z.infer<typeof ProductSchema>;
export type OrderDto = z.infer<typeof OrderSchema>;
