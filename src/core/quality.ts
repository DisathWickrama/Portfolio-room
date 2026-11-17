/**
 * Device detection -> quality tier. This is the mobile fallback switchboard:
 * every expensive feature asks here instead of sniffing the device itself.
 */
export interface Quality {
  mobile: boolean;
  pixelRatio: number;
  bloom: boolean;
  shadows: boolean;
  msaa: number;
  rainLines: number;
}

export function detectQuality(): Quality {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(innerWidth, innerHeight) < 620;
  const mobile = coarse || small;
  const lowPower = mobile && (navigator.hardwareConcurrency ?? 4) <= 4;
  return {
    mobile,
    pixelRatio: Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2),
    bloom: !lowPower,
    shadows: !mobile,
    msaa: mobile ? 0 : 4,
    rainLines: mobile ? 120 : 320,
  };
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
