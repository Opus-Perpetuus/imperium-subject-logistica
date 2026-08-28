import type { KirletDataClient, NoxServices } from "@opus-perpetuus/imperium-core-kit";
import { new_id, now_iso } from "@opus-perpetuus/imperium-core-kit";

export async function seed_demo(ctx: {
  data: KirletDataClient;
  nox: NoxServices;
  technical_id: string;
}): Promise<void> {
  const n = await ctx.data.count("delivery_return");
  if (n > 0) return;
  const ts = now_iso();
  await ctx.data.insert("delivery_return", {
    id: new_id("delivery"),
    name: "Devoluciones (ejemplo)",
    description: "Registro semilla de la app. Sustituye al migrar desde Mongo.",
    is_active: true,
    ref: "seed-logistica",
    created_at: ts,
    updated_at: ts,
  });
}
