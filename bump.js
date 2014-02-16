var exec = require('child_process').exec;
var Heroku = require('heroku-client');

function bail(value, err) {
  console.log(err.stack ? err.stack : err);
  process.exit(value);
}


function processReleases(releases) {
  function isLater(lhsTimestamp, rhsTimestamp) { 
    return new Date(lhsTimestamp) > new Date(rhsTimestamp);
  };

  function pickLatest(releaseA, releaseB) {
    if (isLater(releaseA.updated_at, releaseB.updated_at))
      return releaseA;
    else 
      return releaseB;
  }


  var slugged = releases.filter(function(x) { return x.slug && x.slug.id; });
  var latest = slugged.reduce(pickLatest, { updated_at: 0 });

  if (latest.slug.id !== '606de634-d57e-4260-8144-0eaab99e2c72') {
    bail(1, new Error('wrong slug.id: ' + JSON.stringify(latest, null, '  ')));
  }
  
  if (latest.description.indexOf('75b0467462409b1a6fc15a8f0f1ba25') < 0) {
    bail(1, new Error('wrong description: ' + JSON.stringify(latest, null, '  ')));
  }

  console.log(JSON.stringify(latest, null, '  '));
}

function processToken(error, stdout, stderr) {
  var token = stdout.trim();
  var heroku = new Heroku({ token: token });

  heroku.apps('collidingobjects-staging').releases().list(function(err, data) { 
    if (err) return bail(1, err);
    processReleases(data);
  });
}

exec("heroku auth:token", processToken);
