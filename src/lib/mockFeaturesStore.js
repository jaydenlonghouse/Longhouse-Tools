import { MOCK_USER } from './mockData.js'

const MOCK_REQUESTS = [
  {
    id: 'fr-1',
    tool_id: '1',
    user_id: 'mock-user-2',
    title: 'Export deals to CSV',
    description: 'Allow exporting the deals table with current filters applied.',
    created_at: '2025-05-10T14:00:00Z',
    author_name: 'Alex Kim',
  },
  {
    id: 'fr-2',
    tool_id: '1',
    user_id: 'mock-user-id',
    title: 'Dark mode',
    description: 'Add a dark theme option for late-night reporting sessions.',
    created_at: '2025-05-15T09:30:00Z',
    author_name: 'Demo User',
  },
  {
    id: 'fr-3',
    tool_id: '2',
    user_id: 'mock-user-3',
    title: 'Bulk partner import',
    description: 'Upload a spreadsheet to create multiple partner records at once.',
    created_at: '2025-05-18T11:00:00Z',
    author_name: 'Jordan Lee',
  },
]

const MOCK_VOTES = {
  'fr-1': new Set(['mock-user-id', 'mock-user-2', 'mock-user-3']),
  'fr-2': new Set(['mock-user-id']),
  'fr-3': new Set(['mock-user-2']),
}

const MOCK_COMMENTS = {
  'fr-1': [
    {
      id: 'c-1',
      request_id: 'fr-1',
      author_id: 'mock-user-id',
      author_name: 'Demo User',
      message: 'Would be great for monthly client reports.',
      created_at: '2025-05-11T10:00:00Z',
    },
  ],
  'fr-2': [],
  'fr-3': [],
}

let requests = [...MOCK_REQUESTS]
let votes = Object.fromEntries(
  Object.entries(MOCK_VOTES).map(([k, v]) => [k, new Set(v)]),
)
let comments = structuredClone(MOCK_COMMENTS)
let nextId = 100

function buildRequestRow(r) {
  const voteSet = votes[r.id] ?? new Set()
  const commentList = comments[r.id] ?? []
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    created_at: r.created_at,
    vote_count: voteSet.size,
    comment_count: commentList.length,
    user_has_voted: voteSet.has(MOCK_USER.id),
    author_id: r.user_id,
    author_name: r.author_name,
  }
}

export function getMockFeatureRequests(toolId) {
  return requests
    .filter(r => r.tool_id === toolId)
    .map(buildRequestRow)
    .sort((a, b) => b.vote_count - a.vote_count || new Date(b.created_at) - new Date(a.created_at))
}

export const mockFeaturesStore = {
  getComments(requestId) {
    return [...(comments[requestId] ?? [])]
  },

  createRequest({ userId, toolId, title, description }) {
    const id = `fr-${nextId++}`
    const row = {
      id,
      tool_id: toolId,
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      created_at: new Date().toISOString(),
      author_name: MOCK_USER.user_metadata?.full_name || 'Demo User',
    }
    requests.push(row)
    votes[id] = new Set()
    comments[id] = []
    return row
  },

  toggleVote(requestId, userId) {
    if (!votes[requestId]) votes[requestId] = new Set()
    if (votes[requestId].has(userId)) {
      votes[requestId].delete(userId)
    } else {
      votes[requestId].add(userId)
    }
  },

  addComment({ requestId, userId, message }) {
    const id = `c-${nextId++}`
    const row = {
      id,
      request_id: requestId,
      author_id: userId,
      author_name: MOCK_USER.user_metadata?.full_name || 'Demo User',
      message: message.trim(),
      created_at: new Date().toISOString(),
    }
    if (!comments[requestId]) comments[requestId] = []
    comments[requestId].push(row)
    return row
  },

  deleteRequest(requestId, userId) {
    const req = requests.find(r => r.id === requestId)
    if (!req || req.user_id !== userId) return false
    requests = requests.filter(r => r.id !== requestId)
    delete votes[requestId]
    delete comments[requestId]
    return true
  },

  deleteComment({ commentId, userId }) {
    for (const requestId of Object.keys(comments)) {
      const idx = comments[requestId].findIndex(
        c => c.id === commentId && c.author_id === userId,
      )
      if (idx !== -1) {
        comments[requestId].splice(idx, 1)
        return true
      }
    }
    return false
  },
}
