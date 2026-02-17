import type { IconType } from 'react-icons';

export interface NavItem {
  title: string;
  url: string;
  icon: IconType;
}

export interface AdminLayoutProps {
  children: React.ReactNode;
}
