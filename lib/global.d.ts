// react-native-get-random-values (imported first in index.js) patches global.crypto
// at runtime to match the Web Crypto API. The RN TypeScript config omits the "dom"
// lib, so this declares just enough of it for callers like traceContext.ts.
declare global {
  interface Crypto {
    getRandomValues<T extends ArrayBufferView>(array: T): T;
  }
  var crypto: Crypto;
}

export {};
