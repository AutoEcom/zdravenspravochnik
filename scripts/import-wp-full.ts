import { runWpImport } from "./import-wp-sample"

runWpImport(true).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
