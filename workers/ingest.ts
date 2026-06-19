// Standalone ingestion entrypoint (cron/worker). Run: npm run ingest
import { runIngestion } from "@/modules/ingestion/job";

runIngestion().catch((e) => {
  console.error(e);
  process.exit(1);
});
