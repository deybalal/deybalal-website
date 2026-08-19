import path from "path";
import { existsSync } from "fs";
import { applyWatermark } from "@/lib/image-utils";

async function test() {
  const input = path.join(
    process.cwd(),
    "public",
    "assets",
    "cover",
    "Hossein-Pasyar.jpg"
  );
  const output = path.join(
    process.cwd(),
    "public",
    "assets",
    "cover",
    "test-watermark.jpg"
  );

  if (!existsSync(input)) {
    console.error("Input file not found at", input);
    return;
  }

  console.log("Applying watermark...");
  const success = await applyWatermark(
    input,
    output,
    "حسین پاسیار",
    "دی بلال جونوم"
  );

  if (success) {
    console.log("✅ Watermark applied successfully!");
    console.log("Check the output at", output);
  } else {
    console.log("❌ Failed to apply watermark.");
  }
}

test();
