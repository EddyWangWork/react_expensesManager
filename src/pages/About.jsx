import React from 'react'

export default function About() {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold">About</h2>
            <div className="card-lg">
                <p className="mb-2">This is a simple expenses manager demo built with React, Vite and Tailwind CSS.</p>
                <p className="muted">It demonstrates: track transactions, add/delete transactions, and a small dashboard showing totals. Use this as a starting point for persistence, reports, and integrations.</p>
            </div>
        </div>
    )
}
