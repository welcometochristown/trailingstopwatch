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
const market = require('./models/model_market');
const { exec } = require('child_process');

router.get('/favicon.ico', (req, res) => res.status(204));

const sendStopLossEmail = (ticker, price) => {
    console.log('sending stop loss email for ' + ticker);
    exec('echo "Stop Loss Limit Hit For ' + ticker + ' at ' + price + '! Time to sell!" | mail -s "' + ticker + ' - Stop Loss Hit" wtctstockalerts@gmail.com', (err, stdout, stderr) => {
        if (err) {
          console.error(err)
        }
    });
}

const sendTrailingStopLossEmail = (ticker, price) => {
    console.log('sending trailing stop loss email for ' + ticker);
    exec('echo "Trailing Stop Loss Limit Hit For ' + ticker + ' at ' + price + '! Time to sell!" | mail -s "' + ticker + ' - Trailing Stop Loss Hit" wtctstockalerts@gmail.com', (err, stdout, stderr) => {
        if (err) {
          console.error(err)
        }
    });
}

router.delete('/all', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err)
            throw err;


        ticker.deleteMany({}, (err) =>{
            if (err)
                throw err;
        })

        market.deleteMany({}, (err) =>{
            if (err)
                throw err;
        })
        res.sendStatus(200);
    })  
});


router.delete('/tickers', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err)
            throw err;


        ticker.deleteMany({}, (err) =>{
            if (err)
                throw err;
        })

        res.sendStatus(200);
    })  
});


router.delete('/markets', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err)
            throw err;

        market.deleteMany({}, (err) =>{
            if (err)
                throw err;
        })
        res.sendStatus(200);
    })  
});
    
//reload all tickers in the db, recalculate the current price
router.get('/reload', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err)
            throw err;
 
        ticker.find({}, async (err, entries) => {

            var items = entries.map(n => 
                ({
                    ticker : n.ticker,
                    exchange : n.exchange, 
                    isCrypto : n.isCrypto
                }));
            
            //get the price for each ticker
            const prices = await scrape.getTickerPrices(items);

            for(var i in entries) {

                const t = entries[i];
                const pResult = prices.filter(n => n.ticker == t.ticker);

                if(pResult.length == 0) {
                    console.log('no price info for ' + t.ticker);
                    continue;
                }
                
                const p = pResult[0].price;

                market.findOne({ticker : t.ticker, exchange: t.exchange, isCrypto:t.isCrypto}, (err, item) =>
                {
                    if(item){
                        item.highestprice = Math.max(item.highestprice, p);
                    }
                    else {
                        item = new market();
                        item.ticker = t.ticker;
                        item.exchange = t.exchange;
                        item.isCrypto = t.isCrypto;
                        item.startingprice = p;
                        item.highestprice = p;
                    }

                    item.timestamp = new Date().toISOString();
                    item.price = p;
                    item.save();

                    if(t.track && item.highestprice !== null) {

                       var trailing_price = (item.highestprice-t.trlng_sl_offset);
    
                       if(t.trlng_sl_offset !== null && trailing_price > item.startingprice && item.price <= trailing_price ) {
                            sendTrailingStopLossEmail(t.ticker, item.price );
                            t.track = false;
                            t.save();
                       }
                       else if(t.sl_price !== null && item.price <= t.sl_price) {
                            sendStopLossEmail(t.ticker, item.price )
                            t.track = false;
                            t.save();
                       }
                    }  
                });

                          
            }
            res.sendStatus(200);

        }) .catch(err => {
            console.log(err.message);
            res.sendStatus(400);
        })
    })  
});


//get all tickers entries
router.get('/', async(req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err)
            throw err;
 
            ticker.find({}, (err, entries) => {
            res.status(200).json(entries);
        })
    })  
});

router.post('/realtimeprice', jsonParser, async(req, res, next) => {
    
    try {
        var p = await scrape.getTickerPrice(req.body);
        res.status(200).json(p);    
    }catch(err){
        console.log(err)
        res.sendStatus(400);
    }
});

//get a tickers' value
router.post('/price', jsonParser, async(req, res, next) => {

    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err)
            throw err;
         
        market.findOne({ticker: req.body.ticker, exchange:req.body.exchange, isCrypto:req.body.isCrypto}, async (err, entry) => {
            res.status(200).json(entry);
        }).catch(err => {
            console.log(err.message);
            res.sendStatus(400);
        });

    })

});

//Insert a single ticker entry
router.put('/', jsonParser, (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true, useFindAndModify: false }, (err) => {

        if (err)
            throw err;

            ticker.create(req.body, (err, item) => {
           
            if(err) 
                throw err;

            res.status(200).json(item);
        });
    });        
});

//Update a single ticker entry
router.post('/', jsonParser, (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true, useFindAndModify: false }, (err) => {

        if (err)
            throw err;

        ticker.findOne({_id: req.body._id}, async (err, entry) => {

            //if wasnt tracked, but now is tracked, reset the highest price value on the market price
            if(!entry.track && req.body.track) {
                market.findOne({ticker : req.body.ticker, exchange: req.body.exchange, isCrypto:req.body.isCrypto}, (err, item) =>
                {
                    if(!item)
                        return;

                    item.startingprice = item.price; 
                    item.highestprice = item.price;
                    item.save();
                });
            }

            ticker.findOneAndUpdate({_id : req.body._id},  req.body, { upsert: true }, (err, item) =>
            {
                if(err) 
                    throw err;
    
                res.status(200).json(item);
            });
        });
    });        
});

//delete a ticker
router.delete('/:id', async(req, res, next) => {

    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err)
            throw err;

        ticker.findOneAndDelete({_id: req.params.id}, async (err, entry) => {
            res.sendStatus(200);
        }).catch(err => {
            console.log(err.message);
            res.sendStatus(400);
        });

    })

});



module.exports = router;