(function() {
  var model = {
    posts: [ 
      {
        id: 1,
        title: 'T1',
        body: 'B1',
        publishedAt: '2014-01-11T11:11:11-05:00',
      },
      {
        id: 2,
        title: 'T2',
        body: 'B2',
        publishedAt: '2014-02-22T22:22:22-05:00',
      }
    ]
  };

  require('./site').createDriver(3001, model).start();
})()
