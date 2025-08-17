import React from "react";
import {
  Layout,
  ShoppingCart,
  Database,
  MessageSquare,
  Calendar,
  Music,
  PenTool,
  Book,
  Users,
  Map,
  CreditCard,
  Mail,
  FileText,
  Video,
  BarChart,
  Globe,
  Search,
  Briefcase,
  Image as ImageIcon,
  Code,
} from "lucide-react";

// Icon mapping object
const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Layout,
  ShoppingCart,
  Database,
  MessageSquare,
  Calendar,
  Music,
  PenTool,
  Book,
  Users,
  Map,
  CreditCard,
  Mail,
  FileText,
  Video,
  BarChart,
  Globe,
  Search,
  Briefcase,
  Image: ImageIcon,
  Code,
};

// Function to get icon component by name
export const getIconComponent = (iconName: string, size: number = 14) => {
  const IconComponent = iconMap[iconName];
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found`);
    return null;
  }
  return <IconComponent size={size} />;
};
