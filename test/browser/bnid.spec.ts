import { test, expect } from '@playwright/test'

// Smoke test: proves the bundle loads in-browser and that the browser `util`
// implementation (Web Crypto `globalThis.crypto.getRandomValues`) drives a
// generate + decode round-trip.
test('bnid generates and decodes an id in the browser', async ({ page }) => {
  await page.goto('/test/index.html')
  const result = await page.evaluate(async () => {
    const { generateId, decodeId } = await import('/src/index.ts')
    const id = await generateId({})
    const decoded = decodeId({ id })
    return {
      id,
      isString: typeof id === 'string',
      isUint8Array: decoded instanceof Uint8Array,
      decodedLength: decoded.length
    }
  })
  expect(result.isString).toBe(true)
  expect(result.id).toMatch(/^z/)
  expect(result.isUint8Array).toBe(true)
  expect(result.decodedLength).toBe(16)
})
