"use client";

import { motion, MotionProps } from "framer-motion";
import { ReactNode } from "react";
import { fadeInUp } from "../lib/animations";

interface AnimatedCardProps extends Omit<MotionProps, "children"> {
  children: ReactNode;
  className?: string;
  variant?: "default" | "interactive" | "subtle";
}

export default function AnimatedCard({
  children,
  className = "",
  variant = "default",
  ...motionProps
}: AnimatedCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "interactive":
        return "rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition cursor-pointer";
      case "subtle":
        return "rounded-lg bg-white/[0.02] backdrop-blur-sm p-3";
      case "default":
      default:
        return "rounded-xl border border-white/10 bg-slate-950/50 p-6";
    }
  };

  return (
    <motion.div
      className={`${getVariantStyles()} ${className}`}
      {...fadeInUp}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
