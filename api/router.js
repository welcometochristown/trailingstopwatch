//requires
const express = require('express');
const mongoose = require('mongoose');
//create router
const router = express.Router();

//create scraper
const scrape = require('./scrape');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json()
const config = require('./config');
const ticker = require('./models/model_ticker');

router.get('/favicon.ico', (req, res) => res.status(204));

//GET default
router.get('/', async(req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err)
            throw err;
 
            ticker.find({}, (err, entries) => {
             res.status(200).json(entries);
        })
    })  
});

router.get('/:ticker', async(req, res, next) => {
    const ticker = req.params.ticker;
    const result = await scrape.getTickerPrice(ticker);
    res.status(200).json(result);
});

router.post('/', jsonParser, (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true, useFindAndModify: false }, (err) => {

        if (err)
            throw err;

        req.body.forEach(function(e){
            ticker.findOneAndUpdate(
                {ticker: e.ticker}, e, { upsert: true, returnNewDocument:true, new: true }
             )
             .catch(err => {
                 console.log(err.message);
                 res.sendStatus(400);
             })
          });

        res.status(200)
        
    })  
});
module.exports = router;