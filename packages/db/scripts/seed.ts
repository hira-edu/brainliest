import { createDrizzleClient } from '../src/client';
import { seedBaseData } from '../src/seeds/base-data';

async function main() {
  const db = createDrizzleClient();
  try {
    await seedBaseData(db);
  } finally {
    // postgres.js closes connections when the process exits; explicit teardown can be added when pooling is introduced.
  }
}

main().catch((error) => {
  console.error('Seed script failed', error);
  process.exit(1);
});
