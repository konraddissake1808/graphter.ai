import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import Font from '@/models/Font';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.name) {
      return NextResponse.json(
        { error: 'You must be logged in to save fonts.' },
        { status: 401 }
      );
    }

    const { name, similarity } = await req.json();

    if (!name || similarity === undefined) {
      return NextResponse.json(
        { error: 'Missing required font data.' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // Find user
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ username: session.user.name });
    
    if (!user) {
        return NextResponse.json(
            { error: 'User account mapping not found in database.' },
            { status: 404 }
        );
    }

    const newFont = await Font.create({
      userId: user._id,
      name,
      similarity
    });

    return NextResponse.json(
      { message: 'Font saved successfully', fontId: newFont._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Font Save Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving the font.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user || !session.user.name) {
      return NextResponse.json(
        { error: 'You must be logged in to view saved fonts.' },
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

    // Fetch Fonts sorted by newest first
    const fonts = await Font.find({ userId: user._id }).sort({ createdAt: -1 });

    return NextResponse.json(
      { fonts },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Font Fetch Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching saved fonts.' },
      { status: 500 }
    );
  }
}
