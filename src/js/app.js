App = {
  web3Provider: null,
  yourAddress: '',
  contracts: {},
  account: '0x0',
  hasVoted: false,
  winningCandidateId: null,

  init: function () {
    loader = $('#loader');
    content = $('#content');
    return App.initWeb3();
  },

  initWeb3: function () {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = window.ethereum;
      web3 = new Web3(window.ethereum);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Election.json", function (election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
    return App.bindEvents();
  },
  bindEvents: function () {
    $('#voteBtn').click(function () {
      var radioGroup = $("input[name='candidateGroup']");
      var selectedIndex = radioGroup.index(radioGroup.filter(':checked')) + 1;

      if (selectedIndex == 0) {
        $('.toast').hide();
        M.toast({ html: 'Select a Candidate first' });
      } else {
        App.contracts.Election.deployed().then(function (instance) {
          instance.vote(selectedIndex, { from: web3.currentProvider.selectedAddress }).then(function (result) {
            console.log(result);
            location.reload();
          });
        });
      }
    });
  },

  render: function () {

    var electionInstance;
    loader.show();
    content.show();

    
    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });
    
    // Load contract data
    App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      electionInstance.endTime().then(function (endTime) {
        var countDownDate = new Date(endTime * 1000);
        var now = new Date().getTime();
        var distance = countDownDate - now;
        if (distance > 0) {
          showCountDown(endTime);
        }
        else{
          $('#countDown').text('Time is up')
          App.showResult();
        }
      });
      electionInstance.getCurrentVoter().then(function (result) {
        if (result[2]) {  /////// if already voted
          console.log("voted")
          electionInstance.topic().then(function (topic) {
            $('#votedContent').show();
            $('#electionTopic2').text(topic);
            $('#welcomeText2').text('Welcome ' + result[1]);
            $('#yourAddress2').text('Your Account\'s address is ' + web3.currentProvider.selectedAddress);
            electionInstance.candidates(result[4]).then(function (candidate) {
              $('#yourCandidate').text('You have successfully voted for ' + candidate[1]);
            });
          });

        } else {
          $('#voterContent').show();
          loader.hide();
          electionInstance.topic().then(function (topic) {

            $('#voteContent').show();
            $('#topic').text(topic);
            $('#yourAddress').text('Your Account\'s address is ' + web3.currentProvider.selectedAddress);
            $('#welcomeText').text('Welcome ' + result[1]);

            electionInstance.candidatesCount().then(function (candidatesCount) {
              var candidatesRow = $('#candidatesRow');
              var candidateTemplate = $('#candidateTemplate');
              for (var i = 1; i <= candidatesCount; i++) {
                electionInstance.candidates(i).then(function (candidate) {
                  candidateTemplate.find('#candidateName').text(candidate[1]);
                  candidatesRow.append(candidateTemplate.html());
                })
              }
            });

          });

        }

      });


    });
  },
  showResult: function () {

    $('#resultsContent').show();
    $('#voteBtn').attr("disabled", true);
    $('#voteContent').hide();
    App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      electionInstance.candidatesCount().then(function (candidatesCount) {
        var resultCollection = $('#resultCollection');
        var resultTemplate = $('#resultTemplate');
        var temp = 1;
        for (var i = 1; i <= candidatesCount; i++) {
          electionInstance.getVoteCountFor(i).then(function (result) {
            resultTemplate.find('#candidateName').text(temp++ + ". " + result[1]);
            resultTemplate.find('#candidateVotes').text(result[0] + " Votes");
            resultCollection.append(resultTemplate.html());
          });
        }
        electionInstance.getWinningCandidate().then(function (winningCandidate) {
          $('#winnerMessage').text(winningCandidate[1] + " has won the election.");
        });
      });
    });

  },

  // Listen for events emitted from the contract
  listenForEvents: function () {
    App.contracts.Election.deployed().then(function (instance) {
      instance.voteCasted({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log(event);
        if (event.blockNumber != App.latestblock) {
          if (App.latestblock == 0) {
            App.latestblock = event.blockNumber;
          } else {
            App.latestblock += 1;
          }
        } else {
          // location.reload();
        }
      });
    });
  }
};
function showCountDown(endTime) {
  var countDownDate = new Date(endTime * 1000);
  var x = setInterval(function () {
    var now = new Date().getTime();
    var distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    $('#countDown').text('Election ends in ' + days + "d " + hours + "h " + minutes + "m " + seconds + "s ");

    if (distance < 0) {
      clearInterval(x);
      $('#countDown').text('Time is up');
      location.reload();
    }
  }, 1000);
}

$(function () {
  $(window).load(function () {
    App.init();
  });
});
