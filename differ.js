var Github = require('github');
var github = new Github({version: '3.0.0'});
var base64_decode = require('base64').decode;
var jsdiff = require('diff');



exports.differ = function(userName, repoName, path, fromCommit, toCommit, callback) {
  var result = {};
  var n = 0;

  function set(field, value) {
    result[field] = value;
    ++n;
    if (n != 2) {
      return;
    }

    var diffs = jsdiff.diffLines(result.from, result.to);

    var transitions = [];
    var lineIndex = 0;
    diffs.forEach(function(part) {
      var lines = part.value.split('\n');
      if (lines[lines.length - 1] === '') {
        lines.splice(lines.length - 1, 1);
      }
      if (part.added) {
        transitions.push({kind: '+', len: lines.length, lines: lines});
      } else if (part.removed) {
        transitions.push({kind: '-', len: lines.length, lines: lines});
      } else {
        transitions.push({kind: ':', len: lines.length, lines: lines});
      }
    });
   
    result.transitions = transitions;
    result.from = result.from.split('\n');
    result.to = result.to.split('\n');
    callback(null, result);
  }
  github.repos.getContent({user: userName, repo: repoName, path: path, ref: fromCommit}, function(e, d) { 
    if (e) {
      callback(e);
    } else {
      set('from', base64_decode(d.content));
    }
  });
  github.repos.getContent({user: userName, repo: repoName, path: path, ref: toCommit}, function(e, d) { 
    if (e) {
      callback(e);
    } else {
      set('to', base64_decode(d.content));
    }
  });
}


