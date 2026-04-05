import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { type, volume, position, action, filename } = data;
    const serverUrl =
      process.env.AUDIO_SERVER_URL || "http://192.168.1.108:3001";

    if (type === "volume") {
      const response = await fetch(`${serverUrl}/api/music/volume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume: Number(Math.ceil(volume)) }),
      });
      const result = await response.json();
      return NextResponse.json(result);
    }

    if (type === "action") {
      const response = await fetch(`${serverUrl}/api/music/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      return NextResponse.json(result);
    }

    if (type === "position") {
      const response = await fetch(`${serverUrl}/api/music/position`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      const result = await response.json();
      return NextResponse.json(result);
    }

    if (type === "play") {
      if (!filename)
        return NextResponse.json({
          success: false,
          message: "No filename provided",
        });

      // Clean filename - usually starts with /assets/mp3/
      // process.cwd() / public / assets / mp3 / song.mp3
      const filePath = path.join(
        process.cwd(),
        "public",
        "assets",
        "mp3",
        filename
      );

      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { success: false, message: "File not found locally" },
          { status: 404 }
        );
      }

      const formData = new FormData();
      const vol = volume !== undefined ? volume : 100;
      formData.append("volume", Math.ceil(vol).toString());

      const filenameOnPath = path.basename(filePath);
      const fileBuffer = fs.readFileSync(filePath);

      const fileObj = new Blob([fileBuffer], { type: "audio/mpeg" });
      formData.append("file", fileObj, filenameOnPath);

      const response = await axios.post(`${serverUrl}/api/music`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      let responseData;
      try {
        responseData = await response.data;
      } catch {
        responseData = { success: true }; // Fallback if no json
      }
      return NextResponse.json(responseData);
    }

    return NextResponse.json({
      success: false,
      message: "Unknown action type",
    });
  } catch (error) {
    console.error("Server Player Proxy Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error)?.message || "Internal error",
      },
      { status: 500 }
    );
  }
}
