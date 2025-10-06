import { expect } from 'vitest'
import type { PostgresError } from '../../types'

export function expectPostgresError(error: unknown, pattern: RegExp): void {
  const pgError = error as PostgresError
  expect(pgError.message).toMatch(pattern)
}