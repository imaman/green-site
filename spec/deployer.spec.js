var rewire = require('rewire');
var Deployer = rewire('../acceptance/deployer.js');
var flow = require('../funflow').flow;


var command = null;
Deployer.__set__('exec', function(cmd, done) {
  command = cmd;
  done(null, 'AAA', '');
});


var options = null;
var app = null;
var releases = {};
var createOptions = null;
var createResult = null;

function FakeHeroku(opts) {
  options = opts;
  this.apps = function(s) { 
    app = s; 
    return { 
      releases: function() { 
        return {
          list: function(done) {
            done(null, releases[s]);
          },

          create: function(createOpts, done) {
            createOptions = createOpts;
            done(null, createResult);
          }
        };
      } 
    } 
  };
};

Deployer.__set__('Heroku', FakeHeroku);

describe('Deployer', function() {
  it('uses the Heroku CLI for obtaining a token', function(done) {
    var deployer = new Deployer();
    flow(done).seq(
      deployer.init.bind(deployer),
      function(next) {
        expect(command).toEqual('heroku auth:token');
        expect(options).toEqual({ token: 'AAA' });
        next();
      }).run();
  });

  it('lists releases in reverse order of versions', function(done) {
    releases['a1'] = [ { description: 'old', version: 100}, { description: 'recent', version: 200} ];
    var deployer = new Deployer();
    flow(done).seq(
      deployer.init.bind(deployer), 
      deployer.fetchReleases.bind(deployer, 'a1'),
      function(rs, next) {
        expect(rs).toEqual([ {description: 'recent', version: 200 }, {description: 'old', version: 100} ]);
        next();
      }).run();
  });

  it('provides the most recent release with a slug', function(done) {
    releases['a2'] = [ 
      { description: 'slug_old', version: 100, slug: {id: 1}}, 
      { description: 'slug_new', version: 200, slug: {id: 2}},
      { description: 'no_slug_newer', version: 300},
      { description: 'no_slug_id_newer', version: 400, slug: {}} 
    ];
    var deployer = new Deployer();
    flow(done).seq(
      deployer.init.bind(deployer),
      deployer.mostRecentRelease.bind(deployer, 'a2'),
      function(r, next) {
        expect(r).toEqual({description: 'slug_new', version: 200, slug: {id: 2}});
        next();
      }).run();
  });

  it('provides null if no slugged release is found', function(done) {
    releases['a3'] = [ 
      { description: 'no_slug_1', version: 300},
      { description: 'no_slug_2', version: 400, slug: {}} 
    ];
    var deployer = new Deployer();
    flow(done).seq(
      deployer.init.bind(deployer),
      deployer.mostRecentRelease.bind(deployer,'a3'),
      function(r, next) {
        expect(r).toBe(null);
        next();
      }).run();
  });

  it('deploys', function(done) {
    createResult = { value: 'CREATE_RESULT' };
    var deployer = new Deployer();
    flow(done).seq(
      deployer.init.bind(deployer),
      deployer.deploy.bind(deployer, 'a4', 'SLUG_ID', 'DESCRIPTION'),
      function(data, next) {
        expect(createOptions).toEqual({slug: 'SLUG_ID', description: 'DESCRIPTION'});
        expect(data).toEqual({ value: 'CREATE_RESULT' });
        next();
      }).run();
  });
});

