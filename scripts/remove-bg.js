import sharp from "sharp";

const input = "/public/images/logo.jpeg";
const output = "/public/images/logo.png";

// Load the image, get raw pixel data
const image = sharp(input);
const { width, height, channels } = await image.metadata();
const raw = await image.ensureAlpha().raw().toBuffer();

// Process each pixel: if it's close to white, make it transparent
const threshold = 230;
for (let i = 0; i < raw.length; i += 4) {
  const r = raw[i];
  const g = raw[i + 1];
  const b = raw[i + 2];
  if (r >= threshold && g >= threshold && b >= threshold) {
    raw[i + 3] = 0; // set alpha to 0 (transparent)
  }
}

await sharp(raw, { raw: { width, height, channels: 4 } })
  .png()
  .toFile(output);

console.log("Background removed successfully! Saved to", output);
