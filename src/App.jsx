import React, { useEffect, useRef } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import NavBar from './components/NavBar'
// Ensure we import the existing dashboard page. Some edits introduced a stale import
// pointing at `./pages/DashboardNew` which doesn't exist in the repo. Use the
// canonical `./pages/Dashboard` component.
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import AddTransaction from './pages/AddTransaction'
import About from './pages/About'
import Accounts from './pages/Accounts'
import AccountDetail from './pages/AccountDetail'
import { TransactionsProvider } from './context/TransactionsContext'
import { UIProvider, useUI } from './context/UIContext'
import Modal from './components/Modal'
import AccountEditor from './pages/AccountEditor'
import Snackbar from './components/Snackbar'
import Categories from './pages/Categories'
import CategoryEditor from './pages/CategoryEditor'

function AppInner() {
    const { modalOpen, modalEditId, modalDefaultAccount, modalAction, closeModal } = useUI()
    const loc = useLocation()
    const navigate = useNavigate()
    const { openAddModal } = useUI()

    // keep track of last non-modal path so we can restore it on modal close
    const lastNonModalPath = useRef(loc.pathname)
    const prevPathRef = useRef(null)

    // update lastNonModalPath when the user navigates to a non-modal route
    useEffect(() => {
        if (!loc.pathname.startsWith('/add') && !loc.pathname.startsWith('/edit/')) {
            lastNonModalPath.current = loc.pathname
        }
    }, [loc.pathname])

    // when route is /add or /edit/:id (direct navigation), open the modal and remember previous path
    useEffect(() => {
        if (loc.pathname === '/add') {
            if (!modalOpen) {
                prevPathRef.current = lastNonModalPath.current || '/'
                openAddModal(null)
            }
            return
        }
        if (loc.pathname.startsWith('/edit/')) {
            if (!modalOpen) {
                const parts = loc.pathname.split('/')
                const id = parts[2]
                prevPathRef.current = lastNonModalPath.current || '/'
                openAddModal(Number(id))
            }
            return
        }
    }, [loc.pathname])

    // when modal opens/closes from UI actions, push/restore URL accordingly
    useEffect(() => {
        if (modalOpen) {
            // if current path is not the modal path, navigate to modal path and remember previous
            if (!loc.pathname.startsWith('/add') && !loc.pathname.startsWith('/edit/')) {
                prevPathRef.current = lastNonModalPath.current || '/'
                const target = modalEditId ? `/edit/${modalEditId}` : '/add'
                navigate(target)
            }
        } else {
            // modal closed: if we stored a previous path, restore it
            if (prevPathRef.current) {
                const to = prevPathRef.current
                prevPathRef.current = null
                navigate(to)
            }
        }
    }, [modalOpen, modalEditId])

    return (
        <TransactionsProvider>
            <div className="app-shell">
                <NavBar />
                <main className="max-w-7xl mx-auto px-6 py-10">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/categories/:name" element={<CategoryEditor />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/accounts/:name" element={<AccountDetail />} />
                        <Route path="/add" element={<AddTransaction />} />
                        <Route path="/edit/:id" element={<AddTransaction />} />
                        <Route path="/about" element={<About />} />
                    </Routes>
                </main>

                {modalOpen && (
                    <Modal onClose={closeModal} title={modalAction === 'delete' ? 'Delete Transaction' : (modalEditId ? 'Edit Transaction' : 'Add Transaction')}>
                        <AddTransaction onClose={closeModal} editingId={modalEditId} defaultAccount={modalDefaultAccount} mode={modalAction} />
                    </Modal>
                )}

                {/* account edit modal */}
                {/** accountModalOpen/Name provided by UIContext */}
                <AccountEditorWrapper />
                <CategoryEditorWrapper />
                <SnackbarWrapper />
            </div>
        </TransactionsProvider>
    )
}

function AccountEditorWrapper() {
    const { accountModalOpen, accountModalName, closeAccountModal } = useUI()
    if (!accountModalOpen) return null
    return (
        <Modal onClose={closeAccountModal} title={`Edit ${accountModalName}`}>
            <AccountEditor name={accountModalName} onClose={closeAccountModal} />
        </Modal>
    )
}

function CategoryEditorWrapper() {
    const { categoryModalOpen, categoryModalName, categoryModalParent, closeCategoryModal } = useUI()
    if (!categoryModalOpen) return null
    return (
        <Modal onClose={closeCategoryModal} title={categoryModalName ? `Edit ${categoryModalName}` : 'New Category'}>
            <CategoryEditor name={categoryModalName} parent={categoryModalParent} onClose={closeCategoryModal} />
        </Modal>
    )
}

function SnackbarWrapper() {
    const { notification, hideNotification } = useUI()
    return <Snackbar notification={notification} onHide={hideNotification} />
}

export default function App() {
    return (
        <UIProvider>
            <AppInner />
        </UIProvider>
    )
}
