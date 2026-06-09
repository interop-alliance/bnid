// React Native support
//
// Requires the `react-native-get-random-values` polyfill, imported once at the
// top of the app entry, so that `globalThis.crypto.getRandomValues()` is
// available. See the README "React Native" section.
const crypto = globalThis.crypto

export async function getRandomBytes(buf: Uint8Array): Promise<Uint8Array> {
  return crypto.getRandomValues(buf)
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(d => d.toString(16).padStart(2, '0'))
    .join('')
}

// adapted from:

// https://stackoverflow.com/questions/43131242/how-to-convert-a-hexadecimal-string-of-data-to-an-arraybuffer-in-javascript
export function bytesFromHex(hex: string): Uint8Array {
  if (hex.length === 0) {
    return new Uint8Array()
  }
  // @ts-expect-error - match() is non-null for validated hex input
  return new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)))
}
