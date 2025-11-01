import React, { useEffect, useRef } from 'react'

export default function Modal({ children, onClose, title, footer }) {
    const panelRef = useRef(null)

    useEffect(() => {
        const FOCUSABLE_SELECTORS = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
        const prevActive = document.activeElement

        function onKey(e) {
            if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
                return
            }

            if (e.key === 'Tab') {
                const el = panelRef.current
                if (!el) return
                const nodes = Array.from(el.querySelectorAll(FOCUSABLE_SELECTORS)).filter(n => n.offsetWidth > 0 || n.offsetHeight > 0 || n === document.activeElement)
                if (nodes.length === 0) {
                    // no focusable children - keep focus on panel
                    e.preventDefault()
                    el.focus()
                    return
                }
                const first = nodes[0]
                const last = nodes[nodes.length - 1]

                if (e.shiftKey) {
                    if (document.activeElement === first || document.activeElement === el) {
                        e.preventDefault()
                        last.focus()
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault()
                        first.focus()
                    }
                }
            }
        }

        document.addEventListener('keydown', onKey)

        // focus first focusable element inside the panel, or the panel itself
        const el = panelRef.current
        setTimeout(() => {
            if (!el) return
            const nodes = Array.from(el.querySelectorAll(FOCUSABLE_SELECTORS)).filter(n => n.offsetWidth > 0 || n.offsetHeight > 0)
            if (nodes.length) nodes[0].focus()
            else el.focus()
        }, 0)

        return () => {
            document.removeEventListener('keydown', onKey)
            // return focus to previously focused element
            try {
                if (prevActive && typeof prevActive.focus === 'function') prevActive.focus()
            } catch (e) {
                // ignore
            }
        }
    }, [onClose])

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />

            {/* panel */}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                className="relative w-full max-w-2xl mx-auto transform transition-all duration-200 scale-100 modal-panel">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5 dark:ring-0">
                    <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-700 modal-header-gradient">
                        <div className="flex items-center gap-3">
                            <h3 id="modal-title" className="text-lg font-medium leading-6 text-slate-900 dark:text-slate-100">{title}</h3>
                            <span className="text-sm text-slate-400 dark:text-slate-400">{/* optional subtitle slot */}</span>
                        </div>
                        <div>
                            <button onClick={onClose} aria-label="Close" className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 ring-0 hover:ring-1 hover:ring-slate-200 dark:hover:ring-slate-700 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-6" aria-labelledby="modal-title">
                        {children}
                    </div>

                    {footer && (
                        <div className="px-6 py-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-end gap-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
