import Web3 from "web3";
import * as actions from "./actions";
import CrowdFunding from '../artifacts/contracts/Crowdfunding.sol/Crowdfunding.json'
import Project from '../artifacts/contracts/Project.sol/Project.json'
import { groupContributionByProject, groupContributors, projectDataFormatter, withdrawRequestDataFormatter} from "../helper/helper";

const crowdFundingContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

//Load web3 
export const loadWeb3 = async (dispatch) => {
  const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
  dispatch(actions.web3Loaded(web3));
  return web3;
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

//Connect with crowd funding contract
export const loadCrowdFundingContract = async(web3,dispatch) =>{
  try {
    // Verify contract exists at address
    const code = await web3.eth.getCode(crowdFundingContractAddress);
    if (code === '0x') {
      console.warn(`No contract found at address ${crowdFundingContractAddress}. Make sure to deploy contracts first.`);
      dispatch(actions.crowdFundingContractLoaded(null));
      return null;
    }
    
    const crowdFunding = new web3.eth.Contract(CrowdFunding.abi, crowdFundingContractAddress);
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
    onError('Smart contract not loaded. Please ensure contracts are deployed and you are connected to the correct network.');
    return;
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
    onError('Smart contract not loaded. Please ensure contracts are deployed and you are connected to the correct network.');
    return;
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
