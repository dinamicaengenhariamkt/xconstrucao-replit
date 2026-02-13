import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon: Icon,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: IconType;
}) => {
  return (
    <motion.div
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent justify-between flex flex-col space-y-4",
        className
      )}
      whileHover={{
        translateY: -8,
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
    >
      {header}
      <div>
        {Icon && (
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div className="text-xl font-bold text-foreground mb-3">
          {title}
        </div>
        <div className="text-muted-foreground leading-relaxed">
          {description}
        </div>
      </div>
    </motion.div>
  );
};
