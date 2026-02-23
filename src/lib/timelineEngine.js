import { supabase } from './supabase'

/**
 * Creates a timeline entry when a task is completed
 * @param {string} userId - The user's ID
 * @param {string} taskTitle - The title of the completed task
 * @param {string} taskType - The type of task (frog, side_quest, skill_quest, slice, etc.)
 * @param {string} feeling - Optional feeling/mood about completing the task
 * @param {string|null} sourceTaskId - Optional source task UUID to prevent duplicate posts
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function createTimelineEntry(userId, taskTitle, taskType, feeling = null, sourceTaskId = null) {
  try {
    if (!userId || !taskTitle) {
      console.warn('createTimelineEntry: userId and taskTitle are required')
      return { success: false, error: new Error('Missing required parameters') }
    }

    const normalizedFeeling = (feeling || '').trim() || null
    const nowIso = new Date().toISOString()

    const insertPayload = {
      user_id: userId,
      title: taskTitle,
      comment: normalizedFeeling,
      task_type: taskType,
      created_at: nowIso,
    }
    if (sourceTaskId) {
      insertPayload.source_task_id = sourceTaskId
    }

    // Preferred path: conflict-safe upsert with source_task_id unique index.
    if (sourceTaskId) {
      const { error: upsertError } = await supabase
        .from('task_timeline')
        .upsert(insertPayload, { onConflict: 'source_task_id', ignoreDuplicates: true })

      if (!upsertError) {
        return { success: true, error: null }
      }
    }

    // Fallback path for projects that have not yet run the unique-index migration.
    const { data: recentEntries, error: queryError } = await supabase
      .from('task_timeline')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('title', taskTitle)
      .eq('task_type', taskType || null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (queryError) {
      console.log('createTimelineEntry: Table/query unavailable, skipping:', queryError.message)
      return { success: false, error: queryError }
    }

    if (recentEntries && recentEntries.length > 0) {
      const lastEntry = recentEntries[0]
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
      if (lastEntry.created_at > fiveSecondsAgo) {
        console.log('createTimelineEntry: Duplicate entry detected, skipping')
        return { success: true, error: null }
      }
    }

    const { error: insertError } = await supabase.from('task_timeline').insert(insertPayload)

    if (insertError) {
      console.log('createTimelineEntry: Insert failed:', insertError.message)
      return { success: false, error: insertError }
    }

    return { success: true, error: null }
  } catch (err) {
    console.log('createTimelineEntry: Unexpected error, skipping:', err.message)
    return { success: false, error: err }
  }
}

/**
 * Updates the feeling/comment on an existing timeline entry
 * @param {string} entryId - The timeline entry ID
 * @param {string} feeling - The feeling/comment to add
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function updateTimelineFeeling(entryId, feeling) {
  try {
    const { error: updateError } = await supabase
      .from('task_timeline')
      .update({ comment: feeling, updated_at: new Date().toISOString() })
      .eq('id', entryId)

    if (updateError) {
      console.error('updateTimelineFeeling: Update error', updateError)
      return { success: false, error: updateError }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('updateTimelineFeeling: Unexpected error', err)
    return { success: false, error: err }
  }
}
