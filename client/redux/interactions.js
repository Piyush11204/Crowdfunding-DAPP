import Web3 from "web3";
import * as actions from "./actions";
import CrowdFunding from '../artifacts/contracts/Crowdfunding.sol/Crowdfunding.json'
import Project from '../artifacts/contracts/Project.sol/Project.json'
import { groupContributionByProject, groupContributors, projectDataFormatter, withdrawRequestDataFormatter} from "../helper/helper";

// Always fetch fresh from config — no stale module-level cache
const loadContractAddress = async () => {
  try {
    const response = await fetch(`/contractConfig.json?_=${Date.now()}`);
    if (response.ok) {
      const config = await response.json();
      return config.crowdfundingAddress || null;
    }
  } catch (error) {
    console.warn('Could not load contract config.');
  }
  return null;
};

// Web3 instance for signing (MetaMask) — used for transactions
export const loadWeb3 = async (dispatch) => {
  const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
  dispatch(actions.web3Loaded(web3));
  return web3;
};

// Always read contracts via direct localhost HTTP provider (bypasses MetaMask network confusion)
const getReadWeb3 = () => new Web3("http://localhost:8545");

// Ensure MetaMask is on Hardhat Local (chain 31337) before any transaction.
// Attempts an automatic network switch; throws a user-friendly error if refused.
export const requireHardhatNetwork = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed.');
  }
  const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
  const chainId = parseInt(chainIdHex, 16);
  if (chainId === 31337) return; // already on Hardhat

  try {
    // Try to switch
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x7a69' }], // 31337 in hex
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      // Network not added yet — add it
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x7a69',
          chainName: 'Hardhat Local',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['http://127.0.0.1:8545'],
        }],
      });
    } else {
      throw new Error('Please switch MetaMask to the Hardhat Local network (localhost:8545) to continue.');
    }
  }
};

// Load connected wallet
export const loadAccount = async (web3, dispatch) => {
  try {
    // Request account access if not already granted
    const accounts = await web3.eth.getAccounts();
    
    if (accounts && accounts.length > 0) {
      const network = await web3.eth.net.getId();
      dispatch(actions.walletAddressLoaded(accounts[0]));
      localStorage.setItem("ADDRESS", accounts[0]);
      return accounts;
    }
  } catch (error) {
    console.error('Error loading account:', error);
    // Return empty array if user rejects or no accounts available
    return [];
  }
};

//Connect with crowd funding contract — always loads fresh address, always uses localhost for reads
export const loadCrowdFundingContract = async(web3,dispatch) =>{
  try {
    const address = await loadContractAddress();

    if (!address) {
      console.warn('Contract address not found. Run: npx hardhat run scripts/deploy.js --network localhost');
      dispatch(actions.crowdFundingContractLoaded(null));
      return null;
    }

    // Use direct localhost provider to check code — avoids MetaMask network mismatch
    const readWeb3 = getReadWeb3();
    const code = await readWeb3.eth.getCode(address);
    if (code === '0x' || code === '0x0') {
      console.warn(`No contract at ${address}. Redeploy with: npx hardhat run scripts/deploy.js --network localhost`);
      dispatch(actions.crowdFundingContractLoaded(null));
      return null;
    }

    // Use the passed web3 (MetaMask) for the contract so it can sign transactions
    const crowdFunding = new web3.eth.Contract(CrowdFunding.abi, address);
    dispatch(actions.crowdFundingContractLoaded(crowdFunding));
    return crowdFunding;
  } catch (error) {
    console.error('Error loading crowd funding contract:', error);
    dispatch(actions.crowdFundingContractLoaded(null));
    return null;
  }
}

// Start fund raising project
export const startFundRaising = async(web3,CrowdFundingContract,data,onSuccess,onError,dispatch) =>{
  if (!CrowdFundingContract) {
    onError('Smart contract not loaded. Please ensure contracts are deployed.');
    return;
  }
  try {
    await requireHardhatNetwork();
  } catch (e) {
    onError(e.message); return;
  }

  const {minimumContribution,deadline,targetContribution,projectTitle,projectDesc,account} = data;

  await CrowdFundingContract.methods.createProject(minimumContribution,deadline,targetContribution,projectTitle,projectDesc).send({from:account})
  .on('receipt', function(receipt){ 

    const projectsReceipt = receipt.events.ProjectStarted.returnValues;
    const contractAddress = projectsReceipt.projectContractAddress;

    const formattedProjectData = projectDataFormatter(projectsReceipt,contractAddress)
    var projectConnector = new web3.eth.Contract(Project.abi,contractAddress);

    dispatch(actions.newProjectContractsLoaded(projectConnector));
    dispatch(actions.newProjectsLoaded(formattedProjectData));

    onSuccess()
  })
  .on('error', function(error){ 
    onError(error.message)
  })
}

// 1 - Get all funding project address
// 2 - Connect with funding project contract
// 3 - Get project details 
export const getAllFunding = async(CrowdFundingContract,web3,dispatch) =>{
  try {
    // Skip if contract doesn't exist
    if (!CrowdFundingContract) {
      console.warn('Contract not loaded. Skipping funding data fetch.');
      dispatch(actions.projectsLoaded([]));
      dispatch(actions.projectContractsLoaded([]));
      return;
    }
    
    const fundingProjectList = await CrowdFundingContract.methods.returnAllProjects().call()
    
    const projectContracts = [];
    const projects = [];

    await Promise.all(fundingProjectList.map(async (data)=>{
      try {
        var projectConnector = new web3.eth.Contract(Project.abi,data);
        const details = await projectConnector.methods.getProjectDetails().call()
        projectContracts.push(projectConnector);
        const formattedProjectData = projectDataFormatter(details,data)
        projects.push(formattedProjectData)
      } catch (error) {
        console.error(`Error loading project details for ${data}:`, error);
      }
    }))

    dispatch(actions.projectContractsLoaded(projectContracts));
    dispatch(actions.projectsLoaded(projects));
  } catch (error) {
    console.error('Error fetching all funding projects:', error);
    dispatch(actions.projectsLoaded([]));
    dispatch(actions.projectContractsLoaded([]));
  }
}

// Contribute in fund raising project
export const contribute = async(crowdFundingContract,data,dispatch,onSuccess,onError) =>{
  if (!crowdFundingContract) {
    onError('Smart contract not loaded. Please ensure contracts are deployed.');
    return;
  }
  try {
    await requireHardhatNetwork();
  } catch (e) {
    onError(e.message); return;
  }

  const {contractAddress,amount,account} = data;
  await crowdFundingContract.methods.contribute(contractAddress).send({from:account,value:amount})
  .on('receipt', function(receipt){
    dispatch(actions.amountContributor({projectId:contractAddress,amount:amount}))
    onSuccess()
  })
  .on('error', function(error){ 
    onError(error.message)
  })
}

// Get all contributors by contract address
export const getContributors = async (web3,contractAddress,onSuccess,onError) =>{
  if (!web3 || !contractAddress) {
    onError('Web3 or contract address not available');
    return;
  }

  try {
    var projectConnector = new web3.eth.Contract(Project.abi,contractAddress);
    const getContributions = await projectConnector.getPastEvents("FundingReceived",{
      fromBlock: 0,
      toBlock: 'latest'
    })
    onSuccess(groupContributors(getContributions))
  } catch (error) {
    onError(error)
  }
}

// Request for withdraw amount
export const createWithdrawRequest = async (web3,contractAddress,data,onSuccess,onError) =>{
  if (!web3 || !contractAddress) {
    onError('Web3 or contract address not available');
    return;
  }
  try {
    await requireHardhatNetwork();
  } catch (e) {
    onError(e.message); return;
  }

  const {description,amount,recipient,account} = data;
  try {
    var projectConnector = new web3.eth.Contract(Project.abi,contractAddress);
    await projectConnector.methods.createWithdrawRequest(description,amount,recipient).send({from:account})
    .on('receipt', function(receipt){
      const withdrawReqReceipt = receipt.events.WithdrawRequestCreated.returnValues;
      const formattedReqData = withdrawRequestDataFormatter(withdrawReqReceipt,withdrawReqReceipt.requestId)
      onSuccess(formattedReqData)
    })
    .on('error', function(error){ 
      onError(error.message)
    })
  } catch (error) {
    onError(error.message);
  }
}

// Get all withdraw request
export const getAllWithdrawRequest = async (web3,contractAddress,onLoadRequest) =>{
  if (!web3 || !contractAddress) {
    console.warn('Web3 or contract address not available');
    onLoadRequest([]);
    return;
  }

  try {
    var projectConnector = new web3.eth.Contract(Project.abi,contractAddress);
    var withdrawRequestCount = await projectConnector.methods.numOfWithdrawRequests().call();
    var withdrawRequests = [];

    if(withdrawRequestCount <= 0){
      onLoadRequest(withdrawRequests)
      return
    }

    for(var i=1;i<=withdrawRequestCount;i++){
      const req = await projectConnector.methods.withdrawRequests(i-1).call();
      withdrawRequests.push(withdrawRequestDataFormatter({...req,requestId:i-1}));
    }
    onLoadRequest(withdrawRequests)
  } catch (error) {
    console.error('Error fetching withdraw requests:', error);
    onLoadRequest([]);
  }
}

// Vote for withdraw request
export const voteWithdrawRequest = async (web3,data,onSuccess,onError) =>{
  if (!web3) {
    onError('Web3 not available');
    return;
  }
  try {
    await requireHardhatNetwork();
  } catch (e) {
    onError(e.message); return;
  }

  const {contractAddress,reqId,account} = data;
  try {
    var projectConnector = new web3.eth.Contract(Project.abi,contractAddress);
    await projectConnector.methods.voteWithdrawRequest(reqId).send({from:account})
    .on('receipt', function(receipt){
      console.log(receipt)
      onSuccess()
    })
    .on('error', function(error){ 
      onError(error.message)
    })
  } catch (error) {
    onError(error.message);
  }
}

// Withdraw requested amount 
export const withdrawAmount = async (web3,dispatch,data,onSuccess,onError) =>{
  if (!web3) {
    onError('Web3 not available');
    return;
  }
  try {
    await requireHardhatNetwork();
  } catch (e) {
    onError(e.message); return;
  }

  const {contractAddress,reqId,account,amount} = data;
  try {
    var projectConnector = new web3.eth.Contract(Project.abi,contractAddress);
    await projectConnector.methods.withdrawRequestedAmount(reqId).send({from:account})
    .on('receipt', function(receipt){
      console.log(receipt)
      dispatch(actions.withdrawContractBalance({
        contractAddress:contractAddress,
        withdrawAmount:amount
      }))
      onSuccess()
    })
    .on('error', function(error){ 
      onError(error.message)
    })
  } catch (error) {
    onError(error.message);
  }
}

//Get my contributions
export const getMyContributionList = async(crowdFundingContract,account) =>{
  if (!crowdFundingContract || !account) {
    console.warn('Contract or account not available for fetching contributions');
    return [];
  }

  try {
    const getContributions = await crowdFundingContract.getPastEvents("ContributionReceived",{
      filter: { contributor: account },
      fromBlock: 0,
      toBlock: 'latest'
    })
    return groupContributionByProject(getContributions);
  } catch (error) {
    console.error('Error fetching contribution list:', error);
    return [];
  }
}
