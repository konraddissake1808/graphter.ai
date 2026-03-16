"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

import { generatePalettes } from "@/utils/colors";
import ColorSidePanel, { SelectedColorData } from "@/components/ColorSidePanel";
import FontSidePanel from "@/components/FontSidePanel";
import { usePaletteContext, DetectedFont } from "@/contexts/PaletteContext";

export default function Home() {
  const { data: session } = useSession();
  const { imageFile, setImageFile, imagePreview, setImagePreview, palette, setPalette, fonts, setFonts } = usePaletteContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<SelectedColorData | null>(null);
  const [selectedFont, setSelectedFont] = useState<DetectedFont | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveExtractedStatus, setSaveExtractedStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPalette([]);
      setFonts([]);
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
      // Fire both requests concurrently
      const [colorRes, fontRes] = await Promise.allSettled([
        fetch("/api/color", { method: "POST", body: formData }),
        fetch("/api/fonts", { method: "POST", body: formData })
      ]);

      if (colorRes.status === "fulfilled" && colorRes.value.ok) {
        const colorData = await colorRes.value.json();
        setPalette(colorData.palette || []);
      } else {
        throw new Error("Failed to extract colors");
      }

      if (fontRes.status === "fulfilled" && fontRes.value.ok) {
        const fontData = await fontRes.value.json();
        // If the backend returns no features, matches might be empty
        setFonts(fontData.matches || []);
      } else {
        console.error("Font extraction failed:", fontRes);
        setFonts([]);
      }

    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExtractedPalette = async () => {
    if (palette.length === 0) return;
    setSaveExtractedStatus("saving");

    try {
      const response = await fetch("/api/palettes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseColor: palette[0].color, // Primary dominant color
          colors: palette.map(p => p.color), // Actual extracted colors
          paletteType: "Extracted Image"
        }),
      });

      if (!response.ok) throw new Error("Failed to save palette");
      setSaveExtractedStatus("success");
      setTimeout(() => setSaveExtractedStatus("idle"), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveExtractedStatus("error");
      setTimeout(() => setSaveExtractedStatus("idle"), 3000);
    }
  };

  const handleSavePalette = async () => {
    if (!selectedColor) return;
    
    setSaveStatus("saving");
    
    // We will save all generated palettes under this base color
    const generated = generatePalettes(selectedColor.color);
    // Flatten all the distinct generated color hexes into one array
    const allColorsToSave = Array.from(new Set([
      ...generated.Monochromatic, 
      ...generated.Analogous, 
      ...generated.Complementary, 
      ...generated["Split-Complementary"], 
      ...generated.Triadic, 
      ...generated.Tetradic
    ]));

    try {
      const response = await fetch("/api/palettes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseColor: selectedColor.color,
          colors: allColorsToSave,
          paletteType: selectedColor.role // "Dominant", "Secondary", "Accent"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save palette to database.");
      }

      setSaveStatus("success");
      // Reset back to idle after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
      
    } catch (err: any) {
      console.error(err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-8 bg-zinc-50 dark:bg-zinc-950 font-sans">
      
      {/* Auth Header */}
      <header className="w-full max-w-2xl flex justify-end mb-4">
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-900 dark:text-white hidden sm:block">
              Welcome, <span className="font-bold">{session.user?.name}</span>
            </span>
            <Link
              href="/palettes"
              className="px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              My Palettes
            </Link>
            <button 
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              href="/register"
              className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Register
            </Link>
            <button 
              onClick={() => signIn()}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors rounded-full"
            >
              Log In
            </button>
          </div>
        )}
      </header>

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

          {/* Detected Fonts Section */}
          {palette.length > 0 && (
            <div className="w-full mt-2 bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                Detected Typography
              </h3>
              
              {fonts.length > 0 && Math.max(...fonts.map(f => f.similarity)) > 0 ? (
                <div className="flex flex-col gap-3">
                  {fonts.map((f, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedFont(f)}
                      className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800/50 transition-colors">
                          Aa
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {f.name.replace(/_/g, " ").replace(/-/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Match</span>
                        <span className={`text-xs font-bold ${(f.similarity * 100) > 85 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {(f.similarity * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-zinc-400 dark:text-zinc-500 text-sm">No text detected in this image.</span>
                </div>
              )}
            </div>
          )}

          {/* Save Extracted Palette Button */}
          {palette.length > 0 && session && (
            <button
              onClick={handleSaveExtractedPalette}
              disabled={saveExtractedStatus === "saving" || saveExtractedStatus === "success"}
              className={`w-full py-3 px-6 mt-2 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg ${
                saveExtractedStatus === "success" ? "bg-emerald-500 text-white shadow-emerald-500/30 cursor-default" :
                saveExtractedStatus === "error" ? "bg-red-500 text-white shadow-red-500/30" :
                "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30 disabled:bg-indigo-400"
              }`}
            >
              {saveExtractedStatus === "saving" ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Saving...
                </>
              ) : saveExtractedStatus === "success" ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Extracted Palette Saved!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                  Save Extracted Palette
                </>
              )}
            </button>
          )}
        </div>
      </main>

      <ColorSidePanel 
        selectedColor={selectedColor}
        onClose={() => {
          setSelectedColor(null);
          setSaveStatus("idle");
        }}
        onSave={handleSavePalette}
        saveStatus={saveStatus}
        isAuthenticated={!!session}
        onLoginRequest={() => signIn()}
      />

      <FontSidePanel
        selectedFont={selectedFont}
        onClose={() => setSelectedFont(null)}
      />
    </div>
  );
}
