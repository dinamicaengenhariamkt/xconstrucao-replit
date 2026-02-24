'use client';

interface FAQCategoryGroupProps {
  title: string;
  children: React.ReactNode;
}

export function FAQCategoryGroup({ title, children }: FAQCategoryGroupProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="px-6">
        {children}
      </div>
    </div>
  );
}
