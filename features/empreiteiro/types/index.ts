import type { IconType } from 'react-icons';

export interface NavItem {
  title: string;
  url: string;
  icon: IconType;
}

export interface EmpreiteiroLayoutProps {
  children: React.ReactNode;
}
