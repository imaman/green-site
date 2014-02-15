var GitHubApi = require("github");
var github = new GitHubApi({
    version: "3.0.0",
});

module.exports = function(user, repo, branchName) {
  function extractBranch(callback) {
    github.repos.getBranch(
      { user: user, repo: repo, branch: branchName },
      callback);
  }

  function extractCommit(callback) {
    extractBranch(function(err, branch) {
      if (err) return callback(err);
      callback(null, branch.commit);
    });
  }

  return {
    extractBranch: extractBranch,
    extractCommit: extractCommit
  };
};


