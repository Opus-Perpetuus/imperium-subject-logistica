import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-logistica";

export const delivery_return_pages: KirletPageDecl[] = [
  {
    id: "logistica.delivery-return",
    path: "delivery-return",
    permission: "subject.logistica.delivery-return.read",
    build: () =>
      build_feature_shell_page({
        id: "logistica.delivery-return",
        owner: "subject-logistica",
        title: "Devoluciones",
        props: {
          basePath: "delivery-return",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Devoluciones",
            subtitle: "Submenú de logistica",
            pluralLabel: "devoluciones",
            singularLabel: "devoluciones",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/delivery-return`,
            record: `${API}/delivery-return/:id`,
            create: { method: "POST", action: `${API}/delivery-return` },
            update: { method: "PATCH", action: `${API}/delivery-return/:id` },
            delete: { method: "DELETE", action: `${API}/delivery-return/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "pedido_folio", label: "pedido folio", sortable: true, priority: 3 },
              { key: "contacto_nombre", label: "contacto nombre", sortable: true, priority: 3 },
              { key: "estado", label: "estado", sortable: true, priority: 3 },
              { key: "fecha", label: "fecha", sortable: true, priority: 3 },
              { key: "producto", label: "producto", sortable: true, priority: 3 },
              { key: "producto_nombre", label: "producto nombre", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
              { name: "pedido_folio", component: "input-text", label: "pedido folio" },
              { name: "contacto_nombre", component: "input-text", label: "contacto nombre" },
              { name: "estado", component: "input-text", label: "estado" },
              { name: "fecha", component: "input-text", label: "fecha" },
              { name: "producto", component: "input-text", label: "producto" },
              { name: "producto_nombre", component: "input-text", label: "producto nombre" },
              { name: "producto_codigo", component: "input-text", label: "producto codigo" },
              { name: "cantidad", component: "input-number", label: "cantidad" },
              { name: "motivo", component: "input-text", label: "motivo" },
              { name: "estado_producto", component: "input-text", label: "estado producto" },
              { name: "foto_attachment_id", component: "input-text", label: "foto attachment id" },
              { name: "latitude", component: "input-number", label: "latitude" },
              { name: "longitude", component: "input-number", label: "longitude" },
              { name: "pedido", component: "input-text", label: "pedido" },
              { name: "delivery_package", component: "input-text", label: "delivery package" },
              { name: "contacto", component: "input-text", label: "contacto" },
              { name: "lineas", component: "input-json", label: "lineas" },
              { name: "firma_conformidad_attachment_id", component: "input-text", label: "firma conformidad attachment id" },
              { name: "coordinates", component: "input-text", label: "coordinates" },
              { name: "ubicacion_recepcion", component: "input-text", label: "ubicacion recepcion" },
              { name: "ubicacion_recepcion_codigo", component: "input-text", label: "ubicacion recepcion codigo" },
            ],
          },
        },
      }),
  },
];
