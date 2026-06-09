/*!
 * Copyright (c) 2020-2022 Digital Bazaar, Inc. All rights reserved.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import {
  IdEncoder,
  IdDecoder,
  IdGenerator,
  generateId,
  decodeId,
  minEncodedIdBytes,
  maxEncodedIdBytes,
  generateSecretKeySeed,
  decodeSecretKeySeed
} from '../../src/index.js'

describe('bnid', () => {
  describe('utilities', () => {
    it('should calculate min/max of encoded bytes', async () => {
      const bitLengths: number[] = [8, 16, 32, 64, 128, 256]
      const data: Array<[string[], number[], number[]]> = [
        [
          ['hex', 'base16', 'base16upper'],
          [2, 4, 8, 16, 32, 64],
          [2, 4, 8, 16, 32, 64]
        ],
        [
          ['base58', 'base58btc'],
          [1, 2, 4, 8, 16, 32],
          [2, 3, 6, 11, 22, 44]
        ]
      ]

      function t({
        name,
        f,
        encoding,
        bitLength,
        multibase,
        expected
      }: {
        name: string
        f: typeof minEncodedIdBytes | typeof maxEncodedIdBytes
        encoding: string
        bitLength: number
        multibase: boolean
        expected: number
      }): void {
        const result = f({ encoding, bitLength, multibase })
        assert.equal(
          result,
          expected,
          JSON.stringify({ name, encoding, bitLength, multibase, expected })
        )
      }

      for (const [encodings, minBytes, maxBytes] of data) {
        for (const encoding of encodings) {
          for (const [i, bitLength] of bitLengths.entries()) {
            t({
              name: 'min',
              f: minEncodedIdBytes,
              encoding,
              bitLength,
              multibase: false,
              expected: minBytes[i]
            })
            t({
              name: 'min',
              f: minEncodedIdBytes,
              encoding,
              bitLength,
              multibase: true,
              expected: minBytes[i] + 1
            })
            t({
              name: 'max',
              f: maxEncodedIdBytes,
              encoding,
              bitLength,
              multibase: false,
              expected: maxBytes[i]
            })
            t({
              name: 'max',
              f: maxEncodedIdBytes,
              encoding,
              bitLength,
              multibase: true,
              expected: maxBytes[i] + 1
            })
          }
        }
      }
    })

    it('should reject unknown min encoding', async () => {
      assert.throws(() => {
        minEncodedIdBytes({
          encoding: 'baseBogus'
        } as any)
      })
    })

    it('should reject unknown max encoding', async () => {
      assert.throws(() => {
        maxEncodedIdBytes({
          encoding: 'baseBogus'
        } as any)
      })
    })
  })

  describe('IdGenerator', () => {
    it('should create IdGenerator', async () => {
      const d = new IdGenerator()
      assert.ok(d)
    })

    it('should generate default id', async () => {
      const d = new IdGenerator()
      const id = await d.generate()
      assert.ok(id)
      assert.ok(id instanceof Uint8Array)
      assert.equal(id.length, 16)
    })

    it('should generate 8 bit id', async () => {
      const d = new IdGenerator({ bitLength: 8 })
      const id = await d.generate()
      assert.ok(id)
      assert.ok(id instanceof Uint8Array)
      assert.equal(id.length, 1)
    })

    it('should not generate 0 bit id', async () => {
      assert.throws(() => {
        return new IdGenerator({ bitLength: 0 })
      })
    })

    it('should not generate odd bits id', async () => {
      assert.throws(() => {
        return new IdGenerator({ bitLength: 10 })
      })
    })
  })

  describe('IdEncoder', () => {
    describe('general', () => {
      it('should create IdEncoder', async () => {
        const e = new IdEncoder()
        assert.ok(e)
      })

      it('should reject unknown encoding', async () => {
        assert.throws(() => {
          return new IdEncoder({ encoding: 'baseBogus' })
        })
      })
    })

    describe('base16', () => {
      it('should create IdEncoder', async () => {
        const e = new IdEncoder({ encoding: 'base16' })
        assert.ok(e)
      })

      it('should b16 encode [0]', async () => {
        const e = new IdEncoder({ encoding: 'base16', multibase: false })
        const data = new Uint8Array([0])
        const d = e.encode(data)
        assert.equal(d, '00')
      })

      it('should multibase b16 encode [0]', async () => {
        const e = new IdEncoder({ encoding: 'base16', multibase: true })
        const d = e.encode(new Uint8Array([0]))
        assert.equal(d, 'f00')
      })

      it('should multibase b16u encode [0]', async () => {
        const e = new IdEncoder({ encoding: 'base16upper', multibase: true })
        const d = e.encode(new Uint8Array([0]))
        assert.equal(d, 'F00')
      })

      it('should hex encode [0]', async () => {
        const e = new IdEncoder({ encoding: 'hex', multibase: false })
        const d = e.encode(new Uint8Array([0]))
        assert.equal(d, '00')
      })

      it('should b16 encode data', async () => {
        const e = new IdEncoder({ encoding: 'base16', multibase: false })
        const data: Array<[Uint8Array, string]> = [
          [new Uint8Array([0x00, 0x00]), '0000'],
          [new Uint8Array([0x00, 0x01]), '0001'],
          [new Uint8Array([0x00, 0xff]), '00ff'],
          [new Uint8Array([0xff, 0x00]), 'ff00'],
          [new Uint8Array([0xff, 0xff]), 'ffff']
        ]
        for (const [input, expected] of data) {
          assert.equal(e.encode(input), expected)
        }
      })

      it('should b16u encode data', async () => {
        const e = new IdEncoder({ encoding: 'base16upper', multibase: false })
        const data: Array<[Uint8Array, string]> = [
          [new Uint8Array([0x00, 0x00]), '0000'],
          [new Uint8Array([0x00, 0x01]), '0001'],
          [new Uint8Array([0x00, 0xff]), '00FF'],
          [new Uint8Array([0xff, 0x00]), 'FF00'],
          [new Uint8Array([0xff, 0xff]), 'FFFF']
        ]
        for (const [input, expected] of data) {
          assert.equal(e.encode(input), expected)
        }
      })

      it('should b16 encode fixed input data', async () => {
        const e = new IdEncoder({
          encoding: 'base16',
          fixedLength: true,
          multibase: false
        })
        const data: Array<[Uint8Array, string]> = [
          [new Uint8Array([0x00, 0x00]), '0000'],
          [new Uint8Array([0x00, 0x01]), '0001'],
          [new Uint8Array([0x00, 0xff]), '00ff'],
          [new Uint8Array([0xff, 0x00]), 'ff00'],
          [new Uint8Array([0xff, 0xff]), 'ffff']
        ]
        for (const [input, expected] of data) {
          assert.equal(e.encode(input), expected)
        }
      })

      it('should b16 encode fixed size data', async () => {
        const e = new IdEncoder({
          encoding: 'base16',
          fixedBitLength: 32,
          multibase: false
        })
        const data: Array<[Uint8Array, string]> = [
          [new Uint8Array([0x00, 0x00]), '00000000'],
          [new Uint8Array([0x00, 0x01]), '00000001'],
          [new Uint8Array([0x00, 0xff]), '000000ff'],
          [new Uint8Array([0xff, 0x00]), '0000ff00'],
          [new Uint8Array([0xff, 0xff]), '0000ffff']
        ]
        for (const [input, expected] of data) {
          assert.equal(e.encode(input), expected)
        }
      })

      it('should not b16 encode too large fixed size data', async () => {
        const e = new IdEncoder({ encoding: 'base16', fixedBitLength: 16 })
        const inputs = [
          new Uint8Array([0x00, 0x00, 0x00]),
          new Uint8Array([0x00, 0x00, 0x00, 0x00])
        ]
        for (const input of inputs) {
          assert.throws(() => {
            e.encode(input)
          })
        }
      })
    })

    describe('base58', () => {
      it('should create IdEncoder', async () => {
        const e = new IdEncoder()
        assert.ok(e)
      })

      it('should default b58 encode [0]', async () => {
        const e = new IdEncoder()
        const d = e.encode(new Uint8Array([0]))
        assert.equal(d, 'z1')
      })

      it('should explicitly b58 encode [0]', async () => {
        const e = new IdEncoder({ encoding: 'base58', multibase: false })
        const d = e.encode(new Uint8Array([0]))
        assert.equal(d, '1')
      })

      it('should non-multibase b58btc encode [0]', async () => {
        const e = new IdEncoder({ encoding: 'base58btc', multibase: false })
        const d = e.encode(new Uint8Array([0]))
        assert.equal(d, '1')
      })

      it('should multibase b58 encode [0]', async () => {
        const e = new IdEncoder({ multibase: true })
        const d = e.encode(new Uint8Array([0]))
        assert.equal(d, 'z1')
      })

      it('should b58 encode data', async () => {
        const e = new IdEncoder({ multibase: false })
        const data: Array<[[number, number], string]> = [
          [[0x00, 0x00], '11'],
          [[0x00, 0x01], '12'],
          [[0x00, 0xff], '15Q'],
          [[0xff, 0x00], 'LQX'],
          [[0xff, 0xff], 'LUv']
        ]
        for (const [input, expected] of data) {
          assert.equal(e.encode(new Uint8Array(input)), expected)
        }
      })

      it('should b58 encode fixed input data', async () => {
        const e = new IdEncoder({ fixedLength: true, multibase: false })
        const data: Array<[[number, number], string]> = [
          [[0x00, 0x00], '111'],
          [[0x00, 0x01], '112'],
          [[0x00, 0xff], '15Q'],
          [[0xff, 0x00], 'LQX'],
          [[0xff, 0xff], 'LUv']
        ]
        for (const [input, expected] of data) {
          assert.equal(e.encode(new Uint8Array(input)), expected)
        }
      })

      it('should b58 encode fixed size data', async () => {
        const e = new IdEncoder({ fixedBitLength: 32, multibase: false })
        const data: Array<[[number, number], string]> = [
          [[0x00, 0x00], '111111'],
          [[0x00, 0x01], '111112'],
          [[0x00, 0xff], '11115Q'],
          [[0xff, 0x00], '111LQX'],
          [[0xff, 0xff], '111LUv']
        ]
        for (const [input, expected] of data) {
          assert.equal(e.encode(new Uint8Array(input)), expected)
        }
      })

      it('should not b58 encode too large fixed size data', async () => {
        const e = new IdEncoder({ fixedBitLength: 16 })
        const inputs: number[][] = [
          [0x00, 0x00, 0x00],
          [0x00, 0x00, 0x00, 0x00]
        ]
        for (const input of inputs) {
          assert.throws(() => {
            e.encode(new Uint8Array(input))
          })
        }
      })
    })
  })

  describe('IdDecoder', () => {
    describe('general', () => {
      it('should create IdDecoder', async () => {
        const d = new IdDecoder()
        assert.ok(d)
      })

      it('should not decode empty multibase data', async () => {
        const d = new IdDecoder()
        assert.throws(() => {
          d.decode('')
        })
      })

      it('should not decode invalid multibase data', async () => {
        const d = new IdDecoder()
        assert.throws(() => {
          d.decode('@0000')
        })
      })

      it('should reject invalid encoding', async () => {
        const d = new IdDecoder({ encoding: 'baseBogus', multibase: false })
        assert.throws(() => {
          d.decode('00')
        })
      })
    })

    describe('base16', () => {
      it('should create IdDecoder', async () => {
        const d = new IdDecoder({ encoding: 'base16' })
        assert.ok(d)
      })

      it('should default b16 decode "00"', async () => {
        const d = new IdDecoder({ encoding: 'base16', multibase: false })
        const b = d.decode('00')
        assert.ok(b instanceof Uint8Array)
        assert.equal(b.length, 1)
        assert.deepEqual(b, new Uint8Array([0]))
      })

      it('should default "hex" decode "00"', async () => {
        const d = new IdDecoder({ encoding: 'hex', multibase: false })
        const b = d.decode('00')
        assert.ok(b instanceof Uint8Array)
        assert.equal(b.length, 1)
        assert.deepEqual(b, new Uint8Array([0]))
      })

      it('should b16 decode data', async () => {
        const d = new IdDecoder({ encoding: 'base16', multibase: false })
        const data: Array<[number[], string]> = [
          [[0x00], '00'],
          [[0xff], 'ff'],
          [[0xff], 'FF'],
          [[0x00, 0x00], '0000'],
          [[0x00, 0xff], '00ff'],
          [[0xff, 0x00], 'ff00'],
          [[0xff, 0xff], 'ffff'],
          [[0xab, 0xcd], 'abcd'],
          [[0x98, 0x76], '9876'],
          [[0x12, 0x34, 0x56], '123456'],
          [
            [0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef],
            '0123456789abcdef'
          ],
          // TODO: more strict upper/lower for base16 encodings?
          [[0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef], '0123456789ABCDEF']
        ]
        for (const [expected, input] of data) {
          const decoded = d.decode(input)
          assert.deepEqual(decoded, new Uint8Array(expected))
        }
      })

      it('should b16 decode fixed size data', async () => {
        const d = new IdDecoder({
          encoding: 'base16',
          fixedBitLength: 16,
          multibase: false
        })
        const data: Array<[number[], string]> = [
          [[0x00, 0x00], '00'],
          [[0x00, 0x01], '01'],
          [[0x01, 0x02], '0102'],
          [[0x01, 0x02], '000102'],
          [[0x01, 0x02], '00000102']
        ]
        for (const [expected, input] of data) {
          const decoded = d.decode(input)
          assert.deepEqual(decoded, new Uint8Array(expected))
        }
      })

      it('should b16 decode multibase data', async () => {
        const d = new IdDecoder({ encoding: 'base16' })
        const data: Array<[number[], string]> = [
          [[0x00], 'f00'],
          [[0x00, 0x00], 'f0000'],
          [[0x01, 0x02], 'f0102'],
          [[0x00, 0xff], 'f00ff'],
          [[0xff, 0x00], 'fff00'],
          [[0xff, 0xff], 'fffff'],
          [[0x00, 0x00, 0x00], 'f000000'],
          [[0x00, 0x00, 0x01], 'f000001']
        ]
        for (const [expected, input] of data) {
          const decoded = d.decode(input)
          assert.deepEqual(decoded, new Uint8Array(expected))
        }
      })

      it('should not b16 decode invalid data', async () => {
        const d = new IdDecoder({ encoding: 'base16', multibase: false })
        const data = ['0', '000']
        for (const input of data) {
          assert.throws(() => {
            d.decode(input)
          })
        }
      })

      it('should not b16 decode too large fixed size data', async () => {
        const d = new IdDecoder({ encoding: 'base16', fixedBitLength: 16 })
        const data = ['010203']
        for (const input of data) {
          assert.throws(() => {
            d.decode(input)
          })
        }
      })
    })

    describe('base58', () => {
      it('should create IdDecoder', async () => {
        const d = new IdDecoder()
        assert.ok(d)
      })

      it('should default b58 decode "z1"', async () => {
        const d = new IdDecoder()
        const b = d.decode('z1')
        assert.ok(b instanceof Uint8Array)
        assert.equal(b.length, 1)
        assert.deepEqual(b, new Uint8Array([0]))
      })

      it('should b58 decode non-multibase data', async () => {
        const d = new IdDecoder({ multibase: false })
        const data: Array<[number[], string]> = [
          [[0x00, 0x00], '11'],
          [[0x00, 0x01], '12'],
          [[0x00, 0xff], '15Q'],
          [[0xff, 0x00], 'LQX'],
          [[0xff, 0xff], 'LUv']
        ]
        for (const [expected, input] of data) {
          const decoded = d.decode(input)
          assert.deepEqual(decoded, new Uint8Array(expected))
        }
      })

      it('should b58 decode fixed size data', async () => {
        const d = new IdDecoder({ fixedBitLength: 16, multibase: false })
        const data: Array<[number[], string]> = [
          [[0x00, 0x00], '111'],
          [[0x00, 0x01], '112'],
          [[0x00, 0xff], '15Q'],
          [[0xff, 0x00], 'LQX'],
          [[0xff, 0xff], 'LUv'],
          [[0x00, 0x00], '111111'],
          [[0x00, 0x01], '111112'],
          [[0x00, 0xff], '11115Q'],
          [[0xff, 0x00], '111LQX'],
          [[0xff, 0xff], '111LUv']
        ]
        for (const [expected, input] of data) {
          const decoded = d.decode(input)
          assert.deepEqual(decoded, new Uint8Array(expected))
        }
      })

      it('should b58 decode multibase data', async () => {
        const d = new IdDecoder()
        const data: Array<[number[], string]> = [
          [[0x00, 0x00], 'z11'],
          [[0x00, 0x01], 'z12'],
          [[0x00, 0xff], 'z15Q'],
          [[0xff, 0x00], 'zLQX'],
          [[0xff, 0xff], 'zLUv'],
          [[0x00, 0x00, 0x00], 'z111'],
          [[0x00, 0x00, 0x01], 'z112'],
          [[0xff, 0xff, 0xff], 'z2UzHL'],
          [[0x00, 0x00, 0x00, 0x00], 'z1111'],
          [[0xff, 0xff, 0xff, 0xff], 'z7YXq9G']
        ]
        for (const [expected, input] of data) {
          const decoded = d.decode(input)
          assert.deepEqual(decoded, new Uint8Array(expected))
        }
      })

      it('should not b58 decode invalid data', async () => {
        const d = new IdDecoder({ multibase: false })
        const data = ['0', 'O', 'I', 'l']
        for (const input of data) {
          assert.throws(() => {
            d.decode(input)
          })
        }
      })

      it('should not b58 decode too large fixed size data', async () => {
        const d = new IdDecoder({ fixedBitLength: 16 })
        const data = ['zfxr']
        for (const input of data) {
          assert.throws(() => {
            d.decode(input)
          })
        }
      })
    })
  })

  describe('generateId', () => {
    it('should generate default id', async () => {
      const id = await generateId({})
      assert.ok(typeof id === 'string')
      assert.ok(id.length >= minEncodedIdBytes())
      assert.ok(id.length <= maxEncodedIdBytes())
      assert.equal(id[0], 'z')
    })

    it('should generate default non-multibase id', async () => {
      const id = await generateId({ multibase: false })
      assert.ok(typeof id === 'string')
      assert.ok(id.length >= 21)
      assert.ok(id.length <= 22)
    })

    it('should generate default multibase fixed length id', async () => {
      const id = await generateId({ fixedLength: true, multibase: true })
      assert.ok(typeof id === 'string')
      assert.equal(id.length, maxEncodedIdBytes())
      assert.equal(id[0], 'z')
    })

    it('should generate 256 bit fixed length id', async () => {
      const id = await generateId({
        bitLength: 256,
        fixedLength: true,
        multibase: false
      })
      assert.ok(typeof id === 'string')
      assert.equal(id.length, 44)
    })
  })

  describe('decodeId', () => {
    it('should decode b16 ids', async () => {
      const data: Array<[number[], string]> = [
        [[0x00], '00'],
        [[0x01, 0x02], '0102'],
        [[0xff, 0x00, 0xff, 0x00], 'ff00ff00']
      ]
      for (const [expected, input] of data) {
        const decoded = decodeId({
          id: input,
          encoding: 'base16',
          multibase: false
        })
        assert.deepEqual(decoded, new Uint8Array(expected))
      }
    })

    it('should decode b58 ids', async () => {
      const data: Array<[number[], string]> = [
        [[0x00, 0x00], '11'],
        [[0x00, 0x01], '12'],
        [[0x00, 0xff], '15Q'],
        [[0xff, 0x00], 'LQX'],
        [[0xff, 0xff], 'LUv'],
        [[0x00, 0x00, 0x00], '111'],
        [[0x00, 0x00, 0x01], '112']
      ]
      for (const [expected, input] of data) {
        const decoded = decodeId({
          id: input,
          encoding: 'base58',
          multibase: false
        })
        assert.deepEqual(decoded, new Uint8Array(expected))
      }
    })

    it('should decode multibase ids', async () => {
      const data: Array<[number[], string]> = [
        [[0x00, 0x00], 'z11'],
        [[0x00, 0x01], 'z12'],
        [[0x00, 0xff], 'z15Q'],
        [[0xff, 0x00], 'zLQX'],
        [[0xff, 0xff], 'zLUv'],
        [[0x00, 0x00, 0x00], 'z111'],
        [[0x00, 0x00, 0x01], 'z112'],
        [[0x01, 0x02, 0x03], 'f010203'],
        [[0x0a, 0x0b, 0x0c], 'F0A0B0C']
      ]
      for (const [expected, input] of data) {
        const decoded = decodeId({ id: input })
        assert.deepEqual(decoded, new Uint8Array(expected))
      }
    })

    it('should decode multibase fixedLength ids', async () => {
      const data: Array<[number, number[], string]> = [
        [0, [], 'f'],
        [8, [0x00], 'z1'],
        [8, [0x00], 'f00'],
        [16, [0x00, 0x00], 'z1'],
        [16, [0x00, 0x00], 'z11'],
        [24, [0x00, 0x00, 0x00], 'z11'],
        [32, [0x00, 0x00, 0x00, 0x00], 'z1'],
        [32, [0x00, 0x00, 0x00, 0x00], 'z1111'],
        [24, [0x00, 0x00, 0x12], 'F12'],
        [32, [0x00, 0x00, 0x00, 0x01], 'z12'],
        [32, [0x00, 0x00, 0x00, 0xff], 'z15Q'],
        [32, [0x00, 0x00, 0xff, 0x00], 'zLQX'],
        [32, [0x00, 0x00, 0xff, 0xff], 'zLUv'],
        [32, [0x00, 0x00, 0x00, 0x00], 'z111'],
        [32, [0x00, 0x00, 0x00, 0x01], 'z112'],
        [32, [0x0a, 0x0b, 0x0c, 0x0d], 'f0a0b0c0d']
      ]
      for (const [fixedBitLength, expected, input] of data) {
        const decoded = decodeId({ id: input, fixedBitLength })
        assert.deepEqual(decoded, new Uint8Array(expected))
      }
    })
  })

  describe('secret key seed', () => {
    it('should generate a secret key seed', async () => {
      let secretKeySeed
      let err
      try {
        secretKeySeed = await generateSecretKeySeed()
      } catch (e) {
        err = e
      }
      assert.ok(secretKeySeed)
      assert.ok(!err)
      if (!secretKeySeed) {
        throw new Error('unreachable')
      }
      assert.ok(typeof secretKeySeed === 'string')
      assert.equal(secretKeySeed.length, 47)
    })

    it('should generate a secret key seed with bitLength of 42 * 8', async () => {
      let secretKeySeed
      let err
      const bitLength = 42 * 8
      try {
        secretKeySeed = await generateSecretKeySeed({ bitLength })
      } catch (e) {
        err = e
      }
      assert.ok(secretKeySeed)
      assert.ok(!err)
      assert.ok(typeof secretKeySeed === 'string')
      if (!secretKeySeed) {
        throw new Error('unreachable')
      }
      assert.equal(secretKeySeed.length, 61)
    })

    it('should decode secret key seed', async () => {
      const secretKeySeed = 'z1Abn5R8HRLXKJvLQP1AzxFBGX2D1YdCo5d5BvvNw73nMzv'
      const expected = new Uint8Array([
        80, 174, 15, 131, 124, 59, 9, 51, 145, 129, 92, 157, 157, 172, 161, 79,
        74, 61, 152, 152, 48, 151, 20, 89, 225, 169, 71, 34, 49, 61, 21, 215
      ])
      let decoded: Uint8Array | null = null
      let err: any
      try {
        decoded = decodeSecretKeySeed({ secretKeySeed })
      } catch (e) {
        err = e
      }
      assert.ok(decoded !== null)
      assert.ok(!err)
      assert.ok((decoded as Uint8Array) instanceof Uint8Array)
      assert.deepEqual(decoded as Uint8Array, expected)
      assert.equal((decoded as Uint8Array).byteLength, 32)
    })

    it('should decode secret key seed with expectedSize of 42', async () => {
      const secretKeySeed =
        'z146fHWeH32ZP1cCG3dz2ZemzvZjPcj5ycsFFanAB6X1frDDxmoAocPx5RC3A'
      const expectedSize = 42
      const expected = new Uint8Array([
        12, 221, 206, 72, 148, 144, 98, 171, 251, 157, 183, 76, 211, 255, 124,
        101, 204, 77, 32, 220, 135, 90, 102, 87, 222, 55, 82, 154, 164, 35, 115,
        242, 173, 73, 109, 91, 252, 206, 191, 108, 215, 105
      ])
      let decoded: Uint8Array | null = null
      let err: any
      try {
        decoded = decodeSecretKeySeed({ secretKeySeed, expectedSize })
      } catch (e) {
        err = e
      }
      assert.ok(decoded !== null)
      assert.ok(!err)
      assert.ok((decoded as Uint8Array) instanceof Uint8Array)
      assert.deepEqual(decoded as Uint8Array, expected)
      assert.equal((decoded as Uint8Array).byteLength, 42)
    })

    it('should throw error if identifier size does not match "expectedSize"', async () => {
      const secretKeySeed =
        'z1ehDNc1UiwtuiZ3gFRCxm63JWF8RzcY1TkAtXm8rpC3MAhUPQVaMffvKX9'
      let decoded: Uint8Array | undefined
      let err: any
      try {
        decoded = decodeSecretKeySeed({ secretKeySeed, expectedSize: 0 })
      } catch (e) {
        err = e
      }
      assert.ok(!decoded)
      assert.ok(err)
      assert.equal((err as Error).message, 'Unexpected identifier size.')
    })

    it('should throw error if multihash function code is invalid.', async () => {
      const secretKeySeed =
        'zNy1YDSXV7dD3XzGaj1zVP7ypX3vf66auadQ5FouvcaKjqDXWpB1zNK5KBW1'
      let decoded: Uint8Array | undefined
      let err: any
      try {
        decoded = decodeSecretKeySeed({ secretKeySeed })
      } catch (e) {
        err = e
      }
      assert.ok(!decoded)
      assert.ok(err)
      assert.equal((err as Error).message, 'Invalid multihash function code.')
    })

    it('should throw error if identifier size is greater than 127', async () => {
      let secretKeySeed: string | undefined
      let err: any
      const bitLength = 128 * 8
      try {
        secretKeySeed = await generateSecretKeySeed({ bitLength })
      } catch (e) {
        err = e
      }
      assert.ok(!secretKeySeed)
      assert.ok(err)
      assert.equal((err as Error).message, 'Identifier size too large.')
    })

    it('should throw error if decoded identifier size is greater than 127', async () => {
      const secretKeySeed =
        'z1219W7SyWvDy6ueLyvNirtibEkZdHpfP5BNTQG5Pv8tFKaqqnAkS7d7Pi5XeNEL' +
        '6MyCyjqURq33GYgFJPb8pjM6QmmZGY2hK53wos9XBCtcPswJPd583teDaZX9b2gn' +
        'aAfCqyY1gJ2fymS1uXUkmoBRYA5TM9LHxk5fsRiiy3Zqtp9UfHH'
      let decoded: Uint8Array | undefined
      let err: any
      try {
        decoded = decodeSecretKeySeed({ secretKeySeed })
      } catch (e) {
        err = e
      }
      assert.ok(!decoded)
      assert.ok(err)
      assert.equal((err as Error).message, 'Decoded identifier size too large.')
    })
  })
})
