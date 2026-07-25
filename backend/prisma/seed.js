const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@chessmasterclass.ca" },
    update: {},
    create: { name: "Org Director", email: "admin@chessmasterclass.ca", passwordHash, role: "ADMIN" },
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent@example.com" },
    update: {},
    create: {
      name: "Jordan Smith",
      email: "parent@example.com",
      passwordHash,
      role: "PARENT",
      postalCode: "M5V 2T6",
    },
  });

  const child = await prisma.child.create({
    data: { parentId: parent.id, name: "Alex Smith", dob: new Date("2016-04-12") },
  });

  const event = await prisma.event.create({
    data: {
      name: "Chess MasterClass — Summer 2026",
      description: "A specialized master class designed for young players ages 6-16.",
      date: new Date("2026-08-15T10:00:00Z"),
      location: "Toronto Community Centre",
      capacity: 40,
      priceCents: 4500,
    },
  });

  await prisma.registration.create({
    data: {
      eventId: event.id,
      childId: child.id,
      ageBracket: "U13",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      waiverSignedAt: new Date(),
      qrCode: "seed-demo-qr",
    },
  });

  const tournament = await prisma.tournament.create({
    data: { eventId: event.id, name: "MasterClass Cup", status: "LIVE" },
  });

  await prisma.round.create({
    data: {
      tournamentId: tournament.id,
      number: 1,
      pairings: { create: [{ boardNumber: 1, whiteChildId: child.id }] },
    },
  });

  const course = await prisma.course.create({
    data: {
      eventId: event.id,
      title: "Opening Fundamentals",
      ageBracket: "U13",
      lessons: {
        create: [
          { title: "The Italian Game", videoUrl: "https://placeholder.video/italian-game", order: 0 },
          { title: "The London System", videoUrl: "https://placeholder.video/london-system", order: 1 },
        ],
      },
    },
  });

  await prisma.sponsor.create({
    data: { eventId: event.id, name: "Maple Leaf Credit Union", tier: "GOLD" },
  });

  console.log("Seed complete:");
  console.log({ adminLogin: admin.email, parentLogin: parent.email, password: "password123" });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
