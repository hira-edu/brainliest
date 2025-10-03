import 'server-only';

import { createRepositories, drizzleClient } from '@brainliest/db';

export const repositories = createRepositories(drizzleClient);
