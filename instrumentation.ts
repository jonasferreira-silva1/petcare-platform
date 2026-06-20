/**
 * Next.js Instrumentation hook.
 * Roda uma vez quando o servidor inicia (dev e produção).
 * Garante que todas as tabelas existam no banco antes de qualquer requisição.
 */
export async function register() {
  // Só roda no servidor Node.js (não no edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("@/lib/db/migrate")
    await runMigrations()
  }
}
