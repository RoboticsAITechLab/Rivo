import * as React from 'react';
import {
  Award,
  BarChart2,
  Bell,
  BookOpen,
  CalendarCheck,
  Clock,
  FileText,
  GraduationCap,
  Inbox,
  Layers,
  LayoutDashboard,
  LucideProps,
  Settings,
  Users,
} from 'lucide-react';

const icons: Record<string, React.ComponentType<LucideProps>> = {
  LayoutDashboard,
  GraduationCap,
  Users,
  Layers,
  BookOpen,
  CalendarCheck,
  FileText,
  Award,
  BarChart2,
  Clock,
  Bell,
  Inbox,
  Settings,
};

export function NavIcon({
  name,
  className,
  ...props
}: { name: string } & LucideProps) {
  const IconComponent = icons[name] || LayoutDashboard;
  return <IconComponent className={className} {...props} />;
}

