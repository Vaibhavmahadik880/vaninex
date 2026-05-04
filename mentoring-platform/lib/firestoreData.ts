import { Timestamp } from "firebase/firestore";

type TimestampLike = {
  toDate: () => Date;
};

function hasToDate(value: unknown): value is TimestampLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as TimestampLike).toDate === "function"
  );
}

export function readDate(value: unknown, fallback = new Date()): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp || hasToDate(value)) {
    return value.toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return fallback;
}

export function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
