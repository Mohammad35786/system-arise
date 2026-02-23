import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppShell } from '../../components/AppShell'

export default function AccountSettings() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    // Edit states
    const [editingName, setEditingName] = useState(false)
    const [editingEmail, setEditingEmail] = useState(false)
    const [editingPassword, setEditingPassword] = useState(false)

    // Form states
    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // UI status
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                setNewEmail(user.email)
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                if (data) {
                    setProfile(data)
                    setNewName(data.display_name || '')
                }
            }
            setLoading(false)
        }
        loadData()
    }, [])

    const handleUpdateName = async () => {
        setSaving(true)
        setError('')
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ display_name: newName })
                .eq('id', user.id)

            if (error) throw error
            setProfile({ ...profile, display_name: newName })
            setEditingName(false)
            setSuccess('NAME UPDATED')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateEmail = async () => {
        setSaving(true)
        setError('')
        try {
            // Supabase requires password for email update usually or handles via re-auth
            const { error } = await supabase.auth.updateUser({ email: newEmail })
            if (error) throw error
            setEditingEmail(false)
            setSuccess('CHECK YOUR NEW EMAIL FOR CONFIRMATION')
            setTimeout(() => setSuccess(''), 5000)
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('PASSWORDS DO NOT MATCH')
            return
        }
        if (newPassword.length < 6) {
            setError('PASSWORD MINIMUM 6 CHARACTERS')
            return
        }

        setSaving(true)
        setError('')
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            setEditingPassword(false)
            setNewPassword('')
            setConfirmPassword('')
            setSuccess('PASSWORD UPDATED')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteAccount = async () => {
        const confirm = window.prompt('Type "DELETE" to confirm account deletion. This cannot be undone.')
        if (confirm === 'DELETE') {
            setSaving(true)
            try {
                const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id)
                if (profileError) throw profileError

                const { error: authError } = await supabase.auth.signOut()
                if (authError) throw authError

                navigate('/')
            } catch (err) {
                setError(err.message)
                setSaving(false)
            }
        }
    }

    const maskEmail = (email) => {
        if (!email) return ''
        const [name, domain] = email.split('@')
        return `${name.slice(0, 2)}***@${domain}`
    }

    if (loading) return null

    return (
        <AppShell>
            <div className="max-w-lg mx-auto min-h-screen bg-[#080810] flex flex-col px-4">
                {/* Header */}
                <div className="py-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/settings')}
                        className="text-gray-500 hover:text-white font-mono text-[10px] tracking-widest"
                    >
                        ← SETTINGS
                    </button>
                    <h1 className="text-[#C9A84C] font-mono text-sm font-bold flex-1 text-center pr-12">ACCOUNT SETTINGS</h1>
                </div>

                {error && (
                    <div className="mb-4 border border-red-500 bg-red-500/10 rounded p-3 text-red-400 font-mono text-xs uppercase tracking-tight">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 border border-green-500 bg-green-500/10 rounded p-3 text-green-400 font-mono text-xs uppercase tracking-tight">
                        {success}
                    </div>
                )}

                <div className="space-y-8 pb-10">
                    {/* PROFILE INFO */}
                    <section>
                        <div className="text-gray-600 font-mono text-[10px] font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-gray-800"></span>
                            PROFILE INFO
                            <span className="flex-1 h-[1px] bg-gray-800"></span>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div className="border-b border-gray-800/50 pb-4">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest">DISPLAY NAME</span>
                                    {!editingName && (
                                        <button onClick={() => setEditingName(true)} className="text-[#C9A84C] font-mono text-[9px] font-bold">EDIT</button>
                                    )}
                                </div>
                                {editingName ? (
                                    <div className="space-y-2 mt-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full bg-[#080810] border border-gray-700 rounded px-3 py-2 text-xs text-[#E8E8E8] font-mono focus:border-[#C9A84C] focus:outline-none"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdateName}
                                                disabled={saving}
                                                className="bg-[#C9A84C] text-black font-mono text-[10px] font-bold px-3 py-1.5 rounded uppercase"
                                            >
                                                {saving ? 'SAVING...' : 'SAVE'}
                                            </button>
                                            <button
                                                onClick={() => { setEditingName(false); setNewName(profile?.display_name || '') }}
                                                className="border border-gray-700 text-gray-400 font-mono text-[10px] px-3 py-1.5 rounded uppercase"
                                            >
                                                CANCEL
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-[#E8E8E8] font-mono text-xs">{profile?.display_name || 'NOT SET'}</div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="border-b border-gray-800/50 pb-4">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest">EMAIL</span>
                                    {!editingEmail && (
                                        <button onClick={() => setEditingEmail(true)} className="text-[#C9A84C] font-mono text-[9px] font-bold">EDIT</button>
                                    )}
                                </div>
                                {editingEmail ? (
                                    <div className="space-y-3 mt-2">
                                        <div>
                                            <label className="text-gray-600 font-mono text-[8px] uppercase mb-1 block">NEW EMAIL</label>
                                            <input
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                className="w-full bg-[#080810] border border-gray-700 rounded px-3 py-2 text-xs text-[#E8E8E8] font-mono focus:border-[#C9A84C] focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdateEmail}
                                                disabled={saving}
                                                className="bg-[#C9A84C] text-black font-mono text-[10px] font-bold px-3 py-1.5 rounded uppercase"
                                            >
                                                {saving ? 'PROCESSING...' : 'SAVE'}
                                            </button>
                                            <button
                                                onClick={() => { setEditingEmail(false); setNewEmail(user?.email || '') }}
                                                className="border border-gray-700 text-gray-400 font-mono text-[10px] px-3 py-1.5 rounded uppercase"
                                            >
                                                CANCEL
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 font-mono text-xs">{maskEmail(user?.email)}</div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* SECURITY */}
                    <section>
                        <div className="text-gray-600 font-mono text-[10px] font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-gray-800"></span>
                            SECURITY
                            <span className="flex-1 h-[1px] bg-gray-800"></span>
                        </div>

                        <div className="border-b border-gray-800/50 pb-4">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-gray-500 font-mono text-[9px] uppercase tracking-widest">PASSWORD</span>
                                {!editingPassword && (
                                    <button onClick={() => setEditingPassword(true)} className="text-[#C9A84C] font-mono text-[9px] font-bold">CHANGE</button>
                                )}
                            </div>
                            {editingPassword ? (
                                <div className="space-y-3 mt-2">
                                    <div>
                                        <label className="text-gray-600 font-mono text-[8px] uppercase mb-1 block">NEW PASSWORD</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-[#080810] border border-gray-700 rounded px-3 py-2 text-xs text-[#E8E8E8] font-mono focus:border-[#C9A84C] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-600 font-mono text-[8px] uppercase mb-1 block">CONFIRM NEW PASSWORD</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-[#080810] border border-gray-700 rounded px-3 py-2 text-xs text-[#E8E8E8] font-mono focus:border-[#C9A84C] focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUpdatePassword}
                                            disabled={saving}
                                            className="bg-[#C9A84C] text-black font-mono text-[10px] font-bold px-3 py-1.5 rounded uppercase"
                                        >
                                            {saving ? 'UPDATING...' : 'SAVE'}
                                        </button>
                                        <button
                                            onClick={() => setEditingPassword(false)}
                                            className="border border-gray-700 text-gray-400 font-mono text-[10px] px-3 py-1.5 rounded uppercase"
                                        >
                                            CANCEL
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 font-mono text-xs">••••••••</div>
                            )}
                        </div>
                    </section>

                    {/* DANGER ZONE */}
                    <section>
                        <div className="text-red-900 font-mono text-[10px] font-bold mb-4 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-red-950"></span>
                            DANGER ZONE
                            <span className="flex-1 h-[1px] bg-red-950"></span>
                        </div>

                        <button
                            onClick={handleDeleteAccount}
                            className="w-full text-left border border-red-900/30 bg-red-950/10 hover:bg-red-950/20 rounded p-4 transition-colors"
                        >
                            <div className="text-red-500 font-mono text-xs font-bold uppercase tracking-wider">DELETE ACCOUNT</div>
                            <div className="text-red-900 font-mono text-[10px] uppercase mt-1">This cannot be undone. All progress will be lost.</div>
                        </button>
                    </section>
                </div>
            </div>
        </AppShell>
    )
}
