import React from 'react'

export default function Icon({ name, className = '', title }) {
    if (name === 'x' || name === 'close') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" focusable="false">
                {title ? <title>{title}</title> : null}
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        )
    }

    if (name === 'search' || name === 'magnify') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" className={className} aria-hidden="true" focusable="false">
                {title ? <title>{title}</title> : null}
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8.5 14a5.5 5.5 0 100-11 5.5 5.5 0 000 11z" />
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13.5 13.5L18 18" />
            </svg>
        )
    }

    // fallback: empty placeholder to avoid rendering nothing
    return (
        <svg className={className} aria-hidden="true" focusable="false" />
    )
}
