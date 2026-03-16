import { useEffect, useState } from "react";
import { DetectedFont } from "@/contexts/PaletteContext";

interface FontSidePanelProps {
  selectedFont: DetectedFont | null;
  onClose: () => void;
}

interface FontRelation {
  name: string;
  similarity: number;
}

export default function FontSidePanel({ selectedFont, onClose }: FontSidePanelProps) {
  const [similarFonts, setSimilarFonts] = useState<FontRelation[]>([]);
  const [complementaryFonts, setComplementaryFonts] = useState<FontRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFont) {
      setSimilarFonts([]);
      setComplementaryFonts([]);
      return;
    }

    const fetchRelatedFonts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/fonts/${encodeURIComponent(selectedFont.name)}/related`);
        if (!res.ok) throw new Error("Failed to fetch related fonts");
        
        const data = await res.json();
        setSimilarFonts(data.similar || []);
        setComplementaryFonts(data.complementary || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred fetching typography.");
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedFonts();
  }, [selectedFont]);

  const fontDisplayName = selectedFont?.name.replace(/_/g, " ").replace(/-/g, " ") || "";

  return (
    <>
      {/* Side Panel Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${selectedFont ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={onClose}
      ></div>

      {/* Side Panel Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out transform flex flex-col z-50 overflow-hidden ${selectedFont ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedFont && (
          <div className="flex flex-col h-full p-6 overflow-y-auto w-full">
            <button 
              onClick={onClose}
              className="self-end p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-800 rounded-full shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="flex flex-col items-center justify-center mt-4 shrink-0 px-2">
              <div className="w-32 h-32 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 border-2 border-indigo-100 dark:border-indigo-800/50 mb-6 flex items-center justify-center shadow-inner">
                <span className="text-6xl font-bold">Aa</span>
              </div>
              
              <h2 className="text-2xl font-bold tracking-tight text-center text-zinc-900 dark:text-white mb-3">
                {fontDisplayName}
              </h2>
              
              <div className="flex gap-2 items-center mb-10">
                <span className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                   Match: {(selectedFont.similarity * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                <svg className="animate-spin mb-4 h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="text-sm font-medium">Analyzing typography patterns...</span>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-red-500 p-6 text-center">
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-8 w-full shrink-0 pb-8">
                
                {/* Similar Fonts */}
                {similarFonts.length > 0 && (
                  <div className="flex flex-col gap-3">
                     <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                       <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                       Similar Fonts
                     </h3>
                     <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Visually cohesive alternatives.</p>
                     
                     <div className="flex flex-col gap-2">
                       {similarFonts.map((f, i) => (
                         <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center">
                              <span className="text-xs font-bold leading-none translate-y-px">Aa</span>
                            </div>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                              {f.name.replace(/_/g, " ").replace(/-/g, " ")}
                            </span>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
                
                {/* Complementary Fonts */}
                {complementaryFonts.length > 0 && (
                  <div className="flex flex-col gap-3">
                     <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                       <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                       Complementary Fonts
                     </h3>
                     <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Contrasting weights for better pairings.</p>
                     
                     <div className="flex flex-col gap-2">
                       {complementaryFonts.map((f, i) => (
                         <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center">
                              <span className="text-xs font-bold leading-none translate-y-px">Aa</span>
                            </div>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                              {f.name.replace(/_/g, " ").replace(/-/g, " ")}
                            </span>
                         </div>
                       ))}
                     </div>
                  </div>
                )}

              </div>
            )}
            
          </div>
        )}
      </div>
    </>
  );
}
