import { describe, it, expect } from 'vitest'

describe('Vitest Setup', () => {
  it('should be properly configured', () => {
    expect(true).toBe(true)
  })

  it('should support async tests', async () => {
    const result = await Promise.resolve(42)
    expect(result).toBe(42)
  })

  it('should handle typescript types', () => {
    const add = (a: number, b: number): number => a + b
    expect(add(2, 3)).toBe(5)
  })
})