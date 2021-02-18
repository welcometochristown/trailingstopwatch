const mongoose = require('mongoose');
const marketSchema = require('../schema/schema_market')

module.exports = mongoose.model('market', new mongoose.Schema(marketSchema));