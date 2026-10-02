import { define_routes, type KirletCtx } from "@opus-perpetuus/imperium-core-kit";

const TABLE = "delivery_package";

function vehicle_ids(query: URLSearchParams): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const raw of query.getAll("vehicle")) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function cmp_text(a: unknown, b: unknown): number {
  const left = String(a ?? "");
  const right = String(b ?? "");
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function texto_ids(body: unknown): string[] {
  if (!body || typeof body !== "object" || Array.isArray(body)) return [];
  const raw = (body as { ids?: unknown }).ids;
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function eventos_de(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return [...raw];
}

function rechazo_salida(estado: string): string | null {
  if (estado === "cancelado") {
    return "No puedes operar logística sobre un bulto anulado";
  }
  if (estado === "entregado") {
    return "Este bulto ya fue entregado";
  }
  if (estado === "incidencia") {
    return "No puedes marcar salida a ruta sobre un bulto marcado como incidencia";
  }
  if (estado !== "cargado" && estado !== "en_ruta") {
    return "Solo puedes marcar salida a ruta de un bulto cargado. Registra la carga primero.";
  }
  return null;
}

function mensaje_salida(en_ruta: number, failed: number): string {
  if (failed > 0) {
    return `Pasaron a en ruta: ${en_ruta}. No pasaron: ${failed}.`;
  }
  if (en_ruta === 1) return "Bulto marcado en ruta";
  return `${en_ruta} bultos marcados en ruta`;
}

async function listar_salida(ctx: KirletCtx) {
  const vehicles = vehicle_ids(ctx.query);
  if (!vehicles.length) {
    return {
      data: [],
      message: "Indica el vehículo",
      total_elementos: 0,
    };
  }
  const rows = await ctx.repo(TABLE).findMany({
    where: {
      estado: "cargado",
      vehicle: { in: vehicles },
    },
  });
  const data = rows
    .filter((row) => row.is_active !== false)
    .sort((a, b) => {
      const by_codigo = cmp_text(a.codigo_bulto, b.codigo_bulto);
      if (by_codigo !== 0) return by_codigo;
      return cmp_text(a.id, b.id);
    });
  return {
    data,
    message: "Bultos cargados",
    total_elementos: data.length,
  };
}

async function marcar_salida(ctx: KirletCtx) {
  const ids = texto_ids(await ctx.body());
  if (!ids.length) {
    return ctx.fail("validation_error", "Indica al menos un bulto", 400);
  }
  const repo = ctx.repo(TABLE);
  const data = [];
  const errors: Array<{ id: string; message: string }> = [];
  for (const id of ids) {
    try {
      const row = await repo.findById(id);
      if (!row || row.is_active === false) {
        errors.push({ id, message: "No se encontró el bulto indicado" });
        continue;
      }
      const estado = String(row.estado ?? "").trim();
      const rechazo = rechazo_salida(estado);
      if (rechazo) {
        errors.push({ id, message: rechazo });
        continue;
      }
      if (estado === "en_ruta") {
        data.push(row);
        continue;
      }
      const evento = {
        event_id: crypto.randomUUID(),
        event_type: "depart",
        created_at: new Date().toISOString(),
        source: "online",
        actor: ctx.actor ?? "",
      };
      const patch = {
        estado: "en_ruta",
        logistics_events: [...eventos_de(row.logistics_events), evento],
        last_logistics_event_type: "depart",
      };
      const updated = await ctx.data.update(TABLE, { id }, patch);
      data.push(updated ?? { ...row, ...patch });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo marcar la salida";
      errors.push({ id, message });
    }
  }
  const en_ruta = data.length;
  const failed = errors.length;
  return {
    data,
    message: mensaje_salida(en_ruta, failed),
    en_ruta,
    failed,
    errors,
  };
}

export const salida_routes = define_routes({
  "GET /entregas/salida": listar_salida,
  "POST /entregas/salida": marcar_salida,
});
