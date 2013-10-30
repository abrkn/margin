var async = require('async')
, format = require('util').format
, num = require('num')
, request = require('request')
, debug = require('debug')('snow:fx')
, fx = module.exports = function(inner, ref) {
    this.inner = inner;
    this.ref = ref;
};

fx.prototype.depth = function(market, cb) {
    var that = this, rate, depth
    , url = format(
        'http://www.xe.com/wap/2co/convert.cgi?Amount=1&From=%s&To=%s',
        this.ref, market.substr(3))

    async.parallel({
        'rate': function(next) {
            request({
                url: url,
                json: true
            }, function(err, res, data) {
                if (err) return next(err);
                rate = num(data.match(/right.>([^ ]+)/)[1])
                debug('exchange rate found at ' + rate.toString());
                next();
            });
        },

        'depth': function(next) {
            debug('finding depth for ' + market.substr(0, 3) + that.ref);

            that.inner.depth(market.substr(0, 3) + that.ref, function(err, o) {
                if (err) return next(err);
                depth = o;
                next();
            });
        }
    }, function(err) {
        if (err) return cb(err);

        var bid = depth.bids[0];
        var ask = depth.asks[0];
        var outputs = { asks: [], bids: [] };

        if (bid) {
            debug('best bid is %s @ %s', bid.volume, bid.price)

            outputs.bids.push({
                price: num(bid.price).mul(rate).toString(),
                volume: num(bid.volum || 0).mul(rate).toString()
            });
        }

        if (ask) {
            debug('best ask is %s @ %s', ask.volume, ask.price)

            outputs.asks.push({
                price: num(ask.price).mul(rate).toString(),
                volume: num(ask.volume || 0).mul(rate).toString()
            });
        }

        cb(null, outputs);
    })
}
