import { getSupabase } from './supabaseClient.js'
import { useOfflineDemo } from '../config/env.js'
import { mockBugsStore } from './mockBugsStore.js'

const SCREENSHOT_BUCKET = 'bug-screenshots'
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024

export async function submitBugReport({
  userId,
  toolId,
  description,
  consoleLogs,
  pageUrl,
  screenshotFile,
}) {
  if (useOfflineDemo) {
    await new Promise(r => setTimeout(r, 500))
    return mockBugsStore.submit({
      userId,
      toolId,
      description,
      consoleLogs,
      pageUrl,
      screenshotFile,
    })
  }

  const supabase = getSupabase()
  let screenshotPath = null

  if (screenshotFile) {
    if (screenshotFile.size > MAX_SCREENSHOT_BYTES) {
      return { data: null, error: { message: 'Screenshot must be 5 MB or smaller.' } }
    }

    const ext = screenshotFile.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .upload(path, screenshotFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { data: null, error: uploadError }
    }

    screenshotPath = path
  }

  const { data, error } = await supabase
    .from('bug_reports')
    .insert({
      user_id: userId,
      tool_id: toolId || null,
      description: description.trim(),
      console_logs: consoleLogs.trim(),
      screenshot_path: screenshotPath,
      page_url: pageUrl?.trim() || null,
    })
    .select('id')
    .single()

  return { data, error }
}
