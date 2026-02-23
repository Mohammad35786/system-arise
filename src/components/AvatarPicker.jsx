import React from 'react';
import { AVATARS, AVATAR_CLASSES, getAvatarsByClass, getAvatarById } from '../lib/avatarLibrary';
import AvatarDisplay from './AvatarDisplay';

export default function AvatarPicker({
    selectedId, onSelect, onClose
}) {
    const selectedAvatar = getAvatarById(selectedId);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
            <div className="bg-[#0D1117] border border-[#C9A84C] rounded-t-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#C9A84C] text-xl font-bold font-mono"
                >
                    X
                </button>

                <header className="text-center mb-8">
                    <h2 className="text-[#C9A84C] font-mono text-sm font-bold tracking-widest mb-4">
                        CHOOSE YOUR HUNTER
                    </h2>

                    <div className="flex flex-col items-center gap-2">
                        <AvatarDisplay avatarId={selectedId} size="lg" showGlow={true} />
                        <div className="text-[#C9A84C] font-mono text-sm font-bold mt-2 uppercase">
                            {selectedAvatar.name}
                        </div>
                        <div className="bg-gray-800 text-gray-400 font-mono text-[10px] px-2 py-0.5 rounded border border-gray-700">
                            {selectedAvatar.class}
                        </div>
                    </div>
                </header>

                <div className="space-y-6">
                    {AVATAR_CLASSES.map((className) => (
                        <div key={className}>
                            <h3 className="text-gray-500 font-mono text-[10px] font-bold mb-3 mt-4 uppercase tracking-wider">
                                {className}
                            </h3>
                            <div className="grid grid-cols-5 gap-3">
                                {getAvatarsByClass(className).map((avatar) => {
                                    const isSelected = avatar.id === Number(selectedId);
                                    return (
                                        <div
                                            key={avatar.id}
                                            onClick={() => onSelect(avatar.id)}
                                            className="flex flex-col items-center gap-1 cursor-pointer group"
                                        >
                                            <div className={`p-0.5 transition-all duration-200 ${isSelected
                                                    ? 'ring-2 ring-[#C9A84C] ring-offset-1 ring-offset-black rounded-full'
                                                    : 'group-hover:ring-1 group-hover:ring-gray-700 rounded-full'
                                                }`}>
                                                <AvatarDisplay avatarId={avatar.id} size="sm" />
                                            </div>
                                            <span className={`text-[9px] font-mono text-center truncate w-full transition-colors duration-200 ${isSelected ? 'text-[#C9A84C] font-bold' : 'text-gray-600'
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

                <button
                    onClick={onClose}
                    className="w-full bg-[#C9A84C] text-black font-mono font-bold py-3 rounded text-sm mt-8 hover:bg-[#d4b76a] transition-colors"
                >
                    CONFIRM AVATAR
                </button>
            </div>
        </div>
    );
}
