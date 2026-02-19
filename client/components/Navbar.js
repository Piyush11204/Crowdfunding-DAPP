import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import { walletDisconnected } from '../redux/actions'
import Web3 from 'web3'

const Navbar = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const [openMenu, setOpenMenu] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [accountBalance, setAccountBalance] = useState('0')
  const [networkInfo, setNetworkInfo] = useState(null)
  const [copied, setCopied] = useState(false)
  const account = useSelector(state => state.web3Reducer.account)

  useEffect(() => { setIsHydrated(true) }, [])

  useEffect(() => {
    if (account && isHydrated) {
      fetchAccountDetails()
    }
  }, [account, isHydrated])

  const fetchAccountDetails = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const web3 = new Web3(window.ethereum)
        
        // Fetch balance
        const balanceWei = await web3.eth.getBalance(account)
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether')
        setAccountBalance(parseFloat(balanceEth).toFixed(4))

        // Fetch network info
        const chainId = await web3.eth.getChainId()
        const networkName = getNetworkName(chainId)
        setNetworkInfo({
          chainId,
          networkName
        })
      }
    } catch (error) {
      console.error('Error fetching account details:', error)
    }
  }

  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      31337: 'Hardhat Local',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai'
    }
    return networks[chainId] || `Unknown Network (${chainId})`
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(account)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shortAddress = account
    ? account.slice(0, 6) + '...' + account.slice(-4)
    : ''

  const handleLogout = () => {
    dispatch(walletDisconnected())
    localStorage.removeItem('ADDRESS')
    router.push('/')
  }

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
          <div className="hidden sm:flex items-center gap-3 relative">
            {isHydrated && account && (
              <>
                <button 
                  onClick={() => setShowAccountModal(!showAccountModal)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-slate-700">{shortAddress}</span>
                  <svg className={`w-4 h-4 text-slate-500 transition-transform ${showAccountModal ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {/* Account Details Modal */}
                {showAccountModal && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-6 z-50">
                    {/* Close button */}
                    <button 
                      onClick={() => setShowAccountModal(false)}
                      className="absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-lg"
                    >
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Wallet Address */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Wallet Address</p>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <code className="text-sm font-mono text-slate-700 break-all flex-1">{account}</code>
                        <button
                          onClick={copyToClipboard}
                          className="flex-shrink-0 p-2 hover:bg-slate-200 rounded-md transition-colors"
                          title="Copy to clipboard"
                        >
                          {copied ? (
                            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Account Balance */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">ETH Balance</p>
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-200">
                        <p className="text-2xl font-bold text-indigo-600">{accountBalance}</p>
                        <p className="text-xs text-slate-500">Ethereum Balance</p>
                      </div>
                    </div>

                    {/* Network Info */}
                    {networkInfo && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Network</p>
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <p className="text-sm font-medium text-slate-700">{networkInfo.networkName}</p>
                          <p className="text-xs text-slate-500">Chain ID: {networkInfo.chainId}</p>
                        </div>
                      </div>
                    )}

                    {/* Account Status */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Status</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-sm text-emerald-700">Connected</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      <a
                        href={`https://etherscan.io/address/${account}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                      >
                        View on Etherscan ↗
                      </a>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}

                <button onClick={handleLogout} className="btn-danger hidden lg:flex items-center gap-1">
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
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-2">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Account Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-slate-700 break-all flex-1">{account}</code>
                  <button
                    onClick={copyToClipboard}
                    className="flex-shrink-0 p-1 hover:bg-slate-200 rounded-md"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-200">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">ETH Balance</p>
                <p className="text-lg font-bold text-indigo-600">{accountBalance}</p>
              </div>

              {networkInfo && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Network</p>
                  <p className="text-sm font-medium text-slate-700">{networkInfo.networkName}</p>
                  <p className="text-xs text-slate-500">ID: {networkInfo.chainId}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-emerald-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <p className="text-xs font-medium">Connected</p>
              </div>

              <a
                href={`https://etherscan.io/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium"
              >
                View on Etherscan ↗
              </a>

              <button onClick={handleLogout} className="btn-danger mt-2 w-full text-sm">Logout</button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
