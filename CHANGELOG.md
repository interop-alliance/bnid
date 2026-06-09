# @interop/bnid ChangeLog

## 6.0.0-6.0.1 - 2026-06-08

### Changed

- **BREAKING**: Fork to `@interop/bnid`.
- **BREAKING**: Replace `base-x` dependency with `@scure/base` (`base58`).
- **BREAKING**: React Native now uses the Web Crypto `crypto.getRandomValues()`
  API instead of `react-native-securerandom`. Consumers must install the
  `react-native-get-random-values` polyfill (declared as an optional
  `peerDependency`) and import it once at their app entry. See the README.

### Removed

- Remove `react-native-securerandom` dependency.

## 5.0.0 - 2026-05-24

### Changed

- Bump `base-x` dependency to latest (v5.0.0).

## 4.0.0 - 2025-05-16

### Changed

- **BREAKING**: Convert to Typescript (still also exports Javascript).

## 3.0.1 - 2024-01-23

### Changed

- Replace `@digitalcredentials/base58-universal` with `base-x` dependency.

## 3.0.0 - 2024-01-23

### Removed

- **BREAKING**: Move command line client into
  [`bnid-cli`](https://github.com/digitalbazaar/bnid-cli). The primary reason is
  to reduce `bnid` dependencies.

## 2.1.2 - 2022-01-28

### Changed

- Fix Rollup config for React Native.

## 2.1.1 - 2022-01-26

### Changed

- Remove runtime `esm` transpiler usage, add support for Typescript and React
  Native.

## 2.1.0 - 2021-11-18

### Added

- Add `generateSecretKeySeed()` and `decodeSecretKeySeed()`.
- Add `multihash` boolean parameter to IdEncoder and IdDecoder. A
  multihash-encoded identifier will use the `identity` multicodec tag (`0x00`).
  Using multihash has the advantage of including the size of the identifier
  which can then be verified to have not changed when decoding.
- Add `expectedSize` optional parameter to IdDecoder for multihash-encoded ID
  bytes. (default: 32).

## 2.0.0 - 2020-05-22

### Changed

- **BREAKING**: `multibase` now defaults to `true` for all APIs.
- Remove travis-ci testing in favor of GitHub Actions.

### Added

- Command line tool `bnid`.
- `min/maxEncodedIdBytes` utiltiies. Useful for variable length encodings such
  as `base58`.

## 1.0.0 - 2020-05-07

### Added

- Add core files.

- See git history for changes previous to this release.
