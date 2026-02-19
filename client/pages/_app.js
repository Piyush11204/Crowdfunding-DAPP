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

function MyApp({ Component, pageProps }) {

  const dispatch = useDispatch()

  useEffect(() => {
    loadBlockchain()
  }, [])
  

  const loadBlockchain = async() =>{
    if (typeof window === 'undefined') return;

    try {
      const web3 = await loadWeb3(dispatch)
      const account = await loadAccount(web3, dispatch)
      
      if (account && account.length > 0) {
        const crowdFundingContract = await loadCrowdFundingContract(web3, dispatch)
        if (crowdFundingContract) {
          await getAllFunding(crowdFundingContract, web3, dispatch)
        } else {
          console.warn('Contract not found at address. Make sure contracts are deployed.');
        }
      } else {
        // No accounts connected — still dispatch empty projects so UI stops loading
        dispatch(projectsLoaded([]))
        dispatch(projectContractsLoaded([]))
      }
    } catch (error) {
      console.error('Failed to load blockchain:', error);
      dispatch(projectsLoaded([]))
    }
  }

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
