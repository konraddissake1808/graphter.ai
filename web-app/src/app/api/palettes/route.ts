import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Palette from '@/models/Palette';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.name) {
      return NextResponse.json(
        { error: 'You must be logged in to save palettes.' },
        { status: 401 }
      );
    }

    const { baseColor, colors, paletteType } = await req.json();

    if (!baseColor || !colors || !paletteType) {
      return NextResponse.json(
        { error: 'Missing required palette data.' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // We need the User object ID. Since session.user in demo only holds the name right now natively without JWT callbacks,
    // we query the user via their unique username stored in the session.
    // In Production apps, we usually inject the MongoDB User ID directly into `session.user.id` via NextAuth callbacks.
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ username: session.user.name });
    
    if (!user) {
        return NextResponse.json(
            { error: 'User account mapping not found in database.' },
            { status: 404 }
        );
    }

    const newPalette = await Palette.create({
      userId: user._id,
      baseColor,
      colors,
      paletteType
    });

    return NextResponse.json(
      { message: 'Palette saved successfully', paletteId: newPalette._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Palette Save Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving the palette.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.name) {
      return NextResponse.json(
        { error: 'You must be logged in to view palettes.' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Find User
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ username: session.user.name });
    
    if (!user) {
        return NextResponse.json(
            { error: 'User account mapping not found in database.' },
            { status: 404 }
        );
    }

    // Fetch Palettes sorted by newest first
    const palettes = await Palette.find({ userId: user._id }).sort({ createdAt: -1 });

    return NextResponse.json(
      { palettes },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Palette Fetch Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching palettes.' },
      { status: 500 }
    );
  }
}
