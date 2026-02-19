import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import { walletDisconnected } from '../redux/actions'

const Navbar = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const [openMenu, setOpenMenu] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const account = useSelector(state => state.web3Reducer.account)

  useEffect(() => { setIsHydrated(true) }, [])

  const handleLogout = () => {
    dispatch(walletDisconnected())
    localStorage.removeItem('ADDRESS')
    router.push('/')
  }

  const shortAddress = account
    ? account.slice(0, 6) + '...' + account.slice(-4)
    : ''

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">FundChain</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            <Link href="/dashboard">
              <span className={router.pathname === '/dashboard' ? 'nav-link-active' : 'nav-link'}>Dashboard</span>
            </Link>
            <Link href="/my-contributions">
              <span className={router.pathname === '/my-contributions' ? 'nav-link-active' : 'nav-link'}>My Contributions</span>
            </Link>
          </div>

          {/* Right side */}
          <div className="hidden sm:flex items-center gap-3">
            {isHydrated && account && (
              <>
                <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-slate-700">{shortAddress}</span>
                </div>
                <button onClick={handleLogout} className="btn-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100" onClick={() => setOpenMenu(!openMenu)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={openMenu ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isHydrated && openMenu && (
        <div className="sm:hidden border-t border-slate-100 px-4 pt-2 pb-4 space-y-1 bg-white">
          <Link href="/dashboard"><span className="block nav-link">Dashboard</span></Link>
          <Link href="/my-contributions"><span className="block nav-link">My Contributions</span></Link>
          {account && (
            <div className="pt-2 border-t border-slate-100 mt-2">
              <p className="text-xs text-slate-400 mb-1">Connected</p>
              <p className="text-sm font-mono font-medium text-slate-700 truncate">{account}</p>
              <button onClick={handleLogout} className="btn-danger mt-2 w-full">Logout</button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
