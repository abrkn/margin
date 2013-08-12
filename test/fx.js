/* global describe, it */
var expect = require('expect.js')
, Fx = require('../fx')

describe('fx', function() {
    describe('depth', function() {
        it('converts using xe.com', function(done) {
            var inner = {
                depth: function(market, cb) {
                    expect(market).to.be('BTCUSD')
                    cb(null, {
                        bids: [{ price: '100', volume: '5'}],
                        asks: [{ price: '90', volume: '2'}]
                    })
                }
            }
            , fx = new Fx(inner, 'USD')

            fx.depth('BTCNOK', function(err, res) {
                if (err) return done(err)
                expect(res.bids.length).to.be(1)
                expect(+res.bids[0].price).to.above(400)
                expect(+res.bids[0].price).to.below(700)

                expect(res.asks.length).to.be(1)
                expect(+res.asks[0].price).to.above(400)
                expect(+res.asks[0].price).to.below(700)
                done()
            })
        })
    })
})
