const mongoose = require('mongoose');
const tickerSchema = require('../schema/schema_ticker')

module.exports = mongoose.model('ticker', new mongoose.Schema(tickerSchema));