import React from 'react'

export default function Spinner({ size = 40, speed = 600 }) {
    const style = { animationDuration: `${speed}ms` }
    return (
        <svg width={size} height={size} viewBox="0 0 50 50" className="animate-spin text-indigo-600" style={style}>
            <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" opacity="0.12" />
            <path d="M45 25a20 20 0 0 1-20 20" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.95" />
            <path d="M25 5a20 20 0 0 1 20 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
        </svg>
    )
}
