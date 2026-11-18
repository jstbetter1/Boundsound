type DecodedAudio = {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  getChannelData: (channel: number) => Float32Array;
};

type EncodeOptions = {
  onProgress?: (progress: number) => void;
};

const HEADER_BYTES = 44;
const BITS_PER_SAMPLE = 16;

export async function decodeAudioFile(data: ArrayBuffer): Promise<DecodedAudio> {
  const AudioContextClass =
    window.AudioContext ??
    (
      window as unknown as {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error('Web Audio is not available in this browser.');
  }

  const context = new AudioContextClass();
  try {
    return await context.decodeAudioData(data);
  } finally {
    void context.close();
  }
}

export async function encodeWav(
  audio: DecodedAudio,
  { onProgress }: EncodeOptions = {},
): Promise<ArrayBuffer> {
  const channelCount = Math.min(2, audio.numberOfChannels);
  const frameCount = audio.length;
  const sampleRate = audio.sampleRate;
  const blockAlign = channelCount * (BITS_PER_SAMPLE / 8);
  const dataSize = frameCount * blockAlign;
  const output = new ArrayBuffer(HEADER_BYTES + dataSize);
  const view = new DataView(output);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = Array.from({ length: channelCount }, (_, channel) =>
    audio.getChannelData(channel),
  );
  const chunkFrames = Math.max(1, Math.round(sampleRate));
  let byteOffset = HEADER_BYTES;

  for (let start = 0; start < frameCount; start += chunkFrames) {
    const end = Math.min(frameCount, start + chunkFrames);
    for (let frame = start; frame < end; frame += 1) {
      for (let channel = 0; channel < channelCount; channel += 1) {
        const raw = channels[channel]?.[frame] ?? 0;
        const sample = Number.isFinite(raw) ? Math.max(-1, Math.min(1, raw)) : 0;
        view.setInt16(byteOffset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        byteOffset += 2;
      }
    }
    onProgress?.(end / frameCount);
    if (end < frameCount) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  onProgress?.(1);
  return output;
}

export function wavFileName(inputName: string): string {
  const base = inputName.replace(/\.[^./\\]+$/, '').trim() || 'audio';
  return `${base}.wav`;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
