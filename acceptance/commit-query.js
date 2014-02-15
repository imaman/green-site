var GitHubApi = require("github");
var github = new GitHubApi({
    version: "3.0.0",
});

exports.extractBranch = function(callback) {
  github.repos.getBranch(
    {user: 'imaman', repo: 'green-site', branch: 'master'}, 
    callback);
}

exports.extractCommit = function(callback) {
  exports.extractBranch(function(err, branch) {
    if (err) return callback(err);
    callback(null, branch.commit);
  });
}

