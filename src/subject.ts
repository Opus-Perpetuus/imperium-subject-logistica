import { define_subject } from "@opus-perpetuus/imperium-core-kit";
import pkg from "../package.json" with { type: "json" };
import { delivery_return_module } from "./modules/delivery-return/delivery-return.routes.ts";
import { delivery_package_module } from "./modules/delivery-package/delivery-package.routes.ts";
import { pedidos_module } from "./modules/pedidos/pedidos.routes.ts";
import { delivery_package_manifiesto_module } from "./modules/delivery-package-manifiesto/delivery-package-manifiesto.routes.ts";
import { reparto_module } from "./modules/reparto/reparto.routes.ts";
import { entregas_module } from "./modules/entregas/entregas.routes.ts";
import { delivery_route_module } from "./modules/delivery-route/delivery-route.routes.ts";
import { delivery_route_mapa_module } from "./modules/delivery-route-mapa/delivery-route-mapa.routes.ts";
import { seed_demo } from "./seed.ts";

export const SUBJECT = define_subject({
  id: "SUBJECT-logistica",
  name: "Logística",
  version: pkg.version,
  image: `ghcr.io/opus-perpetuus/subject-logistica:${pkg.version}`,
  compat: { nox: ">=0.5.0", kit: "^0.5.0" },
  schema_version: 1,
  menu_root: {
    id: "logistica.root",
    label: "Logística",
    order: 0,
  },
  modules: [delivery_return_module, delivery_package_module, pedidos_module, delivery_package_manifiesto_module, reparto_module, entregas_module, delivery_route_module, delivery_route_mapa_module],
  seed: seed_demo,
});

export const KIRLET = SUBJECT;
