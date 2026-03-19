import {useEffect} from 'react'
import '../styles/globals.css'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import {wrapper} from '../redux/store'
import { useDispatch } from 'react-redux';
import { getAllFunding, loadAccount, loadCrowdFundingContract, loadWeb3 } from '../redux/interactions';
import { projectsLoaded, projectContractsLoaded } from '../redux/actions';
import { Router } from 'next/router';
import NProgress from 'nprogress'
import "nprogress/nprogress.css";
import { chainOrAccountChangedHandler } from '../helper/helper';

// Expose reload function so Navbar can trigger reconnect
if (typeof window !== 'undefined') window._reloadBlockchain = null;

function MyApp({ Component, pageProps }) {

  const dispatch = useDispatch()

  useEffect(() => {
    loadBlockchain()
  }, [])
  

  const loadBlockchain = async() =>{
    if (typeof window === 'undefined') return;

    try {
      const web3 = await loadWeb3(dispatch)

      // Load account (non-blocking — contract loads regardless)
      loadAccount(web3, dispatch).catch(() => {})

      // Always try to load the contract and projects — does not require a connected account
      const crowdFundingContract = await loadCrowdFundingContract(web3, dispatch)
      if (crowdFundingContract) {
        await getAllFunding(crowdFundingContract, web3, dispatch)
      } else {
        dispatch(projectsLoaded([]))
        dispatch(projectContractsLoaded([]))
      }
    } catch (error) {
      console.error('Failed to load blockchain:', error);
      dispatch(projectsLoaded([]))
      dispatch(projectContractsLoaded([]))
    }
  }

  // Expose reload so Navbar reconnect button can trigger it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._reloadBlockchain = loadBlockchain
    }
  }, [])

  Router.events.on("routeChangeStart",()=> NProgress.start())
  Router.events.on("routeChangeComplete",()=> NProgress.done())
  Router.events.on("routeChangeError",()=> NProgress.done())
  
  useEffect(() => {
    // listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', chainOrAccountChangedHandler);
      // Listen for chain change
      window.ethereum.on('chainChanged', chainOrAccountChangedHandler);
    }
  }, [])
  
  
  return (
    <>
      <ToastContainer/>
      <Component {...pageProps} />
    </>
  )
}

export default wrapper.withRedux(MyApp)
