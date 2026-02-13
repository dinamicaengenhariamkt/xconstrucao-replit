import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const LogoClouds = ({
  children,
  className,
  speed = 20,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="flex gap-12 items-center"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
};

export const LogoItem = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={cn(
        "flex-shrink-0 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300",
        className
      )}
      whileHover={{ scale: 1.1 }}
    >
      {children}
    </motion.div>
  );
};
