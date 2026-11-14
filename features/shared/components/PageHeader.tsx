'use client';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-5xl font-extrabold tracking-tighter text-[#101819] dark:text-foreground">
        {title}
      </h1>
      <p className="text-gray-500 dark:text-muted-foreground mt-2 text-lg">{subtitle}</p>
    </div>
  );
}
