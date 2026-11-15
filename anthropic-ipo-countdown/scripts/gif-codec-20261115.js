// A small GIF reader and writer, enough for the galaxy cards. No packages needed.
// Writing is the LZW of Ableton Live Discord Presence's gif-encoder, with two additions: a frame can store only the
// pixels that changed since the last one (the rest are transparent, so the black edge costs almost nothing), and an
// animation can play once instead of looping.

function lzw(indices, minCodeSize) {
  const clear = 1 << minCodeSize, end = clear + 1;
  const bytes = [];
  let size = minCodeSize + 1, next = end + 1, bits = 0, bitCount = 0;
  const dict = new Map();
  const maxCode = () => size === 12 ? 4096 : (1 << size) - 1;
  const emit = code => {
    bits |= code << bitCount;
    bitCount += size;
    while (bitCount >= 8) { bytes.push(bits & 0xff); bits >>>= 8; bitCount -= 8; }
  };
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = prefix * 256 + k;
    const found = dict.get(key);
    if (found !== undefined) { prefix = found; continue; }
    emit(prefix);
    // The decoder lags one entry behind, so widen codes only once the next entry would not fit.
    if (next > maxCode() && size < 12) size++;
    if (next < 4096) dict.set(key, next++);
    else { emit(clear); dict.clear(); size = minCodeSize + 1; next = end + 1; }
    prefix = k;
  }
  emit(prefix);
  if (next > maxCode() && size < 12) size++;
  emit(end);
  if (bitCount > 0) bytes.push(bits & 0xff);
  return bytes;
}

// Reads a GIF made of whole frames on one global palette (as the galaxy cards are): its size, palette and frames.
export function decodeGif(gif) {
  let p = 6;
  const width = gif.readUInt16LE(p), height = gif.readUInt16LE(p + 2), flags = gif[p + 4];
  p += 7;
  const palette = [];
  if (flags & 0x80) for (let i = 0; i < 1 << ((flags & 7) + 1); i++, p += 3) palette.push([gif[p], gif[p + 1], gif[p + 2]]);
  const frames = [], delays = [];
  let delay = 10;
  while (gif[p] !== 0x3b) {
    if (gif[p] === 0x21) {
      if (gif[p + 1] === 0xf9) delay = gif.readUInt16LE(p + 4);
      p += 2; while (gif[p]) p += gif[p] + 1; p++; continue;
    }
    if (gif[p] !== 0x2c) throw new Error('Unexpected GIF block.');
    const packed = gif[p + 9];
    if (packed & 0x80) throw new Error('Frames with their own colours are not supported.');
    if (gif.readUInt16LE(p + 5) !== width || gif.readUInt16LE(p + 7) !== height) throw new Error('Only whole frames are supported.');
    p += 10;
    const min = gif[p++], data = [];
    while (gif[p]) { for (let i = 1; i <= gif[p]; i++) data.push(gif[p + i]); p += gif[p] + 1; }
    p++;
    const clear = 1 << min, end = clear + 1, out = new Uint8Array(width * height);
    let size = min + 1, dict = [], prev = null, bit = 0, n = 0;
    const reset = () => { dict = []; for (let i = 0; i < clear; i++) dict[i] = [i]; dict[clear] = []; dict[end] = []; size = min + 1; prev = null; };
    reset();
    for (;;) {
      let code = 0;
      for (let i = 0; i < size; i++, bit++) code |= ((data[bit >> 3] >> (bit & 7)) & 1) << i;
      if (code === clear) { reset(); continue; }
      if (code === end || bit > data.length * 8) break;
      const entry = code < dict.length ? dict[code] : [...prev, prev[0]];
      for (const v of entry) out[n++] = v;
      if (prev) dict.push([...prev, entry[0]]);
      prev = entry;
      if (dict.length === 1 << size && size < 12) size++;
    }
    frames.push(out); delays.push(delay);
  }
  return { width, height, palette, frames, delays };
}

// palette: up to 256 [r, g, b]; frames: Uint8Array of palette indices, width*height each; delays: 1/100 s each.
// transparent: a palette index never used by a pixel; when given, each frame after the first keeps only the pixels
// that changed. loop: false plays the animation once and stops on its last frame.
export function encodeGif(width, height, palette, frames, delays, { transparent = null, loop = true } = {}) {
  const depth = 8, minCodeSize = 8;
  const out = [];
  const push = bytes => { for (const b of bytes) out.push(b); };
  const u16 = n => out.push(n & 0xff, n >> 8);
  push(Buffer.from('GIF89a'));
  u16(width); u16(height);
  out.push(0xf0 | (depth - 1), 0, 0);
  for (let i = 0; i < 256; i++) push(palette[i] ?? [0, 0, 0]);
  if (loop) push([0x21, 0xff, 0x0b, ...Buffer.from('NETSCAPE2.0'), 0x03, 0x01, 0, 0, 0]);
  frames.forEach((frame, f) => {
    let pixels = frame;
    const delta = transparent !== null && f > 0;
    if (delta) {
      pixels = Uint8Array.from(frame);
      for (let i = 0; i < pixels.length; i++) if (frame[i] === frames[f - 1][i]) pixels[i] = transparent;
    }
    // Disposal 1 (keep the frame) so the next frame's transparent pixels show this one.
    out.push(0x21, 0xf9, 0x04, delta || transparent !== null ? 0x05 : 0x00); u16(delays[f]); out.push(delta || transparent !== null ? transparent : 0, 0);
    out.push(0x2c); u16(0); u16(0); u16(width); u16(height); out.push(0);
    out.push(minCodeSize);
    const data = lzw(pixels, minCodeSize);
    for (let i = 0; i < data.length; i += 255) { const block = data.slice(i, i + 255); out.push(block.length); push(block); }
    out.push(0);
  });
  out.push(0x3b);
  return Buffer.from(out);
}
