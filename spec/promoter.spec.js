var rewire = require('rewire');
var Deployer = rewire('../acceptance/promoter.js');

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
    new Deployer().init(function(err) {
      expect(err).toBe(null);
      expect(command).toEqual('heroku auth:token');
      expect(options).toEqual({ token: 'AAA' });
      done();
    });
  });

  it('lists releases in reverse order of versions', function(done) {
    releases['a1'] = [ { description: 'old', version: 100}, { description: 'recent', version: 200} ];
    new Deployer().init(function(err, deployer) {
      deployer.fetchReleases('a1', function(err, rs) {
        expect(err).toBe(null);
        expect(rs).toEqual([ {description: 'recent', version: 200 }, {description: 'old', version: 100} ]);
        done();
      });
    });
  });

  it('provides the most recent release with a slug', function(done) {
    releases['a2'] = [ 
      { description: 'slug_old', version: 100, slug: {id: 1}}, 
      { description: 'slug_new', version: 200, slug: {id: 2}},
      { description: 'no_slug_newer', version: 300},
      { description: 'no_slug_id_newer', version: 400, slug: {}} 
    ];
    new Deployer().init(function(err, Deployer) {
      Deployer.mostRecentRelease('a2', function(err, r) {
        expect(err).toBe(null);
        expect(r).toEqual({description: 'slug_new', version: 200, slug: {id: 2}});
        done();
      });
    });
  });

  it('provides null if no slugged release is found', function(done) {
    releases['a3'] = [ 
      { description: 'no_slug_1', version: 300},
      { description: 'no_slug_2', version: 400, slug: {}} 
    ];
    new Deployer().init(function(err, deployer) {
      deployer.mostRecentRelease('a3', function(err, r) {
        expect(err).toBe(null);
        expect(r).toBe(null);
        done();
      });
    });
  });

  it('deploys', function(done) {
    createResult = { value: 'CREATE_RESULT' };
    new Deployer().init(function(err, deployer) {
      deployer.deploy('a4', 'SLUG_ID', 'DESCRIPTION', function(err, data) {
        expect(createOptions).toEqual({slug: 'SLUG_ID', description: 'DESCRIPTION'});
        expect(err).toBe(null);
        expect(data).toEqual({ value: 'CREATE_RESULT' });
        done();
      });
    });
  });
});

