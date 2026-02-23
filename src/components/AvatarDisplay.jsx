import React from 'react';
import { getAvatarById } from '../lib/avatarLibrary';

export default function AvatarDisplay({
    avatarId, size = 'md', showGlow = false
}) {
    const avatar = getAvatarById(avatarId);

    const sizeClasses = {
        sm: 'w-8 h-8 text-lg border-2',
        md: 'w-12 h-12 text-2xl border-2',
        lg: 'w-16 h-16 text-3xl border-2',
        xl: 'w-24 h-24 text-5xl border-4'
    };

    const glowStyle = showGlow
        ? { boxShadow: `0 0 20px ${avatar.color}66` }
        : {};

    return (
        <div
            className={`rounded-full flex items-center justify-center bg-[#0D1117] ${sizeClasses[size] || sizeClasses.md}`}
            style={{
                borderColor: avatar.color,
                ...glowStyle
            }}
        >
            <span>{avatar.emoji}</span>
        </div>
    );
}
