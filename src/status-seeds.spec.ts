import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  LOGISTICS_STATUS_MODEL_IDS,
  push_status_seeds,
  STATUS_OPTION_SEED_PATH,
  STATUS_OPTION_SEEDS,
} from "./status-seeds";
import { LOGISTICS_STATUS_OPTIONS } from "./status-options";

const PAGE_FILES = [
  "./modules/pedidos/pedidos.pages.ts",
  "./modules/entregas/entregas.pages.ts",
  "./modules/reparto/reparto.pages.ts",
  "./modules/delivery-package/delivery-package.pages.ts",
  "./modules/delivery-package-manifiesto/delivery-package-manifiesto.pages.ts",
] as const;

describe("status seeds", () => {
  test("una lista compartida en los 5 model_id", () => {
    expect(STATUS_OPTION_SEEDS.map((s) => s.model_id)).toEqual([...LOGISTICS_STATUS_MODEL_IDS]);
    expect(LOGISTICS_STATUS_OPTIONS).toHaveLength(7);
    for (const s of STATUS_OPTION_SEEDS) {
      const values = s.options.map((o) => o.value);
      expect(new Set(values).size).toBe(values.length);
      expect(s.status_fields).toEqual(["estado"]);
      expect(s.options.every((o) => o.field_name === "estado")).toBe(true);
      expect(
        s.options.every((o) => /^#[0-9a-f]{6}$/.test(o.color) && /^fas fa-[a-z0-9-]+$/.test(o.icon ?? "")),
      ).toBe(true);
      expect(s.options.map((o) => o.value)).toEqual(LOGISTICS_STATUS_OPTIONS.map((o) => o.value));
    }
  });

  test("páginas usan input-status sin options literales", () => {
    for (const rel of PAGE_FILES) {
      const src = readFileSync(new URL(rel, import.meta.url), "utf8");
      expect(src).toMatch(/name:\s*"estado"/);
      expect(src).toMatch(/component:\s*"input-status"/);
      expect(src).not.toMatch(/name:\s*"estado"[\s\S]*?options:\s*\[/);
      expect(src).not.toMatch(/component:\s*"input-menu"/);
    }
  });
});

describe("push_status_seeds", () => {
  const env = {
    CORE_DATA_URL: "http://core:3000/api/kirlets/data/x",
    SUBJECT_TECHNICAL_ID: "subject-logistica",
    CORE_SUBJECT_GATEWAY_SECRET: "s",
  };

  test("sin env no llama", async () => {
    let called = false;
    const r = await push_status_seeds({
      env: {},
      fetchImpl: (async () => {
        called = true;
        return new Response();
      }) as unknown as typeof fetch,
    });
    expect(r).toEqual({ pushed: false, reason: "core_not_configured" });
    expect(called).toBe(false);
  });

  test("POST entries a seed-defaults del núcleo", async () => {
    let url = "";
    let init: RequestInit | undefined;
    const fetchImpl = (async (u: string, i: RequestInit) => {
      url = u;
      init = i;
      return Response.json({ data: [{ inserted: 35 }] });
    }) as unknown as typeof fetch;
    const r = await push_status_seeds({ env, fetchImpl });
    expect(url).toBe(`http://core:3000${STATUS_OPTION_SEED_PATH}`);
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body.entries.map((e: { model_id: string }) => e.model_id)).toEqual([
      ...LOGISTICS_STATUS_MODEL_IDS,
    ]);
    expect((init?.headers as Record<string, string>)["x-imperium-subject"]).toBe("subject-logistica");
    expect(r.pushed).toBe(true);
  });

  test("rechazo del núcleo no lanza", async () => {
    const fetchImpl = (async () => Response.json({ error: "x" }, { status: 401 })) as unknown as typeof fetch;
    expect(await push_status_seeds({ env, fetchImpl })).toEqual({
      pushed: false,
      reason: "core_refused",
      status: 401,
    });
  });
});
