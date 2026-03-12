"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ColorSidePanel, { SelectedColorData } from "@/components/ColorSidePanel";

interface PaletteData {
  _id: string;
  baseColor: string;
  colors: string[];
  paletteType: string;
  createdAt: string;
}

export default function MyPalettes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [palettes, setPalettes] = useState<PaletteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<SelectedColorData | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (status === "authenticated") {
      fetchPalettes();
    }
  }, [status, router]);

  const fetchPalettes = async () => {
    try {
      const res = await fetch("/api/palettes");
      if (!res.ok) {
        throw new Error("Failed to fetch palettes");
      }
      const data = await res.json();
      setPalettes(data.palettes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-zinc-500 font-medium">Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
              My Palettes
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Your saved color inspiration collection.
            </p>
          </div>
          <Link 
            href="/"
            className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Generator
          </Link>
        </header>

        {error && (
          <div className="p-4 mb-8 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        {!loading && palettes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <svg className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No palettes yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm">
              You haven't saved any palettes to your collection yet. Head back to the generator to extract and save some colors!
            </p>
            <Link 
              href="/"
              className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors shadow-lg shadow-indigo-500/30"
            >
              Generate Palettes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {palettes.map((item) => (
              <div 
                key={item._id} 
                className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                onClick={() => setSelectedColor({ 
                  color: item.baseColor, 
                  role: item.paletteType, 
                  percentage: null 
                })}
              >
                {/* Palette Colors Grid */}
                <div className="flex h-32 w-full">
                  {item.colors.slice(0, 5).map((color, idx) => (
                    <div 
                      key={idx} 
                      className="flex-1 relative cursor-pointer" 
                      style={{ backgroundColor: color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(color);
                      }}
                      title={`Copy ${color}`}
                    >
                      {/* Copy Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-all">
                        {copiedColor === color ? (
                           <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">Copied!</span>
                        ) : (
                           <span className="text-xs font-bold text-white bg-black/30 px-2 py-1 rounded backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">Copy</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Palette Details */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: item.baseColor }}></div>
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {item.baseColor.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">
                      {item.paletteType} Base
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
                    <span>{item.colors.length} colors total</span>
                    <span suppressHydrationWarning>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Global Toast Notification */}
      <div className={`fixed bottom-6 right-6 px-4 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl shadow-2xl font-medium text-sm z-[100] transition-all duration-300 transform ${copiedColor ? 'translate-y-0 opacity-100 visible' : 'translate-y-4 opacity-0 invisible'}`}>
        Copied to clipboard! 🎨
      </div>

      {/* Shared Side Panel */}
      <ColorSidePanel 
        selectedColor={selectedColor}
        onClose={() => setSelectedColor(null)}
      />
    </div>
  );
}
