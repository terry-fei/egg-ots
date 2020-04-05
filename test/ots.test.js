'use strict';

const mock = require('egg-mock');

describe('test/ots.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/ots-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, ots')
      .expect(200);
  });
});
