import 'dotenv/config';
import tf from '@tensorflow/tfjs-node';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const OUTPUT_DIR = path.resolve(__dirname, '../public');

async function main() {
  console.log('Carregando modelo USE...');
  const model = await use.load();

  console.log('Buscando medicamentos...');
  const medicines = await prisma.medicine.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true, reference: true, tradeName: true, activeIngredient: true,
      category: true, similarHolder: true, pharmaceuticalForm: true,
      concentration: true, status: true,
    },
  });
  console.log(`Total: ${medicines.length} medicamentos`);

  const texts = medicines.map(m =>
    [m.tradeName, m.activeIngredient, m.category, m.similarHolder,
     m.pharmaceuticalForm, m.concentration,
     m.status === 'Ativo' ? 'ativo' : 'inativo', m.reference]
      .filter(Boolean).join(' | ')
  );

  const DIM = 512;
  const embeddings = [];
  const BATCH = 100;

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const result = await model.embed(batch);
    const values = await result.array();
    tf.dispose(result);

    for (const vec of values) {
      for (let d = 0; d < DIM; d++) embeddings.push(vec[d] ?? 0);
    }

    const done = Math.min(i + BATCH, texts.length);
    if (done % 1000 === 0 || done >= texts.length) {
      console.log(`${done}/${texts.length} embeddings gerados`);
    }
  }

  const header = { count: medicines.length, dim: DIM, ids: medicines.map(m => m.id) };
  const buf = Buffer.alloc(embeddings.length * 4);
  for (let i = 0; i < embeddings.length; i++) buf.writeFloatLE(embeddings[i], i * 4);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'embeddings-header.json'), JSON.stringify(header));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'embeddings.bin'), buf);

  const binSize = fs.statSync(path.join(OUTPUT_DIR, 'embeddings.bin')).size;
  console.log(`\nConcluído! ${medicines.length} medicamentos, ${(binSize / 1024 / 1024).toFixed(1)} MB`);
  tf.dispose(model);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
