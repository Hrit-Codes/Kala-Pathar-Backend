export const DIFFICULTY_LEVELS = [
  {
    name: "Beginner",
    color: "#10b981",
    level: 1,
  },
  {
    name: "Moderate",
    color: "#f97316",
    level: 2,
  },
  {
    name: "Challenging",
    color: "#f43f5e",
    level: 3,
  },
  {
    name: "Extreme",
    color: "#a855f7",
    level: 4,
  },
] as const;

export const DIFFICULTY_NAMES = DIFFICULTY_LEVELS.map((d) => d.name);
//  ["Beginner", "Moderate", "Challenging", "Extreme"]

export type DifficultyLevel = (typeof DIFFICULTY_NAMES)[number];