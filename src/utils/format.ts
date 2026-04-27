// Format duration in seconds to HH:MM:SS
export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// Format date to readable format
type DateLike = Date | { toDate?: () => Date } | null | undefined;

export const formatDate = (date: DateLike): string => {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : date.toDate?.();
  if (!d) return "N/A";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format time to HH:MM AM/PM
export const formatTime = (date: DateLike): string => {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : date.toDate?.();
  if (!d) return "N/A";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Calculate completion rate
export const calculateCompletionRate = (
  completed: number,
  total: number,
): number => {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
};

// Generate week identifier
export const getWeekIdentifier = (date: Date = new Date()): string => {
  const d = new Date(date);
  const firstDay = new Date(d.setDate(d.getDate() - d.getDay()));
  const year = firstDay.getFullYear();
  const weekNum =
    Math.ceil(
      (firstDay.getTime() - new Date(year, 0, 1).getTime()) / 604800000,
    ) + 1;
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
};

// Calculate average duration
export const calculateAverageDuration = (durations: number[]): number => {
  if (durations.length === 0) return 0;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
};
