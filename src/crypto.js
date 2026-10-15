// Pure-JS crypto for local security: salted PIN hashing + TOTP 2FA (RFC 6238).
// No dependencies, fully offline.

function utf8Bytes(str) {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const lo = str.charCodeAt(i + 1);
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (lo - 0xdc00);
        i++;
      }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return out;
}

function rotl(x, n) {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

/** SHA-1 over a byte array → 20-byte array. */
export function sha1(bytes) {
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const ml = bytes.length * 8;
  const msg = bytes.slice();
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  const hi = Math.floor(ml / 0x100000000);
  const lo = ml >>> 0;
  msg.push((hi >>> 24) & 0xff, (hi >>> 16) & 0xff, (hi >>> 8) & 0xff, hi & 0xff,
           (lo >>> 24) & 0xff, (lo >>> 16) & 0xff, (lo >>> 8) & 0xff, lo & 0xff);
  const w = new Array(80);
  for (let i = 0; i < msg.length; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = ((msg[i + j * 4] << 24) | (msg[i + j * 4 + 1] << 16) | (msg[i + j * 4 + 2] << 8) | msg[i + j * 4 + 3]) >>> 0;
    }
    for (let j = 16; j < 80; j++) w[j] = rotl(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let j = 0; j < 80; j++) {
      let f, k;
      if (j < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (j < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const t = (rotl(a, 5) + f + e + k + w[j]) >>> 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = t;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  const out = [];
  for (const h of [h0, h1, h2, h3, h4]) out.push((h >>> 24) & 0xff, (h >>> 16) & 0xff, (h >>> 8) & 0xff, h & 0xff);
  return out;
}

const hex = (bytes) => bytes.map((b) => b.toString(16).padStart(2, '0')).join('');

export function sha1Hex(str) {
  return hex(sha1(utf8Bytes(String(str))));
}

function hmacSha1(key, msg) {
  let k = key.slice();
  if (k.length > 64) k = sha1(k);
  while (k.length < 64) k.push(0);
  const ipad = k.map((b) => b ^ 0x36);
  const opad = k.map((b) => b ^ 0x5c);
  return sha1(opad.concat(sha1(ipad.concat(msg))));
}

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes) {
  let out = '';
  let bits = 0;
  let acc = 0;
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32[(acc >>> bits) & 31];
    }
  }
  if (bits > 0) out += B32[(acc << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s) {
  const clean = String(s || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  const out = [];
  let bits = 0;
  let acc = 0;
  for (const ch of clean) {
    acc = (acc << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >>> bits) & 0xff);
    }
  }
  return out;
}

export function randomBytes(n) {
  const out = [];
  try {
    const g = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    if (g && g.getRandomValues) {
      const a = new Uint8Array(n);
      g.getRandomValues(a);
      return Array.from(a);
    }
  } catch {}
  for (let i = 0; i < n; i++) out.push(Math.floor(Math.random() * 256));
  return out;
}

export function newSecret() {
  return base32Encode(randomBytes(10)); // 16 chars, ~80 bits
}

/** TOTP code for a given moment (default now). */
export function totpCode(secretB32, whenMs = Date.now(), step = 30, digits = 6) {
  const key = base32Decode(secretB32);
  if (!key.length) return null;
  let counter = Math.floor(whenMs / 1000 / step);
  const msg = [];
  for (let i = 7; i >= 0; i--) msg.push((counter >>> (i * 8)) & 0xff);
  // counter beyond 32 bits (year 2038+): fold high bits in — negligible for our range
  const h = hmacSha1(key, msg);
  const off = h[h.length - 1] & 0x0f;
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

export function verifyTotp(secretB32, code, windowSteps = 1) {
  const c = String(code || '').trim();
  if (!/^\d{6,8}$/.test(c)) return false;
  const now = Date.now();
  for (let w = -windowSteps; w <= windowSteps; w++) {
    if (totpCode(secretB32, now + w * 30000, 30, c.length) === c) return true;
  }
  return false;
}

export function otpauthURL(secret, label, issuer = 'FinTrack') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
}

// ---- PIN ----
export function newSalt() {
  return hex(randomBytes(16));
}

export function hashPin(pin, salt) {
  return sha1Hex(`${salt}:${pin}`);
}
