import { FetchHttpClient } from "../core/http/HttpClient";
import { LogService } from "../core/LogService";
import { SweetAlertService } from "../core/ui/AlertService";
import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";
import { ProductService } from "../services/ProductService";
import { InventoryService } from "../services/InventoryService";
import { OrderService } from "../services/OrderService";

import { MaintenanceService } from "../services/MaintenanceService";
import { NotificationService } from "../services/NotificationService";
import { IncidentService } from "../services/IncidentService";
import { ReportService } from "../services/ReportService";
import { AiService } from "../services/AiService";

// URL leída desde .env (prefijo PUBLIC_ requerido por Astro para exponerla al cliente)
// Fallback: backend estable en Azure
// NOTA: Se usa /api (sin v1) porque el v1Proxy del gateway tiene un bug de pathRewrite
// en la versión actual desplegada en Azure. El fix está en el código pero requiere redeploy.
// Las rutas /api tienen deprecation header (Sunset: 2027-01-01) pero son totalmente funcionales.
export const API_URL: string =
  (import.meta.env.PUBLIC_API_URL as string | undefined) ??
  "http://20.110.129.152:3000/api";

export const API_KEY: string =
  (import.meta.env.PUBLIC_KIORA_API_KEY as string | undefined) ?? "";

// Base para imágenes: misma raíz que la API sin el path /api o /api/v1
export const IMG_BASE: string = API_URL.replace(/\/api(\/v1)?\/?$/, "");

/** Construye la URL absoluta de una imagen del servidor */
export function getImageUrl(path?: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  const cleanBase = IMG_BASE.endsWith('/') ? IMG_BASE.slice(0, -1) : IMG_BASE;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

// Servicios de infraestructura
export const logService = new LogService();
logService.initGlobalHandlers();

// Cliente único para todo el sistema
export const httpClient = new FetchHttpClient(API_URL, logService, API_KEY);

// Instancias únicas (Singleton Pattern)
export const authService = new AuthService(httpClient);
export const userService = new UserService(httpClient, authService);
export const productService = new ProductService(httpClient, authService);
export const inventoryService = new InventoryService(httpClient, authService);
export const orderService = new OrderService(httpClient, authService);

export const maintenanceService = new MaintenanceService(httpClient, authService);
export const incidentService = new IncidentService(httpClient, authService);
export const reportService = new ReportService(httpClient, authService, productService);
export const aiService = new AiService(httpClient);
export const notificationService = new NotificationService();

// AlertService requiere NotificationService para integraciones
export const alertService = new SweetAlertService(notificationService, logService);
