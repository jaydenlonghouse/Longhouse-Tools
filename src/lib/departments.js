/** Canonical department list for tool tagging */
export const DEPARTMENTS = [
  'Branding',
  'Graphic Design',
  'Web Design',
  'Advertising',
  'SEO',
  'Sales',
  'Social Media',
  'Operations',
  'Public Relations',
]

export function departmentSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}
