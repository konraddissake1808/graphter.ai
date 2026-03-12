import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [3, 'Password must be at least 3 characters long'],
  },
}, { 
  timestamps: true 
});

// Avoid OverwriteModelError due to Next.js API hot reloading
export default mongoose.models.User || mongoose.model('User', UserSchema);
