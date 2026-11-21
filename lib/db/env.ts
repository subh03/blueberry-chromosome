// Reads a required env var with a clear error instead of a silent undefined.
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var ${name}. Copy .env.example to .env.local and fill it in.`);
  return value;
}
