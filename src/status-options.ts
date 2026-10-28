/**
 * Estatus compartidos de logística (mismo enum en pedidos, entregas, reparto,
 * delivery-package y delivery-package-manifiesto). Valores escritos también
 * por `entregas.salida.ts` (cargado → en_ruta). Colores alineados con
 * `state-fields.ts` del núcleo (`delivery-package`).
 */
export type StatusOption = {
  value: string;
  label: string;
  color: string;
  icon?: string;
};

export const LOGISTICS_STATUS = {
  pendiente: "pendiente",
  asignado: "asignado",
  cargado: "cargado",
  en_ruta: "en_ruta",
  entregado: "entregado",
  incidencia: "incidencia",
  cancelado: "cancelado",
} as const;

export type LogisticsStatus = (typeof LOGISTICS_STATUS)[keyof typeof LOGISTICS_STATUS];

/** Una sola lista; se siembra en los 5 model_id del subject. */
export const LOGISTICS_STATUS_OPTIONS: StatusOption[] = [
  { value: LOGISTICS_STATUS.pendiente, label: "Pendiente", color: "#ffc107", icon: "fas fa-hourglass-half" },
  { value: LOGISTICS_STATUS.asignado, label: "Asignado", color: "#0d6efd", icon: "fas fa-user-check" },
  { value: LOGISTICS_STATUS.cargado, label: "Cargado", color: "#0dcaf0", icon: "fas fa-box" },
  { value: LOGISTICS_STATUS.en_ruta, label: "En ruta", color: "#198754", icon: "fas fa-truck" },
  { value: LOGISTICS_STATUS.entregado, label: "Entregado", color: "#198754", icon: "fas fa-check-circle" },
  { value: LOGISTICS_STATUS.incidencia, label: "Incidencia", color: "#dc3545", icon: "fas fa-exclamation-triangle" },
  { value: LOGISTICS_STATUS.cancelado, label: "Cancelado", color: "#6c757d", icon: "fas fa-ban" },
];

export function status_label(options: StatusOption[], value: unknown): string {
  const v = String(value ?? "");
  return options.find((o) => o.value === v)?.label ?? v;
}
