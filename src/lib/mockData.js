export const MOCK_USER = {
  id: 'mock-user-id',
  email: 'demo@longhouse.co',
  user_metadata: {
    full_name: 'Demo User',
    avatar_url: null,
  },
}

export const MOCK_ROLES = [
  { id: 'role-specialist', slug: 'specialist', name: 'Specialist', rank: 1 },
  { id: 'role-results-manager', slug: 'results_manager', name: 'Results Manager', rank: 2 },
  { id: 'role-department-head', slug: 'department_head', name: 'Department Head', rank: 3 },
  { id: 'role-leadership', slug: 'leadership', name: 'Leadership', rank: 4 },
  { id: 'role-developer', slug: 'developer', name: 'Developer', rank: 5 },
]

export const MOCK_DEPARTMENTS = [
  { id: 'dept-branding', slug: 'branding', name: 'Branding', sort_order: 1 },
  { id: 'dept-graphic-design', slug: 'graphic-design', name: 'Graphic Design', sort_order: 2 },
  { id: 'dept-web-design', slug: 'web-design', name: 'Web Design', sort_order: 3 },
  { id: 'dept-advertising', slug: 'advertising', name: 'Advertising', sort_order: 4 },
  { id: 'dept-seo', slug: 'seo', name: 'SEO', sort_order: 5 },
  { id: 'dept-sales', slug: 'sales', name: 'Sales', sort_order: 6 },
  { id: 'dept-social-media', slug: 'social-media', name: 'Social Media', sort_order: 7 },
  { id: 'dept-operations', slug: 'operations', name: 'Operations', sort_order: 8 },
  { id: 'dept-public-relations', slug: 'public-relations', name: 'Public Relations', sort_order: 9 },
]

export const MOCK_PROFILES = [
  {
    id: 'mock-user-id',
    email: 'demo@longhouse.co',
    display_name: 'Demo User',
  },
  {
    id: 'mock-user-2',
    email: 'alex@longhouse.co',
    display_name: 'Alex Kim',
  },
  {
    id: 'mock-user-3',
    email: 'jordan@longhouse.co',
    display_name: 'Jordan Lee',
  },
]

export const MOCK_ACCESS = {
  max_rank: 5,
  is_developer: true,
  is_leadership_or_above: true,
  assignments: [
    {
      department_id: 'dept-advertising',
      department_name: 'Advertising',
      department_slug: 'advertising',
      role_id: 'role-developer',
      role_slug: 'developer',
      role_name: 'Developer',
      role_rank: 5,
    },
  ],
}

export const MOCK_TOOLS = [
  {
    id: '1',
    slug: 'ads-dashboard',
    name: 'Ads Dashboard',
    description: 'Campaign performance, KPIs, and linked deals.',
    icon: 'bar-chart-3',
    url: 'https://longhouse.co',
    sort_order: 1,
    kind: 'tool',
    departments: ['Advertising', 'Operations'],
    created_by_name: 'Alex Kim',
  },
  {
    id: '2',
    slug: 'partner-onboarding',
    name: 'Partner Onboarding',
    description: 'Generate and manage partner onboarding materials.',
    icon: 'users',
    url: 'https://longhouse.co',
    sort_order: 2,
    kind: 'tool',
    departments: ['Sales', 'Operations'],
    created_by_name: 'Demo User',
  },
  {
    id: '3',
    slug: 'internal-wiki',
    name: 'Internal Wiki',
    description: 'Team documentation and process guides.',
    icon: 'book-open',
    url: 'https://longhouse.co',
    sort_order: 3,
    kind: 'tool',
    departments: ['Operations', 'Branding'],
    created_by_name: 'Jordan Lee',
  },
  {
    id: '4',
    slug: 'ad-copy-assistant',
    name: 'Ad Copy Assistant',
    description: 'Custom GPT for drafting and refining paid social ad copy.',
    icon: 'file-text',
    url: 'https://chatgpt.com/g/example',
    sort_order: 4,
    kind: 'gpt',
    departments: ['Advertising', 'Social Media'],
    created_by_name: 'Alex Kim',
  },
]
