import { hexToRgb, hexToHsl, generatePalettes } from "@/utils/colors";

export interface SelectedColorData {
  color: string;
  role: string | null;
  percentage: number | string | null;
}

interface ColorSidePanelProps {
  selectedColor: SelectedColorData | null;
  onClose: () => void;
  onSave?: () => void;
  saveStatus?: "idle" | "saving" | "success" | "error";
  isAuthenticated?: boolean;
  onLoginRequest?: () => void;
}

export default function ColorSidePanel({
  selectedColor,
  onClose,
  onSave,
  saveStatus = "idle",
  isAuthenticated = false,
  onLoginRequest,
}: ColorSidePanelProps) {
  return (
    <>
      {/* Side Panel Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${selectedColor ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={onClose}
      ></div>

      {/* Side Panel Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out transform flex flex-col z-50 overflow-hidden ${selectedColor ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedColor && (
          <div className="flex flex-col h-full p-6 overflow-y-auto w-full">
            <button 
              onClick={onClose}
              className="self-end p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-800 rounded-full shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="flex flex-col items-center mt-4 shrink-0">
              <div 
                className="w-32 h-32 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.1)] border-4 border-white dark:border-zinc-800 mb-6 transition-colors duration-500"
                style={{ backgroundColor: selectedColor.color }}
              ></div>
              <h2 className="text-3xl font-bold font-mono tracking-wider text-zinc-900 dark:text-white mb-3">
                {selectedColor.color.toUpperCase()}
              </h2>
              <div className="flex gap-2 items-center mb-10">
                {selectedColor.role && (
                  <span className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
                    {selectedColor.role}
                  </span>
                )}
                {selectedColor.percentage !== null && selectedColor.percentage !== undefined && (
                  <span className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    {selectedColor.percentage}{typeof selectedColor.percentage === 'number' ? '%' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 w-full shrink-0">
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

            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 w-full pb-8 shrink-0">
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
            
            {onSave && (
              <div className="mt-4 mb-4 shrink-0">
                {isAuthenticated ? (
                  <button 
                    onClick={onSave}
                    disabled={saveStatus === "saving" || saveStatus === "success"}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg ${
                      saveStatus === "success" ? "bg-emerald-500 text-white shadow-emerald-500/30 cursor-default" :
                      saveStatus === "error" ? "bg-red-500 text-white shadow-red-500/30" :
                      "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30 disabled:bg-indigo-400"
                    }`}
                  >
                    {saveStatus === "saving" ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Saving...
                      </>
                    ) : saveStatus === "success" ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Saved!
                      </>
                    ) : saveStatus === "error" ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        Error Saving
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                        Save Palette to Collection
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={onLoginRequest}
                    className="w-full py-3 px-6 text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                     Log in to Save Palette
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
