var rewire = require('rewire');
var promoter = rewire('../acceptance/promoter.js');


function runSpecs(done) {
  done(null, { results: { failedCount: 0 }, lines: []});
}


function DeployerStub() {
  this.init = function(done) { done(); };
  this.mostRecentRelease = function(app, done) { done(null, { description: 'most_recent_at_' + app, slug: { id: app + '_slug_id' }}); };
  this.fetchReleases = function(app, done) { done(null, [ { slug: { id: app + '_slug_id' }} ]); };
  this.deploy = function(app, slug, description, done) {
    done(null, 'Deploying ' + slug + ' to app ' + app+ ' {' + description + '}');
  };
}

describe('promoter', function() {
  it('deploys most recent slug of one application to another application', function(done) {
    promoter('a', 'b', { deployer: new DeployerStub(), runSpecs: runSpecs }, function(err, data) {
      expect(err).toBe(null);
      expect(data).toBe('Deploying a_slug_id to app b {Promotion of: most_recent_at_a}');
      done();
    });
  });
  it('reports an error if init fails', function(done) {
    var deployer = new DeployerStub();
    deployer.init = function(done) { done('SOME PROBLEM'); };
    promoter('a', 'b', { deployer: deployer , runSpecs: runSpecs }, function(err, data) {
      expect(err.cause).toEqual('SOME PROBLEM');
      expect(data).toBe(undefined);
      done();
    });
  });
  it('reports an error if mostRecentRelease fails', function(done) {
    var problem = new Error('SOMETHING WENT WRONG');
    var deployer = new DeployerStub();
    deployer.mostRecentRelease = function(app, done) { done(problem); };
    promoter('a', 'b', { deployer: deployer, runSpecs: runSpecs }, function(err, data) {
      expect(err.cause).toBe(problem);
      expect(data).toBe(undefined);
      done();
    });
  });
  it('reports an error if fetchReleases fails', function(done) {
    var deployer = new DeployerStub();
    deployer.fetchReleases = function(app, done) { done('FAILURE IN deployer.fetchReleases()'); };
    promoter('a', 'b', { deployer: deployer, runSpecs: runSpecs }, function(err, data) {
      expect(err.cause).toEqual('FAILURE IN deployer.fetchReleases()');
      expect(data).toBe(undefined);
      done();
    });
  });
  it('reports an error if deploy fails', function(done) {
    var deployer = new DeployerStub();
    deployer.deploy = function(app, slug, description, done) { done('FAILURE IN deployer.deploy()'); };
    promoter('a', 'b', { deployer: deployer, runSpecs: runSpecs }, function(err, data) {
      expect(err.cause).toEqual('FAILURE IN deployer.deploy()');
      expect(data).toBe(undefined);
      done();
    });
  });
  it('generates output', function(done) {
    var deployer = new DeployerStub();
    var mockConsole = {
      log: function() { this.buf.push(Array.prototype.slice.call(arguments, 0).join(' ')) },
      buf: []
    }
    promoter('a', 'b', { out: mockConsole, deployer: deployer, runSpecs: runSpecs }, function(err, data) {
      expect(mockConsole.buf.join('\n')).toEqual([
        'Promoting slug a_slug_id to prod.',
        '>>>>>>>>>> ALL\'S WELL',
        '"Deploying a_slug_id to app b {Promotion of: most_recent_at_a}"'
      ].join('\n'));
      expect(err).toBe(null);
      expect(data).toBe('Deploying a_slug_id to app b {Promotion of: most_recent_at_a}');
      done();
    });
  });
  it('does not deploy if both apps run the same slug', function(done) {
    var deployer = new DeployerStub();
    deployer.mostRecentRelease = function(app, done) { done(null, { description: 'DESC', slug: { id: 'SLUG_ID' }}); };
    promoter('a', 'b', { deployer: deployer, runSpecs: runSpecs }, function(err, data) {
      expect(err.message).toEqual('Slug at staging is already live in prod.');
      expect(data).toBe(undefined);
      done();
    });
  });
  it('fails if the tests throw', function(done) {
    var deployer = new DeployerStub();
    deployer.deploy = function() { throw new Error('SHOULD NOT BE CALLED'); };
    promoter('a', 'b', { deployer: deployer, runSpecs: function(done) { done('TESTS FAILED') } }, function(err, data) {
      expect(err.cause).toEqual('TESTS FAILED');
      expect(data).toBe(undefined);
      done();
    });
  });
  it('fails if the fail count reported by tests is non zero', function(done) {
    var deployer = new DeployerStub();
    deployer.deploy = function() { throw new Error('SHOULD NOT BE CALLED'); };
    promoter('a', 'b', {
        deployer: deployer,
        runSpecs: function(done) {
          done(null, {
            results: { failedCount: 1 },
            lines: ['TEST_1_FAILED ', 'TEST_2_FAILED']
      })}},
      function(err, data) {
        expect(err.cause).toEqual('TEST_1_FAILED TEST_2_FAILED');
        expect(data).toBe(undefined);
        done();
      });
  });
  it('reports status of prod. and staging when options.status is true', function(done) {
    var deployer = new DeployerStub();
    promoter('a', 'b', { status: true, deployer: deployer }, function(err, data) {
      expect(err).toBe(null);
      expect(data).toContain('"description": "most_recent_at_a"');
      expect(data).toContain('"id": "a_slug_id"');
      expect(data).toContain('"description": "most_recent_at_b"');
      expect(data).toContain('"id": "b_slug_id"');
      done();
    });
  });
  it('status report fails if deployer fails to initialize', function(done) {
    var deployer = new DeployerStub();
    deployer.init = function(done) { done('PROBLEM in deployer.init()'); };
    promoter('a', 'b', { status: true, deployer: deployer }, function(err, data) {
      expect(err.cause).toBe('PROBLEM in deployer.init()');
      expect(data).toBe(undefined);
      done();
    });
  });
  it('properly fails if could not receive a status of prod. or staging', function(done) {
    var deployer = new DeployerStub();
    deployer.mostRecentRelease = function(app, done) { done('mostRecentRelease() failed') };
    promoter('a', 'b', { status: true, deployer: deployer }, function(err, data) {
      expect(err.cause).toEqual('mostRecentRelease() failed') && expect(data).toBe(undefined);
      done();
    });
  });
});

