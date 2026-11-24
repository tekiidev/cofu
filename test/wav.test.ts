import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codificarWav } from '../src/lib/wav.ts';

test('WAV com cabeçalho PCM mono 16 kHz 16 bits', () => {
  const buf = codificarWav(new Float32Array(16000));
  const v = new DataView(buf);
  const txt = (p: number) => String.fromCharCode(...new Uint8Array(buf, p, 4));
  assert.equal(txt(0), 'RIFF');
  assert.equal(txt(8), 'WAVE');
  assert.equal(txt(12), 'fmt ');
  assert.equal(v.getUint16(20, true), 1);
  assert.equal(v.getUint16(22, true), 1);
  assert.equal(v.getUint32(24, true), 16000);
  assert.equal(v.getUint16(34, true), 16);
  assert.equal(txt(36), 'data');
  assert.equal(v.getUint32(40, true), 32000); // 1 segundo
  assert.equal(buf.byteLength, 44 + 32000);
});

test('amostras viram inteiros de 16 bits, cortando o que passa de 1', () => {
  const v = new DataView(codificarWav(new Float32Array([0, 1, -1, 2, -0.5])));
  assert.equal(v.getInt16(44, true), 0);
  assert.equal(v.getInt16(46, true), 32767);
  assert.equal(v.getInt16(48, true), -32768);
  assert.equal(v.getInt16(50, true), 32767);
  assert.equal(v.getInt16(52, true), -16384);
});
