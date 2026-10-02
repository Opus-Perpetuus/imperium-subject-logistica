import { describe, expect, test } from "bun:test";
import {
  create_kirlet_test_context,
  MemoryKirletDataClient,
  sign_kirlet_identity,
  type KirletGrant,
  type KirletServer,
} from "@opus-perpetuus/imperium-core-kit";
import { SUBJECT } from "../../subject.ts";

type Row = Record<string, unknown>;

function bulto(partial: Row): Row {
  return {
    id: "b1",
    name: "Bulto",
    is_active: true,
    estado: "cargado",
    vehicle: "veh-1",
    codigo_bulto: "BULTO-000001",
    logistics_events: [],
    last_logistics_event_type: "",
    updated_at: "2020-01-01T00:00:00.000Z",
    ...partial,
  };
}

async function with_rows(
  rows: Row[],
  run: (server: KirletServer, data: MemoryKirletDataClient) => Promise<void>,
) {
  const data = new MemoryKirletDataClient(SUBJECT.schema());
  data.seed("delivery_package", rows);
  const server = create_kirlet_test_context(SUBJECT, { data });
  try {
    await run(server, data);
  } finally {
    server.stop();
  }
}

function post_salida(
  server: KirletServer,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return server.fetch(
    new Request("http://t/entregas/salida", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
}

const GATEWAY_SECRET = "test-gateway-secret-32chars-min!!";

function firmar(grants: KirletGrant[]) {
  return sign_kirlet_identity(
    {
      user_id: "chofer-1",
      email: "chofer@local",
      is_admin: false,
      kirlet_id: SUBJECT.technical_id,
      grants,
    },
    GATEWAY_SECRET,
  );
}

describe("entregas salida", () => {
  test("salida queda antes de GET /entregas/:id", () => {
    const entregas = SUBJECT.modules.find((mod) => mod.resource === "entregas");
    const patterns = (entregas?.routes ?? []).map((route) => route.pattern);
    expect(patterns[0]).toBe("GET /entregas/salida");
    expect(patterns[1]).toBe("POST /entregas/salida");
    expect(patterns.indexOf("GET /entregas/salida")).toBeLessThan(
      patterns.indexOf("GET /entregas/:id"),
    );
  });

  test("GET lista solo cargados del vehículo pedido", async () => {
    await with_rows(
      [
        bulto({ id: "tarde", codigo_bulto: "BULTO-000010", vehicle: "veh-1" }),
        bulto({ id: "pronto", codigo_bulto: "BULTO-000002", vehicle: "veh-1", logistics_events: null }),
        bulto({ id: "otro-veh", codigo_bulto: "BULTO-000003", vehicle: "veh-2" }),
        bulto({ id: "ya-ruta", codigo_bulto: "BULTO-000001", vehicle: "veh-1", estado: "en_ruta" }),
        bulto({ id: "inactivo", codigo_bulto: "BULTO-000000", vehicle: "veh-1", is_active: false }),
        bulto({ id: "asignado", codigo_bulto: "BULTO-000004", vehicle: "veh-1", estado: "asignado" }),
        bulto({ id: "ajeno", codigo_bulto: "BULTO-000005", vehicle: "veh-3" }),
        bulto({ id: "sin-flag", codigo_bulto: "BULTO-000006", vehicle: "veh-2", is_active: undefined }),
      ],
      async (server) => {
        const res = await server.fetch(
          new Request("http://t/entregas/salida?vehicle=veh-1&vehicle=veh-2"),
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { data: Row[]; message: string; total_elementos: number };
        expect(body.data.map((row) => row.id)).toEqual(["pronto", "otro-veh", "sin-flag", "tarde"]);
        expect(body.total_elementos).toBe(4);
        expect(body.message).toBe("Bultos cargados");

        const vacio = await server.fetch(new Request("http://t/entregas/salida"));
        expect(vacio.status).toBe(200);
        const sin_vehiculo = (await vacio.json()) as { data: unknown[]; message: string; total_elementos: number };
        expect(sin_vehiculo.data).toEqual([]);
        expect(sin_vehiculo.total_elementos).toBe(0);
        expect(sin_vehiculo.message).toBe("Indica el vehículo");
      },
    );
  });

  test("GET /entregas/salida no lo captura :id", async () => {
    await with_rows(
      [
        bulto({ id: "salida", estado: "asignado", codigo_bulto: "BULTO-000099", vehicle: "veh-1" }),
        bulto({ id: "real", codigo_bulto: "BULTO-000001", vehicle: "veh-1" }),
      ],
      async (server) => {
        const res = await server.fetch(
          new Request("http://t/entregas/salida?vehicle=veh-1"),
        );
        expect(res.status).toBe(200);
        const body = (await res.json()) as { data: Row[]; total_elementos: number };
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.map((row) => row.id)).toEqual(["real"]);
        expect(body.total_elementos).toBe(1);

        const uno = await server.fetch(new Request("http://t/delivery-package/real"));
        expect(uno.status).toBe(200);
        const row = (await uno.json()) as { data: Row };
        expect(row.data.id).toBe("real");
      },
    );
  });

  test("POST cargado pasa a en_ruta con evento depart", async () => {
    const previo = {
      event_id: "prev",
      event_type: "load",
      created_at: "2020-01-01T00:00:00.000Z",
      source: "online",
      actor: "ana",
    };
    await with_rows(
      [
        bulto({
          id: "b1",
          name: "Caja 1",
          vehicle: "veh-9",
          logistics_events: null,
          last_logistics_event_type: "load",
        }),
        bulto({
          id: "b2",
          name: "Caja 2",
          codigo_bulto: "BULTO-000002",
          logistics_events: [previo],
        }),
      ],
      async (server, data) => {
        const res = await post_salida(server, { ids: ["  b1  ", "b1", "b2"] });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
          data: Row[];
          message: string;
          en_ruta: number;
          failed: number;
          errors: unknown[];
        };
        expect(body.en_ruta).toBe(2);
        expect(body.failed).toBe(0);
        expect(body.errors).toEqual([]);
        expect(body.message).toBe("2 bultos marcados en ruta");
        expect(body.data.map((row) => row.id)).toEqual(["b1", "b2"]);

        const uno = await post_salida(server, { ids: ["b1"] });
        const otra = (await uno.json()) as { message: string; en_ruta: number; failed: number };
        expect(otra.en_ruta).toBe(1);
        expect(otra.failed).toBe(0);
        expect(otra.message).toBe("Bulto marcado en ruta");

        const stored = await data.findOne("delivery_package", { id: "b1" });
        expect(stored?.estado).toBe("en_ruta");
        expect(stored?.last_logistics_event_type).toBe("depart");
        expect(stored?.name).toBe("Caja 1");
        expect(stored?.vehicle).toBe("veh-9");
        expect(stored?.updated_at).toBe("2020-01-01T00:00:00.000Z");
        const events = stored?.logistics_events as Row[];
        expect(events).toHaveLength(1);
        expect(events[0]?.event_type).toBe("depart");
        expect(events[0]?.source).toBe("online");
        expect(events[0]?.actor).toBe("dev@local");
        expect(events[0]?.event_id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
        expect(String(events[0]?.created_at)).toMatch(/^\d{4}-\d{2}-\d{2}T/);

        const segundo = await data.findOne("delivery_package", { id: "b2" });
        const historial = segundo?.logistics_events as Row[];
        expect(historial[0]).toEqual(previo);
        expect(historial[1]?.event_type).toBe("depart");
        expect(segundo?.last_logistics_event_type).toBe("depart");
      },
    );
  });

  test("POST sobre en_ruta es idempotente", async () => {
    const previo = {
      event_id: "prev",
      event_type: "load",
      created_at: "2020-01-01T00:00:00.000Z",
      source: "online",
      actor: "ana",
    };
    await with_rows(
      [
        bulto({
          id: "ruta",
          estado: "en_ruta",
          logistics_events: [previo],
          last_logistics_event_type: "load",
          name: "Ya salió",
        }),
      ],
      async (server, data) => {
        const res = await post_salida(server, { ids: ["ruta"] });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
          data: Row[];
          message: string;
          en_ruta: number;
          failed: number;
          errors: unknown[];
        };
        expect(body.en_ruta).toBe(1);
        expect(body.failed).toBe(0);
        expect(body.errors).toEqual([]);
        expect(body.message).toBe("Bulto marcado en ruta");
        expect(body.data[0]?.estado).toBe("en_ruta");
        expect(body.data[0]?.logistics_events).toEqual([previo]);
        expect(body.data[0]?.last_logistics_event_type).toBe("load");

        const stored = await data.findOne("delivery_package", { id: "ruta" });
        expect(stored?.estado).toBe("en_ruta");
        expect(stored?.logistics_events).toEqual([previo]);
        expect(stored?.last_logistics_event_type).toBe("load");
        expect(stored?.name).toBe("Ya salió");
        expect(stored?.updated_at).toBe("2020-01-01T00:00:00.000Z");
      },
    );
  });

  test("POST mixto cuenta un paso y tres fallos sin tocar los fallidos", async () => {
    await with_rows(
      [
        bulto({ id: "ok", estado: "cargado", name: "Ok", logistics_events: null }),
        bulto({
          id: "asig",
          estado: "asignado",
          name: "Asignado",
          logistics_events: [{ event_id: "a" }],
          last_logistics_event_type: "load",
        }),
        bulto({
          id: "ent",
          estado: "entregado",
          name: "Entregado",
          logistics_events: [],
          last_logistics_event_type: "delivery",
        }),
      ],
      async (server, data) => {
        const antes_asig = await data.findOne("delivery_package", { id: "asig" });
        const antes_ent = await data.findOne("delivery_package", { id: "ent" });
        const res = await post_salida(server, { ids: ["ok", "asig", "ent", "no-esta"] });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
          data: Row[];
          message: string;
          en_ruta: number;
          failed: number;
          errors: Array<{ id: string; message: string }>;
        };
        expect(body.en_ruta).toBe(1);
        expect(body.failed).toBe(3);
        expect(body.message).toBe("Pasaron a en ruta: 1. No pasaron: 3.");
        expect(body.data.map((row) => row.id)).toEqual(["ok"]);
        expect(body.data[0]?.estado).toBe("en_ruta");
        expect(body.errors).toEqual([
          {
            id: "asig",
            message: "Solo puedes marcar salida a ruta de un bulto cargado. Registra la carga primero.",
          },
          { id: "ent", message: "Este bulto ya fue entregado" },
          { id: "no-esta", message: "No se encontró el bulto indicado" },
        ]);

        const ok = await data.findOne("delivery_package", { id: "ok" });
        expect(ok?.estado).toBe("en_ruta");
        expect(ok?.last_logistics_event_type).toBe("depart");
        expect(ok?.name).toBe("Ok");

        const asig = await data.findOne("delivery_package", { id: "asig" });
        const ent = await data.findOne("delivery_package", { id: "ent" });
        expect(asig).toEqual(antes_asig);
        expect(ent).toEqual(antes_ent);
      },
    );
  });

  test("POST sin ids devuelve 400", async () => {
    await with_rows([], async (server) => {
      for (const body of [{}, { ids: [] }, { ids: ["  ", ""] }, { ids: "b1" }, { ids: [1] }]) {
        const res = await post_salida(server, body);
        expect(res.status).toBe(400);
        const payload = (await res.json()) as { error: string; message: string };
        expect(payload.error).toBe("validation_error");
        expect(payload.message).toBe("Indica al menos un bulto");
      }
    });
  });

  test("grant de entregas autoriza salida; sin ese grant responde 403", async () => {
    const data = new MemoryKirletDataClient(SUBJECT.schema());
    data.seed("delivery_package", [
      bulto({ id: "b1", estado: "cargado", vehicle: "veh-1", codigo_bulto: "BULTO-000001" }),
    ]);
    const server = create_kirlet_test_context(SUBJECT, {
      data,
      auth_disabled: false,
      gateway_secret: GATEWAY_SECRET,
    });
    const chofer = firmar([
      { resource: "kirlet.logistica.entregas", c: true, r: true, u: true, d: true },
    ]);
    const sin_entregas = firmar([
      { resource: "kirlet.logistica.delivery-package", c: true, r: true, u: true, d: true },
    ]);
    try {
      const list = await server.fetch(
        new Request("http://t/entregas/salida?vehicle=veh-1", { headers: chofer }),
      );
      expect(list.status).toBe(200);
      const listed = (await list.json()) as { data: Row[]; total_elementos: number };
      expect(listed.data.map((row) => row.id)).toEqual(["b1"]);
      expect(listed.total_elementos).toBe(1);

      const posted = await post_salida(server, { ids: ["b1"] }, chofer);
      expect(posted.status).toBe(200);
      const body = (await posted.json()) as { en_ruta: number; failed: number; data: Row[] };
      expect(body.en_ruta).toBe(1);
      expect(body.failed).toBe(0);
      expect(body.data.map((row) => row.id)).toEqual(["b1"]);
      const stored = await data.findOne("delivery_package", { id: "b1" });
      expect(stored?.estado).toBe("en_ruta");

      const no_get = await server.fetch(
        new Request("http://t/entregas/salida?vehicle=veh-1", { headers: sin_entregas }),
      );
      expect(no_get.status).toBe(403);
      const no_post = await post_salida(server, { ids: ["b1"] }, sin_entregas);
      expect(no_post.status).toBe(403);
    } finally {
      server.stop();
    }
  });
});
