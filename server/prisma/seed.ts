import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TAGS: { name: string; category: string }[] = [
  { name: "Slow Burn", category: "TROPE" },
  { name: "Enemies to Lovers", category: "TROPE" },
  { name: "Friends to Lovers", category: "TROPE" },
  { name: "Fake Dating", category: "TROPE" },
  { name: "Canon Divergence", category: "TROPE" },
  { name: "Coffee Shop AU", category: "TROPE" },
  { name: "Hurt/Comfort", category: "TROPE" },
  { name: "Found Family", category: "TROPE" },
  { name: "Time Travel", category: "TROPE" },
  { name: "Soulmate AU", category: "TROPE" },
  { name: "Grumpy/Sunshine", category: "TROPE" },
  { name: "Only One Bed", category: "TROPE" },

  { name: "Character Death", category: "WARNING" },
  { name: "Graphic Violence", category: "WARNING" },
  { name: "Self-Harm", category: "WARNING" },
  { name: "Abuse", category: "WARNING" },
  { name: "Suicidal Ideation", category: "WARNING" },
  { name: "Non-Con/Dub-Con", category: "WARNING" },

  { name: "No Spice", category: "SPICE" },
  { name: "Fade to Black", category: "SPICE" },
  { name: "Mild", category: "SPICE" },
  { name: "Explicit", category: "SPICE" },

  { name: "Fluff", category: "OTHER" },
  { name: "Angst", category: "OTHER" },
  { name: "Multi-Chapter", category: "OTHER" },
  { name: "One-Shot", category: "OTHER" },
];

async function main() {
  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { name_category: { name: tag.name, category: tag.category } },
      create: tag,
      update: {},
    });
  }
  console.log(`Seeded ${TAGS.length} tags.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
