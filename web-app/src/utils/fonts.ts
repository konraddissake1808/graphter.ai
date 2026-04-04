/**
 * Formats a font name from the dataset (e.g., "Inter_18pt-Regular") 
 * into a Google Fonts compatible family name (e.g., "Inter").
 */
export function getFontFamily(fontName: string): string {
  // Remove file extensions if present
  let name = fontName.replace(/\.(ttf|otf|woff2|woff)$/i, "");
  
  // Handle some specific mappings
  if (name.startsWith("GoogleSans")) return "Product Sans"; // Closest fallback if not available
  
  // Split by common separators and take the first part
  // e.g. "Inter_18pt-Regular" -> "Inter"
  // e.g. "OpenSans_Condensed-Regular" -> "Open Sans Condensed" (needs special handling)
  
  // Common pattern: FamilyName_SomeVariant-Weight
  // We want to replace underscores with spaces and stop at common suffix markers like "-", "_", or numbers
  
  // First, extract the core family by splitting at '-' or '_digit'
  let family = name.split('-')[0].split(/_\d/)[0];
  
  // Replace underscores with spaces for families like Open_Sans
  family = family.replace(/_/g, ' ');
  
  return family;
}

/**
 * Generates the Google Fonts URL for a list of families.
 */
export function getGoogleFontsUrl(families: string[]): string {
  if (families.length === 0) return "";
  
  const uniqueFamilies = Array.from(new Set(families))
    .map(f => f.replace(/ /g, "+"))
    .join("&family=");
    
  return `https://fonts.googleapis.com/css2?family=${uniqueFamilies}&display=swap`;
}
