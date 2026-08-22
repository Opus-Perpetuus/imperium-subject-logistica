import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-logistica";

export const delivery_route_pages: KirletPageDecl[] = [
  {
    id: "logistica.delivery-route",
    path: "delivery-route",
    permission: "subject.logistica.delivery-route.read",
    build: () =>
      build_feature_shell_page({
        id: "logistica.delivery-route",
        owner: "subject-logistica",
        title: "Rutas de entrega",
        props: {
          basePath: "delivery-route",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Rutas de entrega",
            subtitle: "Submenú de logistica",
            pluralLabel: "rutas de entrega",
            singularLabel: "rutas de entrega",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/delivery-route`,
            record: `${API}/delivery-route/:id`,
            create: { method: "POST", action: `${API}/delivery-route` },
            update: { method: "PATCH", action: `${API}/delivery-route/:id` },
            delete: { method: "DELETE", action: `${API}/delivery-route/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "contacts", label: "contacts", sortable: true, priority: 3 },
              { key: "vehicle", label: "vehicle", sortable: true, priority: 3 },
              { key: "vehicle_name", label: "vehicle name", sortable: true, priority: 3 },
              { key: "pedido", label: "pedido", sortable: true, priority: 3 },
              { key: "package_ids", label: "package ids", sortable: true, priority: 3 },
              { key: "latitude", label: "latitude", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
              { name: "contacts", component: "input-text", label: "contacts" },
              { name: "vehicle", component: "input-text", label: "vehicle" },
              { name: "vehicle_name", component: "input-text", label: "vehicle name" },
              { name: "pedido", component: "input-text", label: "pedido" },
              { name: "package_ids", component: "input-json", label: "package ids" },
              { name: "latitude", component: "input-number", label: "latitude" },
              { name: "longitude", component: "input-number", label: "longitude" },
              { name: "label", component: "input-text", label: "label" },
              { name: "demand_kg", component: "input-number", label: "demand kg" },
              { name: "sequence", component: "input-number", label: "sequence" },
              { name: "cumulative_distance_meters", component: "input-number", label: "cumulative distance meters" },
              { name: "cumulative_duration_seconds", component: "input-number", label: "cumulative duration seconds" },
              { name: "eta", component: "input-text", label: "eta" },
              { name: "origin_source", component: "input-text", label: "origin source" },
              { name: "ordered_stops", component: "input-json", label: "ordered stops" },
              { name: "total_distance_meters", component: "input-number", label: "total distance meters" },
              { name: "total_duration_seconds", component: "input-number", label: "total duration seconds" },
              { name: "encoded_polyline", component: "input-text", label: "encoded polyline" },
              { name: "provider", component: "input-text", label: "provider" },
              { name: "optimized_at", component: "input-text", label: "optimized at" },
              { name: "optimization", component: "input-text", label: "optimization" },
            ],
          },
        },
      }),
  },
];
