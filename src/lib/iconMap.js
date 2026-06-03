import {
  BarChart3,
  BookOpen,
  Box,
  Calculator,
  FileText,
  Globe,
  LayoutGrid,
  Settings,
  Users,
  Wrench,
} from 'lucide-react'

const ICON_MAP = {
  'bar-chart-3': BarChart3,
  users: Users,
  'book-open': BookOpen,
  wrench: Wrench,
  calculator: Calculator,
  'file-text': FileText,
  globe: Globe,
  settings: Settings,
  'layout-grid': LayoutGrid,
  box: Box,
}

export function getToolIcon(iconName) {
  if (!iconName) return Wrench
  return ICON_MAP[iconName] ?? Wrench
}
