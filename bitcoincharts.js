var _ = require('lodash')
, request = require('request')

var bc = module.exports = function(options) {
    this.options = options || {}
    _.defaults(this.options, {
        url: 'http://api.bitcoincharts.com/v1/markets.json',
        cacheDuration: 5 * 60 * 1000
    })
}

bc.prototype.expand = function(pair) {
    if (pair == 'BTCXRP') return 'rippleXRP'
    if (pair == 'BTCUSD') return 'bitstampUSD'
    if (pair == 'BTCEUR') return 'btcdeEUR'
    throw new Error('Unsupported pair ' + pair + '')
}

// bitcoincharts to "depth"
/*
        "volume": 50037.96166764,
        "latest_trade": 1369723841,
        "bid": 127.79985,
        "high": 135.47,
        "currency": "USD",
        "currency_volume": 6447085.030039783,
        "ask": 127.79987,
        "close": 127.8,
        "avg": 128.84387803129022,
        "symbol": "mtgoxUSD",
        "low": 124
*/
bc.prototype.toDepth = function(market) {
    return {
        bids: market.bid ? [{ price: market.bid.toString(), volume: null }] : [],
        asks: market.ask ? [{ price: market.ask.toString(), volume: null }] : []
    }
}

bc.prototype.depth = function(pair, cb) {
    var that = this
    , market = this.expand(pair)

    if (this.cache && +new Date() - this.cachedAt < this.cacheDuration) {
        return cb(null, this.cache[market])
    }

    request({
        url: this.options.url,
        json: true
    }, function(err, res, body) {
        if (err) return cb(err)

        if (res.statusCode != 200) {
            return cb(new Error('Status code ' + 200))
        }

        if (!body) {
            return cb(new Error('Body is null'))
        }

        that.cache = body.reduce(function(dict, market) {
            dict[market.symbol] = that.toDepth(market)
            return dict
        }, {})

        this.cachedAt = +new Date()

        cb(null, that.cache[market])
    })
}
