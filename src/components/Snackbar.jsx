import React from 'react'

export default function Snackbar({ notification, onHide }) {
    if (!notification) return null

    const { message, actionLabel, action } = notification

    return (
        <div className="fixed right-4 bottom-6 z-50">
            <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-4">
                <div className="text-sm">{message}</div>
                {actionLabel && (
                    <button onClick={() => { action && action(); onHide && onHide() }} className="text-sm underline">{actionLabel}</button>
                )}
                <button onClick={onHide} className="ml-2 text-sm opacity-70">✕</button>
            </div>
        </div>
    )
}
