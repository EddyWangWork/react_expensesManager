import React, { createContext, useContext, useState, useCallback } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
    const [modalOpen, setModalOpen] = useState(false)
    const [modalEditId, setModalEditId] = useState(null)
    const [modalDefaultAccount, setModalDefaultAccount] = useState(null)
    const [modalAction, setModalAction] = useState(null)
    const [accountModalOpen, setAccountModalOpen] = useState(false)
    const [accountModalName, setAccountModalName] = useState(null)
    const [categoryModalOpen, setCategoryModalOpen] = useState(false)
    const [categoryModalName, setCategoryModalName] = useState(null)
    const [categoryModalParent, setCategoryModalParent] = useState(null)
    const [notification, setNotification] = useState(null)
    const notificationTimer = React.useRef(null)

    // openAddModal can accept an id (for editing) and an options object { defaultAccount }
    const openAddModal = useCallback((id = null, opts = {}) => {
        setModalEditId(id)
        setModalDefaultAccount(opts.defaultAccount || null)
        setModalAction(opts.action || null)
        setModalOpen(true)
    }, [])

    const openAccountModal = useCallback((name) => {
        setAccountModalName(name)
        setAccountModalOpen(true)
    }, [])

    // openCategoryModal(name, opts = { parent })
    const openCategoryModal = useCallback((name, opts = {}) => {
        setCategoryModalName(name)
        setCategoryModalParent(opts.parent || null)
        setCategoryModalOpen(true)
    }, [])

    const showNotification = useCallback((note, ms = 6000) => {
        // note: { message, actionLabel, action }
        setNotification(note)
        if (notificationTimer.current) clearTimeout(notificationTimer.current)
        if (ms) notificationTimer.current = setTimeout(() => setNotification(null), ms)
    }, [])

    const hideNotification = useCallback(() => {
        setNotification(null)
        if (notificationTimer.current) {
            clearTimeout(notificationTimer.current)
            notificationTimer.current = null
        }
    }, [])

    const closeModal = useCallback(() => {
        setModalOpen(false)
        setModalEditId(null)
        setModalDefaultAccount(null)
        setModalAction(null)
    }, [])

    const closeAccountModal = useCallback(() => {
        setAccountModalOpen(false)
        setAccountModalName(null)
    }, [])

    const closeCategoryModal = useCallback(() => {
        setCategoryModalOpen(false)
        setCategoryModalName(null)
        setCategoryModalParent(null)
    }, [])

    return (
        <UIContext.Provider value={{ modalOpen, modalEditId, modalDefaultAccount, modalAction, openAddModal, closeModal, accountModalOpen, accountModalName, openAccountModal, closeAccountModal, categoryModalOpen, categoryModalName, categoryModalParent, openCategoryModal, closeCategoryModal, notification, showNotification, hideNotification }}>
            {children}
        </UIContext.Provider>
    )
}

export function useUI() {
    const ctx = useContext(UIContext)
    if (!ctx) throw new Error('useUI must be used within UIProvider')
    return ctx
}
