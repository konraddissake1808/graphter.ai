"use client";

import { useState } from "react";
import Image from "next/image";

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const hexToHsl = (hex: string) => {
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

const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const generatePalettes = (hex: string) => {
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

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [palette, setPalette] = useState<{color: string, percentage: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<{color: string, role: string, percentage: number} | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPalette([]);
      setError(null);
    }
  };

  const handleExtractColors = async () => {
    if (!imageFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract colors");
      }

      const data = await response.json();
      setPalette(data.palette);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 font-sans">
      <main className="flex flex-col items-center w-full max-w-2xl gap-8 p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Color Extractor
        </h1>
        
        <p className="text-zinc-500 dark:text-zinc-400 text-center">
          Upload an image to extract its dominant color palette.
        </p>

        <div className="flex w-full flex-col gap-6 items-center">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-zinc-300 border-dashed rounded-2xl cursor-pointer bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 transition-colors">
            {imagePreview ? (
              <div className="relative w-full h-full p-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="object-contain w-full h-full rounded-xl"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">PNG, JPG or WEBP</p>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
          </label>

          <button
            onClick={handleExtractColors}
            disabled={!imageFile || loading}
            className="w-full py-3 px-6 text-white bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting...
              </>
            ) : "Extract Colors"}
          </button>

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          {palette.length > 0 && (
            <div className="w-full flex justify-between gap-3 mt-4 h-32">
              {palette.map((item, index) => {
                let role = "Accent";
                if (index === 0) role = "Dominant";
                else if (index === 1 || index === 2) role = "Secondary";

                return (
                  <div 
                    key={index} 
                    onClick={() => setSelectedColor({ color: item.color, role, percentage: item.percentage })}
                    className="flex-1 flex flex-col items-center justify-end pb-2 rounded-2xl shadow-inner group relative overflow-hidden transition-transform hover:scale-105 cursor-pointer" 
                    style={{ backgroundColor: item.color }}
                  >
                    <div className="bg-black/60 text-white flex flex-col items-center justify-center p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm w-11/12 mb-1 pointer-events-none">
                      <span className="text-xs font-bold font-mono">{item.color}</span>
                      <span className="text-xs">{item.percentage}%</span>
                      <span className="text-[10px] mt-1 font-semibold opacity-80 uppercase tracking-wider">{role}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Side Panel Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${selectedColor ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={() => setSelectedColor(null)}
      ></div>

      {/* Side Panel Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out transform flex flex-col z-50 ${selectedColor ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedColor && (
          <div className="flex flex-col h-full p-6 overflow-y-auto">
            <button 
              onClick={() => setSelectedColor(null)}
              className="self-end p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-800 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="flex flex-col items-center mt-4">
              <div 
                className="w-32 h-32 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.1)] border-4 border-white dark:border-zinc-800 mb-6 transition-colors duration-500"
                style={{ backgroundColor: selectedColor.color }}
              ></div>
              <h2 className="text-3xl font-bold font-mono tracking-wider text-zinc-900 dark:text-white mb-3">
                {selectedColor.color.toUpperCase()}
              </h2>
              <div className="flex gap-2 items-center mb-10">
                <span className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
                  {selectedColor.role}
                </span>
                <span className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  {selectedColor.percentage}%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">HEX</h3>
                <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl font-mono text-sm text-zinc-900 dark:text-white border border-zinc-100 dark:border-zinc-800">
                  <span className="tracking-wide">{selectedColor.color.toUpperCase()}</span>
                  <button onClick={() => navigator.clipboard.writeText(selectedColor.color.toUpperCase())} className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Copy</button>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">RGB</h3>
                <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl font-mono text-sm text-zinc-900 dark:text-white border border-zinc-100 dark:border-zinc-800">
                  <span className="tracking-wide">{(() => {
                    const rgb = hexToRgb(selectedColor.color);
                    return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
                  })()}</span>
                  <button onClick={() => {
                    const rgb = hexToRgb(selectedColor.color);
                    if (rgb) navigator.clipboard.writeText(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
                  }} className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Copy</button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">HSL</h3>
                <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl font-mono text-sm text-zinc-900 dark:text-white border border-zinc-100 dark:border-zinc-800">
                  <span className="tracking-wide">{(() => {
                    const hsl = hexToHsl(selectedColor.color);
                    return hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '';
                  })()}</span>
                  <button onClick={() => {
                    const hsl = hexToHsl(selectedColor.color);
                    if (hsl) navigator.clipboard.writeText(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
                  }} className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Copy</button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 w-full pb-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Generated Palettes</h3>
              
              {Object.entries(generatePalettes(selectedColor.color)).map(([name, colors]) => (
                <div key={name} className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{name}</h4>
                  </div>
                  <div className="flex h-12 rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700/50 cursor-pointer transition-transform hover:scale-[1.02]"
                    title="Click any color to copy its Hex"
                  >
                    {colors.map((c, i) => (
                      <div 
                        key={i} 
                        onClick={() => navigator.clipboard.writeText(c.toUpperCase())}
                        className="flex-1 relative group hover:z-10 transition-all hover:flex-[1.5]"
                        style={{ backgroundColor: c }}
                      >
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                            <span className="text-[10px] text-white font-mono font-bold tracking-wider">{c.toUpperCase()}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
