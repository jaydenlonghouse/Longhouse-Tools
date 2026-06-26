/** Sentinel select value for team-owned tools (not tied to a user profile). */
export const CREATOR_TEAM_VALUE = '__longhouse_team__'

export const CREATOR_TEAM_LABEL = 'Longhouse Team'

export function isTeamCreator(createdBy) {
  return createdBy === CREATOR_TEAM_VALUE
}

export function creatorSelectValue({ created_by, creator_type }) {
  if (creator_type === 'team') return CREATOR_TEAM_VALUE
  return created_by ?? ''
}

export function normalizeCreatorFields(createdBy) {
  if (isTeamCreator(createdBy)) {
    return { creator_type: 'team', created_by: null }
  }
  return { creator_type: 'user', created_by: createdBy || null }
}
