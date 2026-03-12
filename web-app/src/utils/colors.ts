export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const hexToHsl = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

export const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export const generatePalettes = (hex: string) => {
  const { h, s, l } = hexToHsl(hex)!;
  return {
    Monochromatic: [
      hex,
      hslToHex(h, s, Math.max(0, l - 30)),
      hslToHex(h, s, Math.max(0, l - 15)),
      hslToHex(h, s, Math.min(100, l + 15)),
      hslToHex(h, s, Math.min(100, l + 30))
    ],
    Analogous: [
      hex,
      hslToHex((h + 30) % 360, s, l),
      hslToHex((h + 60) % 360, s, l),
      hslToHex((h + 330) % 360, s, l),
      hslToHex((h + 300) % 360, s, l)
    ],
    Complementary: [
      hex,
      hslToHex((h + 180) % 360, s, l)
    ],
    "Split-Complementary": [
      hex,
      hslToHex((h + 150) % 360, s, l),
      hslToHex((h + 210) % 360, s, l)
    ],
    Triadic: [
      hex,
      hslToHex((h + 120) % 360, s, l),
      hslToHex((h + 240) % 360, s, l)
    ],
    Tetradic: [
      hex,
      hslToHex((h + 90) % 360, s, l),
      hslToHex((h + 180) % 360, s, l),
      hslToHex((h + 270) % 360, s, l)
    ]
  };
};
