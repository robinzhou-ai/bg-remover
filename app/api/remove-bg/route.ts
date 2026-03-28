import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const incomingFormData = await request.formData();
    const image = incomingFormData.get("image") as File | null;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Remove.bg API key not configured" },
        { status: 500 }
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rbFormData = new FormData();
    rbFormData.append("image_file", new Blob([buffer], { type: image.type }), image.name);
    rbFormData.append("size", "auto");

    const removeBgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: rbFormData,
    });

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();
      console.error("Remove.bg API error:", errorText);
      return NextResponse.json(
        { error: "Remove.bg error: " + errorText },
        { status: removeBgResponse.status }
      );
    }

    const resultBuffer = await removeBgResponse.arrayBuffer();

    return new NextResponse(Buffer.from(resultBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Internal server error: " + String(error) },
      { status: 500 }
    );
  }
}
