import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import * as matchers from 'jest-axe/dist/to-have-no-violations';

expect.extend(matchers);
