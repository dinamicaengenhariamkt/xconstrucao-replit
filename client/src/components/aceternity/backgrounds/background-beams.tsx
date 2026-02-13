"use client";
import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

export const BackgroundBeams = React.memo(({ className }: { className?: string }) => {
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
    "M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859",
  ];

  return (
    <div
      className={cn(
        "absolute inset-0 z-0 flex items-center justify-center overflow-hidden",
        className
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path, index) => (
          <motion.path
            key={`path-${index}`}
            d={path}
            stroke={`url(#linearGradient-${index})`}
            strokeOpacity="0.4"
            strokeWidth="0.5"
            initial={{
              pathLength: 0,
            }}
            animate={{
              pathLength: [0, 1, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              delay: index * 0.5,
            }}
          />
        ))}
        <defs>
          {paths.map((_, index) => (
            <linearGradient
              id={`linearGradient-${index}`}
              key={`gradient-${index}`}
              gradientUnits="userSpaceOnUse"
              x1="0%"
              x2="100%"
              y1="0%"
              y2="0%"
            >
              <stop stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
              <stop stopColor="hsl(var(--primary))"></stop>
              <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
            </linearGradient>
          ))}
        </defs>
      </svg>

      {/* Glow effects */}
      <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/4 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
    </div>
  );
});

BackgroundBeams.displayName = "BackgroundBeams";
