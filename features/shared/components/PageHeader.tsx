'use client';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-5xl font-extrabold tracking-tighter text-[#101819] dark:text-white">
        {title}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">{subtitle}</p>
    </div>
  );
}
