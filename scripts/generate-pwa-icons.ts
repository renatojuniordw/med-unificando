import "dotenv/config"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

// Gera os ícones PNG do PWA a partir do SVG fonte (public/icon-192.svg).
// Uso: npm run pwa:icons  →  public/icon-192.png e public/icon-512.png
const SRC = path.resolve("public/icon-192.svg")
const OUT = [
  { size: 192, file: "public/icon-192.png" },
  { size: 512, file: "public/icon-512.png" },
]

async function main() {
  const svg = await readFile(SRC)
  for (const { size, file } of OUT) {
    const png = await sharp(svg).resize(size, size).png().toBuffer()
    await writeFile(path.resolve(file), png)
    console.log(`ok: ${file} (${size}x${size}, ${png.length} bytes)`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })