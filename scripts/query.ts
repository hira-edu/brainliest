import { createDrizzleClient } from '../packages/db/src/client';
import * as schema from '../packages/db/src/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const db = createDrizzleClient();

  const questions = await db
    .select({
      id: schema.questions.id,
      examSlug: schema.questions.examSlug,
      subjectSlug: schema.questions.subjectSlug,
    })
    .from(schema.questions)
    .where(eq(schema.questions.examSlug, 'algebra-ii-midterm'));

  console.log(questions);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
