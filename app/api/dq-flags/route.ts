// GET /api/dq-flags -> { flags: DataQualityFlag[], source: "db" | "sample" }
// Reads dq_flags. Falls back to data/sample/dq-flags.json only when the table is empty or the read fails.
import { connection } from "next/server";
import type { DataQualityFlag } from "@/types";
import sample from "@/data/sample/dq-flags.json";
import { getBrowserDb } from "@/lib/db/browser";
import { listDqFlags } from "@/lib/db/queries";
import { dbOrSample, toDqFlag } from "@/lib/db/mappers";
import { stripNote } from "../_lib/json";

export async function GET() {
  await connection();
  const body = await dbOrSample(
    async () => ({ flags: (await listDqFlags(getBrowserDb())).map(toDqFlag) }),
    (d) => d.flags.length === 0,
    stripNote(sample) as { flags: DataQualityFlag[] },
  );
  return Response.json(body);
}
