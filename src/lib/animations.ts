// Shared animation configurations for consistency across the app

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.94 },
  transition: { duration: 0.25 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.35 },
};

export const popIn = {
  initial: { opacity: 0, scale: 0.86 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.86 },
  transition: { duration: 0.25 },
};

export const pulse = {
  animate: { scale: [1, 1.08, 1], opacity: [1, 0.72, 1] },
  transition: { duration: 1, repeat: Infinity },
};

export const shimmer = {
  animate: { backgroundPosition: ["200% center", "-200% center"] },
  transition: { duration: 2, repeat: Infinity },
};

export const containerStagger = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const itemVariant = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};
