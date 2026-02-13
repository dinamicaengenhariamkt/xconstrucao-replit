import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const MovingBorder = ({
  children,
  duration = 2000,
  rx = "8px",
  ry = "8px",
  className,
  containerClassName,
  borderClassName,
  as: Component = "button",
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: any;
  [key: string]: any;
}) => {
  return (
    <Component
      className={cn(
        "relative text-xl p-[1px] overflow-hidden",
        containerClassName
      )}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ padding: "1px" }}
      >
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-primary via-primary/50 to-primary opacity-50",
            borderClassName
          )}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: duration / 1000,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            borderRadius: `${rx} ${ry}`,
          }}
        />
      </div>
      <div
        className={cn(
          "relative bg-white dark:bg-black border-none rounded-[calc(8px-1px)] px-8 py-3 font-bold flex items-center justify-center",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
};
