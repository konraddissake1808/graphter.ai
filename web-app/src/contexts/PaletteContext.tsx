"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DetectedFont {
  name: string;
  similarity: number;
}

interface PaletteContextType {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  palette: {color: string, percentage: number}[];
  setPalette: (palette: {color: string, percentage: number}[]) => void;
  fonts: DetectedFont[];
  setFonts: (fonts: DetectedFont[]) => void;
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [palette, setPalette] = useState<{color: string, percentage: number}[]>([]);
  const [fonts, setFonts] = useState<DetectedFont[]>([]);

  return (
    <PaletteContext.Provider value={{
      imageFile, setImageFile,
      imagePreview, setImagePreview,
      palette, setPalette,
      fonts, setFonts
    }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePaletteContext() {
  const context = useContext(PaletteContext);
  if (context === undefined) {
    throw new Error('usePaletteContext must be used within a PaletteProvider');
  }
  return context;
}
