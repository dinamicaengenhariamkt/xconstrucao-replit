'use client';

import { useState } from 'react';
import { FAQAccordionItem } from './FAQAccordionItem';
import type { FAQCategoryProps } from '../types';

export function FAQCategory({ title, items }: FAQCategoryProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="px-6">
        {items.map((item) => (
          <FAQAccordionItem
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
        ))}
      </div>
    </div>
  );
}
