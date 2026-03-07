import React, { useEffect, useState } from 'react';
import { dialog, DialogOptions } from '../../services/dialog';

interface DialogState extends DialogOptions {
    id: number;
    resolve: (result: boolean) => void;
    isOpen: boolean;
}

const GlobalDialogs: React.FC = () => {
    const [dialogs, setDialogs] = useState<DialogState[]>([]);

    useEffect(() => {
        const unsubscribe = dialog.subscribe((options, resolve) => {
            const newDialog: DialogState = {
                ...options,
                id: Date.now() + Math.random(),
                resolve,
                isOpen: true,
            };
            setDialogs(prev => [...prev, newDialog]);
        });

        return unsubscribe;
    }, []);

    const closeDialog = (id: number, result: boolean) => {
        setDialogs(prev =>
            prev.map(d => d.id === id ? { ...d, isOpen: false } : d)
        );

        // Allow animation to finish before removing from DOM
        setTimeout(() => {
            setDialogs(prev => {
                const dialogToRemove = prev.find(d => d.id === id);
                if (dialogToRemove) {
                    dialogToRemove.resolve(result);
                }
                return prev.filter(d => d.id !== id);
            });
        }, 200);
    };

    if (dialogs.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
            {dialogs.map((d, index) => (
                <div key={d.id} className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-200 ${d.isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                        onClick={() => d.type === 'alert' ? closeDialog(d.id, true) : closeDialog(d.id, false)}
                    />

                    {/* Dialog Box */}
                    <div
                        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transition-all duration-300 transform ${d.isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                        style={{ zIndex: 1000 + index }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            {d.title && <h3 className="text-lg font-bold text-gray-900 mb-2">{d.title}</h3>}
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{d.message}</p>
                        </div>

                        <div className="flex border-t border-gray-100 bg-gray-50/50">
                            {d.type === 'confirm' && (
                                <button
                                    onClick={() => closeDialog(d.id, false)}
                                    className="flex-1 py-3.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border-r border-gray-100"
                                >
                                    {d.cancelText || '取消'}
                                </button>
                            )}
                            <button
                                onClick={() => closeDialog(d.id, true)}
                                className={`flex-1 py-3.5 text-sm font-bold transition-colors ${d.type === 'alert' ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'} ${d.type === 'alert' ? 'w-full' : ''}`}
                                autoFocus
                            >
                                {d.confirmText || '确定'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GlobalDialogs;
