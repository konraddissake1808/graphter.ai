import mongoose from 'mongoose';

const PaletteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  baseColor: {
    type: String, // e.g., "#HEXCODE"
    required: true,
  },
  colors: {
    type: [String], // Array of returned palette hex codes
    required: true,
  },
  paletteType: {
    type: String, // e.g., "Dominant", "Analogous", etc.
    required: true,
  }
}, { 
  timestamps: true 
});

export default mongoose.models.Palette || mongoose.model('Palette', PaletteSchema, 'palettes');
