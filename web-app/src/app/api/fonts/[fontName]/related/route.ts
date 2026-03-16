import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fontName: string }> }
) {
  try {
    const { fontName } = await params;
    if (!fontName) {
      return NextResponse.json({ error: "Font name required" }, { status: 400 });
    }

    // Forward the GET request to FastAPI
    const response = await fetch(`http://127.0.0.1:8000/fonts/${encodeURIComponent(fontName)}/related`, {
      method: "GET",
    });

    if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Backend API error: ${response.status} ${errorText}` },
          { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in Next.js font proxy route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
