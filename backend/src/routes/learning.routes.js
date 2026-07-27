const express = require("express");
const prisma = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/courses", async (req, res) => {
  const { ageBracket } = req.query;
  const courses = await prisma.course.findMany({
    where: ageBracket ? { ageBracket } : undefined,
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  res.json(courses);
});

// "After-class access" gate: a child only unlocks a course's lessons if they
// have a CONFIRMED registration for that course's event (or the course has
// no event tied to it, i.e. it's open/evergreen content).
router.get("/children/:childId/courses/:courseId/lessons", requireAuth, async (req, res) => {
  const { childId, courseId } = req.params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: "Course not found" });

  if (course.eventId) {
    const registration = await prisma.registration.findUnique({
      where: { eventId_childId: { eventId: course.eventId, childId } },
    });
    if (!registration || registration.status !== "CONFIRMED") {
      return res.status(403).json({ error: "Register for the MasterClass to unlock this content" });
    }
  }

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    include: { progress: { where: { childId } } },
  });
  res.json(lessons);
});

router.post("/progress", requireAuth, async (req, res) => {
  const { childId, lessonId, completed, puzzlesSolved } = req.body;
  const progress = await prisma.progress.upsert({
    where: { childId_lessonId: { childId, lessonId } },
    update: {
      completedAt: completed ? new Date() : undefined,
      puzzlesSolved: puzzlesSolved ?? undefined,
    },
    create: {
      childId,
      lessonId,
      completedAt: completed ? new Date() : null,
      puzzlesSolved: puzzlesSolved || 0,
    },
  });
  res.status(201).json(progress);
  // TODO(module-3): trigger a push notification here when a course is fully
  // completed ("Your child mastered 3 openings this month!").
});

router.post("/courses", requireAuth, requireRole("COACH", "ADMIN"), async (req, res) => {
  const { title, description, ageBracket, eventId, lessons } = req.body;
  const course = await prisma.course.create({
    data: {
      title,
      description,
      ageBracket,
      eventId,
      lessons: { create: (lessons || []).map((l, i) => ({ ...l, order: i })) },
    },
    include: { lessons: true },
  });
  res.status(201).json(course);
});

// Add one lesson to an already-existing course — this is what a coach uses
// week to week, as opposed to /courses above which creates a brand new course.
router.post("/courses/:courseId/lessons", requireAuth, requireRole("COACH", "ADMIN"), async (req, res) => {
  const { courseId } = req.params;
  const { title, videoUrl } = req.body;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: "Course not found" });

  const existingCount = await prisma.lesson.count({ where: { courseId } });
  const lesson = await prisma.lesson.create({
    data: { courseId, title, videoUrl, order: existingCount },
  });
  res.status(201).json(lesson);
});

module.exports = router;
