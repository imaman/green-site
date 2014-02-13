var GitHubApi = require("github");

var github = new GitHubApi({
    version: "3.0.0",
});

github.repos.getBranch(
  {user: 'imaman', repo: 'green-site', branch: 'master'}, 
  function(err, data) { 
    if (err) return console.log(err.stack); 
    console.log(data.commit.sha); 
  }
);

