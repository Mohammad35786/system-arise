import { supabase } from './supabase'

// Request browser notification permission
export async function requestNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'
    const result = await Notification.requestPermission()
    return result
}

// Show browser notification if permitted
export function showBrowserNotification(title, body, icon) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    try {
        new Notification(title, {
            body,
            icon: icon || '/icon.png',
            badge: '/icon.png',
        })
    } catch (err) {
        console.warn('Browser notification failed:', err)
    }
}

// Save notification to inbox in Supabase
export async function saveInboxNotification(userId, type, title, body, metadata = {}) {
    try {
        await supabase.from('inbox_notifications').insert({
            user_id: userId,
            type,
            title,
            body,
            metadata,
            read: false,
            dismissed: false,
        })
    } catch (err) {
        console.error('saveInboxNotification error:', err)
    }
}

// Combined: save to inbox AND show browser notification
export async function notify(userId, type, title, body, metadata = {}) {
    await saveInboxNotification(userId, type, title, body, metadata)
    showBrowserNotification(title, body)
}

// Log activity to activity_log table
export async function logActivity(userId, type, title, description, xpEarned, metadata = {}) {
    try {
        await supabase.from('activity_log').insert({
            user_id: userId,
            date: new Date().toISOString().split('T')[0],
            type,
            title,
            description,
            xp_earned: xpEarned || 0,
            metadata,
        })
    } catch (err) {
        console.error('logActivity error:', err)
    }
}
