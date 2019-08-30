const { mapArgs } = require('../lib/parser');
const chai = require('chai');

chai.should();

describe('parser', function () {
  describe('mapArgs', function () {
    it('should convert shortcuts in args to actual values', function () {
      mapArgs({b: 's'}).should.eql({browser: 'Safari'});
      mapArgs({p: 'm9'}).should.eql({platform: 'Mac 10.9'});
      mapArgs({o: 'l'}).should.eql({orientation: 'landscape'});
    });
    it('should convert shortcuts for the whole arg set', function () {
      mapArgs({b: 's', p: 'm9'}).should.eql({browser: 'Safari', platform: 'Mac 10.9'});
    });
    it('should convert shortcuts even when the param is not a shortcut', function () {
      mapArgs({browser: 's', platform: 'm9'})
        .should.eql({browser: 'Safari', platform: 'Mac 10.9'});
    });
    it('should prefer full keys to shortcut keys', function () {
      mapArgs({browser: 's', b: 'c'}).should.eql({browser: 'Safari'});
    });
    it('should not convert values for params that dont have shortcuts', function () {
      mapArgs({browser: 's', a: '1.6.5'})
        .should.eql({browser: 'Safari', backendVersion: '1.6.5'});
    });
  });
});
