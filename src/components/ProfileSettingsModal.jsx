import React, { useState } from 'react';
import { AVATARS, AVATAR_CLASSES, getAvatarsByClass, getAvatarById } from '../lib/avatarLibrary';
import AvatarDisplay from './AvatarDisplay';
import { useTheme } from '../context/ThemeContext';

export default function ProfileSettingsModal({
    profile, onSave, onClose
}) {
    const { theme, setTheme } = useTheme();
    const [selectedAvatarId, setSelectedAvatarId] = useState(profile?.avatar_id || 1);
    const [selectedTheme, setSelectedThemeState] = useState(theme);
    const [saving, setSaving] = useState(false);

    const selectedAvatar = getAvatarById(selectedAvatarId);

    const handleSave = async () => {
        setSaving(true);
        // Save theme to context/localstorage
        setTheme(selectedTheme);
        // Pass avatar update back to parent
        await onSave(selectedAvatarId);
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
            <div className="bg-[var(--bg-card)] border border-[#C9A84C] rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#C9A84C] text-xl font-bold font-mono"
                >
                    ✕
                </button>

                <header className="text-center mb-8">
                    <h2 className="text-[#C9A84C] font-mono text-sm font-bold tracking-widest mb-4 uppercase">
                        PROFILE SETTINGS
                    </h2>

                    <div className="flex flex-col items-center gap-2">
                        <AvatarDisplay avatarId={selectedAvatarId} size="lg" showGlow={true} />
                        <div className="text-[var(--text-primary)] font-mono text-sm font-bold mt-2 uppercase">
                            {selectedAvatar.name}
                        </div>
                        <div className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-mono text-[10px] px-2 py-0.5 rounded border border-[var(--border-color)]">
                            {selectedAvatar.class}
                        </div>
                    </div>
                </header>

                <div className="space-y-8">
                    {/* AVATAR SELECTION */}
                    <section>
                        <h3 className="text-[#C9A84C] font-mono text-xs font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                            AVATAR
                        </h3>
                        <div className="space-y-6">
                            {AVATAR_CLASSES.map((className) => (
                                <div key={className}>
                                    <h4 className="text-[var(--text-secondary)] font-mono text-[9px] font-bold mb-3 mt-4 uppercase tracking-wider">
                                        {className}
                                    </h4>
                                    <div className="grid grid-cols-5 gap-3">
                                        {getAvatarsByClass(className).map((avatar) => {
                                            const isSelected = avatar.id === Number(selectedAvatarId);
                                            return (
                                                <div
                                                    key={avatar.id}
                                                    onClick={() => setSelectedAvatarId(avatar.id)}
                                                    className="flex flex-col items-center gap-1 cursor-pointer group"
                                                >
                                                    <div className={`p-0.5 transition-all duration-200 ${isSelected
                                                        ? 'ring-2 ring-[#C9A84C] ring-offset-1 ring-offset-black rounded-full'
                                                        : 'group-hover:ring-1 group-hover:ring-gray-700 rounded-full'
                                                        }`}>
                                                        <AvatarDisplay avatarId={avatar.id} size="sm" />
                                                    </div>
                                                    <span className={`text-[9px] font-mono text-center truncate w-full transition-colors duration-200 ${isSelected ? 'text-[#C9A84C] font-bold' : 'text-[var(--text-secondary)]'
                                                        }`}>
                                                        {avatar.name}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* BACKGROUND THEME */}
                    <section>
                        <h3 className="text-[#C9A84C] font-mono text-xs font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                            BACKGROUND
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {/* DARK */}
                            <button
                                onClick={() => setSelectedThemeState('dark')}
                                className={`flex flex-col items-center justify-center p-2 rounded border transition-all bg-[var(--bg-secondary)] ${selectedTheme === 'dark'
                                    ? 'border-[#C9A84C] text-[#C9A84C]'
                                    : 'border-gray-600 text-gray-500 hover:border-gray-500'
                                    }`}
                            >
                                <div className="w-6 h-6 bg-[#080810] border border-[#333344] rounded mb-2"></div>
                                <span className="font-mono text-xs font-bold">DARK</span>
                                <span className="font-mono text-[8px] opacity-60">Default</span>
                            </button>

                            {/* LIGHT */}
                            <button
                                onClick={() => setSelectedThemeState('light')}
                                className={`flex flex-col items-center justify-center p-2 rounded border transition-all bg-[var(--bg-secondary)] ${selectedTheme === 'light'
                                    ? 'border-[#C9A84C] text-[#C9A84C]'
                                    : 'border-gray-600 text-gray-500 hover:border-gray-500'
                                    }`}
                            >
                                <div className="w-6 h-6 bg-[#DAE0E6] border border-[#EDEFF1] rounded mb-2"></div>
                                <span className="font-mono text-xs font-bold">LIGHT</span>
                                <span className="font-mono text-[8px] opacity-60">Reddit style</span>
                            </button>

                            {/* CUSTOM (LOCKED) */}
                            <div className="relative pointer-events-none opacity-50 flex flex-col items-center justify-center p-2 rounded border border-gray-600 bg-[var(--bg-secondary)] text-gray-500">
                                <span className="absolute top-1 right-1 text-[#C9A84C] font-mono text-[8px] font-bold">
                                    🔒 LOCKED
                                </span>
                                <div className="w-6 h-6 bg-transparent border border-gray-600 rounded mb-2 flex items-center justify-center text-[10px]">
                                    🔒
                                </div>
                                <span className="font-mono text-xs font-bold">CUSTOM</span>
                                <span className="font-mono text-[8px] opacity-60">PRO PLAN</span>
                            </div>
                        </div>
                    </section>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-[#C9A84C] text-black font-mono font-bold py-3 rounded text-sm mt-8 hover:bg-[#d4b76a] transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {saving ? 'SYSTEM UPDATING...' : 'SAVE SETTINGS'}
                </button>
            </div>
        </div>
    );
}
