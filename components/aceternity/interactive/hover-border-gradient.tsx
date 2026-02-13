import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const HoverBorderGradient = ({
  children,
  containerClassName,
  className,
  as: Component = "div",
  duration = 1,
  clockwise = true,
  ...props
}: {
  children: ReactNode;
  containerClassName?: string;
  className?: string;
  as?: any;
  duration?: number;
  clockwise?: boolean;
  [key: string]: any;
}) => {
  return (
    <Component
      className={cn(
        "relative p-[2px] rounded-xl overflow-hidden group",
        containerClassName
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/50 via-primary to-primary/50"
        animate={{
          rotate: clockwise ? [0, 360] : [360, 0],
        }}
        transition={{
          duration: duration * 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div
        className={cn(
          "relative bg-white dark:bg-black rounded-[calc(1rem-2px)] p-6",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
};
