import React, { useState, useEffect } from 'react'
import { useTransactions } from '../context/TransactionsContext'
import { useUI } from '../context/UIContext'

export default function CategoryEditor({ name, parent: propParent, onClose }) {
    const { state, dispatch } = useTransactions()
    const { showNotification } = useUI()
    const startName = name || ''
    const [categoryName, setCategoryName] = useState(startName)
    useEffect(() => setCategoryName(startName), [startName])

    // autofocus the name input for faster workflow
    const nameInputRef = React.useRef(null)
    useEffect(() => {
        if (nameInputRef.current) nameInputRef.current.focus()
    }, [])

    // (parent selection removed from modal UI; parent is set only when creating via Categories → Add subcategory)

    const onSave = () => {
        const nm = (categoryName || '').trim()
        if (!nm) {
            // defensive: Save should be disabled when empty, but guard anyway
            alert('Please provide a category name')
            return
        }
        // creating new
        if (!name) {
            if ((state.categories || {})[nm]) {
                alert('A category with that name already exists')
                if (nameInputRef.current) nameInputRef.current.focus()
                return
            }
            // if created via "Add subcategory" the parent is provided by propParent
            dispatch({ type: 'addCategory', payload: { name: nm, parent: propParent || null } })
            if (onClose) onClose()
            return
        }
        // renaming
        if (nm !== name) {
            if ((state.categories || {})[nm]) {
                alert('A category with that name already exists')
                if (nameInputRef.current) nameInputRef.current.focus()
                return
            }
            dispatch({ type: 'renameCategory', payload: { oldName: name, newName: nm } })
        }
        // parent change is not supported from this modal when editing
        if (onClose) onClose()
    }

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [reassignTo, setReassignTo] = useState('Uncategorized')

    const onDeleteConfirm = () => {
        if (!name) return
        const prev = JSON.parse(JSON.stringify(state))
        dispatch({ type: 'deleteCategory', payload: { name, reassignTo: reassignTo || 'Uncategorized' } })
        showNotification && showNotification({ message: `Deleted category ${name}`, actionLabel: 'Undo', action: () => dispatch({ type: 'restore', payload: prev }) })
        setShowDeleteConfirm(false)
        if (onClose) onClose()
    }

    return (
        <div className="max-w-md">
            <h2 className="text-2xl font-semibold mb-4">{name ? 'Edit Category' : 'New Category'}</h2>
            <div className="card-lg">
                <label className="block mb-4">
                    <div className="text-sm muted">Category Name</div>
                    <input ref={nameInputRef} value={categoryName} onChange={e => setCategoryName(e.target.value)} className="mt-2 w-full border rounded-lg px-3 py-2" />
                </label>
                {/* Parent is not editable in this modal; parent is applied when creating a subcategory from the Categories page */}

                <div className="flex items-center gap-3 justify-between">
                    <div>
                        {name && (
                            <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-ghost text-red-600">Delete</button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="btn">Cancel</button>
                        <button onClick={onSave} disabled={!categoryName.trim()} className="btn btn-primary">Save</button>
                    </div>
                </div>

                {showDeleteConfirm && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-4 rounded">
                        <div className="text-sm font-medium text-red-700 mb-2">Confirm delete</div>
                        <div className="text-sm muted mb-2">Choose where to reassign transactions previously using this category.</div>
                        <select value={reassignTo} onChange={e => setReassignTo(e.target.value)} className="w-full border rounded px-3 py-2 mb-3">
                            <option value="Uncategorized">Uncategorized</option>
                            {Object.keys(state.categories || {}).filter(c => c !== name).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2 justify-end">
                            <button onClick={onDeleteConfirm} className="btn btn-primary">Delete</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="btn">Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
