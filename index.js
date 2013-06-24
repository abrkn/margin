var util = require('util')
, EventEmitter = require('events').EventEmitter
, debug = require('debug')('margin')
, num = require('num')
, async = require('async')
, _ = require('lodash')
, assert = require('assert')
, Position = require('./position')
, debug = require('debug')('margin')
, Margin = module.exports = function(market, type, from, to, options) {
    this.market = market
    this.type = type
    this.from = from
    this.to = to
    this.options = _.defaults(options, {
        interval: 1000 * 60 * 5
    })

    assert(~['bid', 'ask'].indexOf(this.type))

    this.position = new Position(this.market, type, to, {
        whatif: this.options.whatif
    })

    this.tick()
}

util.inherits(Margin, EventEmitter)

Margin.prototype.sync = function(depth, cb) {
    var that = this
    , desired = []

    debug('syncing')

    if (this.type == 'bid') {
        if (!depth.bids.length) {
            return debug('there is no bid depth to copy')
        }

        _.each(this.options.margins, function(volume, margin) {
            var bid = num(depth.bids[0].price).mul(1 - margin)
            bid.set_precision(3)

            debug('best bid %j', depth.bids[0])

            if (depth.bids.length) {
                desired.push({
                    market: that.market,
                    type: 'bid',
                    volume: volume,
                    price: bid.toString()
                })

            }
        })
    } else {
        if (!depth.asks.length) {
            return debug('there is no ask depth to copy')
        }

        debug('best ask %j', depth.asks[0])

        _.each(this.options.margins, function(volume, margin) {
            var ask = num(depth.asks[0].price).mul(1 + margin)
            ask.set_precision(3)

            desired.push({
                market: that.market,
                type: 'ask',
                price: ask.toString(),
                volume: volume
            })
        })
    }

    debug('desired %j', desired)

    this.position.sync(desired, cb)
}

Margin.prototype.tick = function() {
    var that = this

    debug('acquiring source depth for %s', this.market)

    async.waterfall([
        this.from.depth.bind(this.from, that.market),
        this.sync.bind(this)
    ], function(err) {
        if (err) return that.emit('error', err)
        debug('next tick in %d seconds', Math.round(that.options.interval / 1e3))
        that.timer = setTimeout(that.tick.bind(that), that.options.interval)
    })
}
