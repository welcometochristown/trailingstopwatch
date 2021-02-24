const schema = {
    "ticker": String,
    "exchange" : String,
    "isCrypto" : Boolean,
    "sl_price" : Number,
    "trlng_sl_offset" : Number,
    "highestprice" : Number,
    "startingprice" : Number,
    "track": Boolean,
    "alerttype": String
}

module.exports = schema;