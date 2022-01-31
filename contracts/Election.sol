pragma solidity >= 0.5.0 < 0.9.0;

contract Election{

    string public topic;
    uint public startTime;
    uint public endTime;
    struct Candidate{
        // model a candidate
        uint id;
        string name;
        string partyName;
        uint voteCount;
    }
    struct Voter {
    address voterAddress;
    string name;
    bool voted;
    uint candidateId;
  }
  
    // for counting votes
    mapping(uint => uint) private voteCount;
    // store accounts that have voted
    mapping(address => Voter) private voters;
    // store candidate
    mapping(uint=> Candidate) public candidates;
    uint private votersCount;
    // store candidates Count
    uint public candidatesCount;

    event votedEvent (
        uint indexed _candidateId
    );

    constructor() public
    {
        startTime = block.timestamp;
      endTime = startTime + 2 minutes;
        topic = 'Who should be the Prime Minister(2022)?';
        candidates[1] = Candidate(1, 'Rahul Gandhi','Congress',0);
        candidates[2] = Candidate(2, 'Narendra Modi','BJP',0);
        candidates[3] = Candidate(3, 'Arvind Kejriwal','AAP',0);
        candidates[4] = Candidate(4, 'Akhilesh Yadav','SP',0);
        candidatesCount = 4;
    }
    event voteCasted(address _voterAddress);


  function getCurrentVoter() public view returns (address, string memory, bool, uint) {
    Voter memory voter = voters[msg.sender];
    return(voter.voterAddress, voter.name, voter.voted, voter.candidateId);
  }

  function getVoteCountFor(uint _candidateId) public view  returns(uint, string memory) {
    return (voteCount[_candidateId], candidates[_candidateId].name);
  }

  // main voting function takes your selected candidate id and increments their vote count 
  function vote(uint _candidateId) public  
  {
    require(!voters[msg.sender].voted);
    voteCount[_candidateId]++;
    voters[msg.sender].voted = true;
    voters[msg.sender].candidateId = _candidateId;
    emit voteCasted(msg.sender);
  }
  
    function getWinningCandidate() public view  returns (uint, string memory, uint) {
    uint maxVote = 0;
    uint maxVoteCandidateId = 0;
      for(uint i = 0; i<candidatesCount; i++) {
        if(maxVote < voteCount[i]) {
          maxVote = voteCount[i];
          maxVoteCandidateId = i;
        }
      }  
    return (maxVoteCandidateId, candidates[maxVoteCandidateId].name, maxVote);
  }
}
// 0x52C3087e23D22078D5a81A1FD17F2dE82D317613
// Election.deployed().then(function(i) { app=i;})
// web3.eth.getAccounts().then(function(acc){ accounts = acc })
// accounts[0] instead of web3.eth.accounts
// truffle migrate --reset 
// truffle console
// npm run dev