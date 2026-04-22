import path from "node:path";

import { createNexRuntime } from "@nex/ssot";

const dataFilePath = path.join(process.cwd(), "data", "founder-os.v1.json");

export const nexRuntime = createNexRuntime(dataFilePath);

export async function ensureNexSeed() {
  return nexRuntime.services.seed.ensureFounderOsSeed();
}

