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

// Punto de entrada único (API Gateway)
export const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:3000/api";



// Servicios de infraestructura
export const logService = new LogService();
logService.initGlobalHandlers();

// Cliente único para todo el sistema
export const httpClient = new FetchHttpClient(API_URL, logService);

// Instancias únicas (Singleton Pattern)
export const authService = new AuthService(httpClient);
export const userService = new UserService(httpClient, authService);
export const productService = new ProductService(httpClient, authService);
export const inventoryService = new InventoryService(httpClient, authService);
export const orderService = new OrderService(httpClient, authService);

export const maintenanceService = new MaintenanceService(httpClient, authService);
export const incidentService = new IncidentService(httpClient, authService);
export const reportService = new ReportService(httpClient, authService);
export const notificationService = new NotificationService();

// AlertService requiere NotificationService para integraciones
export const alertService = new SweetAlertService(notificationService, logService);
