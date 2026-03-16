"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FontSidePanel from "@/components/FontSidePanel";
import { DetectedFont } from "@/contexts/PaletteContext";

interface SavedFont {
  _id: string;
  name: string;
  similarity: number;
  createdAt: string;
}

export default function MyFonts() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fonts, setFonts] = useState<SavedFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFont, setSelectedFont] = useState<DetectedFont | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (status === "authenticated") {
      fetchSavedFonts();
    }
  }, [status, router]);

  const fetchSavedFonts = async () => {
    try {
      const res = await fetch("/api/fonts/saved");
      if (!res.ok) {
        throw new Error("Failed to fetch saved fonts");
      }
      const data = await res.json();
      setFonts(data.fonts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
              My Fonts
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Your saved typography inspiration collection.
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

        {!loading && fonts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <svg className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No fonts yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm">
              You haven't saved any fonts to your collection yet. Head back to the generator to detect and save some typography!
            </p>
            <Link 
              href="/"
              className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors shadow-lg shadow-indigo-500/30"
            >
              Analyze Fonts
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fonts.map((item) => (
              <div 
                key={item._id} 
                className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                onClick={() => setSelectedFont({ 
                  name: item.name, 
                  similarity: item.similarity 
                })}
              >
                {/* Font Preview Area */}
                <div className="h-32 w-full bg-indigo-50 dark:bg-indigo-900/10 flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/20 transition-colors">
                  <span className="text-5xl font-bold text-indigo-500 dark:text-indigo-400">Aa</span>
                </div>
                
                {/* Font Details */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-zinc-900 dark:text-white truncate max-w-[140px]">
                      {item.name.replace(/_/g, " ").replace(/-/g, " ")}
                    </h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">
                       {Math.round(item.similarity * 100)}% Match
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
                    <span>Saved Font</span>
                    <span suppressHydrationWarning>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Shared Side Panel */}
      <FontSidePanel 
        selectedFont={selectedFont}
        onClose={() => setSelectedFont(null)}
        isAuthenticated={!!session}
      />
    </div>
  );
}
