import {
  keccak_224,
  keccak_256,
  keccak_384,
  keccak_512,
  sha3_224,
  sha3_256,
  sha3_384,
  sha3_512,
  shake128,
  shake256,
} from '@noble/hashes/sha3';

type HashFactory = typeof keccak_256;
type HashEncoding = 'hex' | 'base64';
type HashInput = string | ArrayBuffer | ArrayBufferView;

const ALGORITHMS: Record<string, HashFactory> = {
  keccak224: keccak_224,
  keccak256: keccak_256,
  keccak384: keccak_384,
  keccak512: keccak_512,
  'sha3-224': sha3_224,
  'sha3-256': sha3_256,
  'sha3-384': sha3_384,
  'sha3-512': sha3_512,
  shake128,
  shake256,
};

const encoder = new TextEncoder();

class NobleKeccakHash {
  private readonly ctx;

  constructor(factory: HashFactory) {
    this.ctx = factory.create();
  }

  update(data: HashInput) {
    this.ctx.update(toUint8Array(data));
    return this;
  }

  digest(encoding?: HashEncoding) {
    const bytes = Buffer.from(this.ctx.digest());
    return encoding ? bytes.toString(encoding) : bytes;
  }
}

function toUint8Array(data: HashInput): Uint8Array {
  if (typeof data === 'string') {
    return encoder.encode(data);
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  throw new TypeError('Unsupported data type for keccak hash input');
}

export default function createHash(algorithm: string) {
  const factory = ALGORITHMS[algorithm.toLowerCase()];

  if (!factory) {
    throw new Error(`Unsupported keccak algorithm: ${algorithm}`);
  }

  return new NobleKeccakHash(factory);
}
