export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FAQAccordionItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

export interface FAQCategoryProps {
  title: string;
  items: FAQItem[];
}
