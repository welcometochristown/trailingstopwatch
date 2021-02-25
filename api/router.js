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

const logger = require('./logger');
const alert = require('./alert');

let  monitorReponse = null;

router.get('/favicon.ico', (req, res) => res.status(204));


const sendStopLossAlert = async (ticker, price, type) => {
    await sendAlert('Stop Loss Price Hit For ' + ticker + ' at ' + price, type);
}

const sendTrailingStopLossAlert = async (ticker, price, type) => {
    await sendAlert('Trailing Stop Loss Price Hit For ' + ticker + ' at ' + price, type);
}

const sendPriceAlert = async (ticker, price, type) => {
    await sendAlert('Price Hit For ' + ticker + ' at ' + price, type);
}

const sendAlert = async(msg, type) => {
    if(type=='Email')
        await alert.sendEmail(msg);

    if(type=='Push')
        await alert.sendPushOver(msg);
}

const monitorResponse = () => {
    if(monitorReponse) {
        monitorReponse.write(`data: ${JSON.stringify({ date : Date.now() })}\n\n`);
    }
}

router.get('/triggermonitor', async (req, res, next) => {
    monitorResponse();
    res.sendStatus(200);
});

router.get('/monitor', async (req, res, next) => {
    // Mandatory headers and http status to keep connection open
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    res.on('close', () => {
        monitorReponse = null;
    });

    monitorReponse = res;
})


router.get('/status', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
        
        if (err) {
            console.logError(err);
            res.sendStatus(500);
        }

        res.sendStatus(200);
    });
});

router.delete('/all', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err) {
            console.logError(err);
            res.sendStatus(500);
        }

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
     
        if (err) {
            console.logError(err);
            res.sendStatus(500);
        }

        ticker.deleteMany({}, (err) =>{
            if (err) {
                console.logError(err);
                res.sendStatus(500);
            }
        })

        res.sendStatus(200);
    })  
});


router.delete('/markets', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err) {
            console.logError(err);
            res.sendStatus(500);
        }

        market.deleteMany({}, (err) =>{
            if (err) {
                console.logError(err);
                res.sendStatus(500);
            }
        })
        res.sendStatus(200);
    })  
});
    
//reload all tickers in the db, recalculate the current price
router.get('/reload', (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err) {
            console.logError(err);
            res.sendStatus(500);
        }
 
        ticker.find({}, async (err, entries) => {

            const deDupe = (items) => {
                const distinctItems = [];
                for(var i in items)
                {
                    var item = items[i];
                    if(!distinctItems.some(n => n.ticker == item.ticker && n.exchange == item.exchange && n.isCrypto == item.isCrypto))
                        distinctItems.push(item);
                }
                return distinctItems;
            }

            var items = deDupe(entries.map(n => 
                ({
                    ticker : n.ticker,
                    exchange : n.exchange, 
                    isCrypto : n.isCrypto
                })));

            console.log(items);
            
            //get the price for each ticker
            const prices = await scrape.getTickerPrices(items);

            for(var i in entries) {

                const t = entries[i];
                const pResult = prices.filter(n => n.ticker === t.ticker);

                if(pResult.length == 0 || pResult[0].price === null) {
                    logger.log('no price info for ' + t.ticker);
                    continue;
                }
                
                const price = pResult[0].price;
                let previousprice = null;

                market.findOne({ticker : t.ticker, exchange: t.exchange, isCrypto:t.isCrypto}, (err, item) =>
                {
                    if (err) {
                        console.logError(err);
                        return;
                    }

                    if(!item){
                        item = new market();
                        item.ticker = t.ticker;
                        item.exchange = t.exchange;
                        item.isCrypto = t.isCrypto;
                    }   
                    else {
                        previousprice= item.price;
                    }        
                    
                    item.timestamp = new Date().toISOString();
                    item.price = price;
                    item.save();
                });

                t.highestprice = Math.max(t.highestprice, price);

                if(t.track) {
                    logger.log('tracked..');
                    logger.log('price : ' + price);

                    if(t.highestprice !== null && t.trlng_sl_offset !== null) {
                        var trailing_price = (t.highestprice-t.trlng_sl_offset);
                        logger.log('trailing stop loss : ' + trailing_price);

                        if((t.startingprice === null || trailing_price > t.startingprice) && price <= trailing_price ) {
                            sendTrailingStopLossAlert(t.ticker, price, t.alerttype);
                            t.track = false;
                        }
                    }
                    
                    if(t.sl_price !== null)
                    {
                        logger.log('stop loss : ' + t.sl_price);

                        if(price <= t.sl_price) {
                            sendStopLossAlert(t.ticker, price, t.alerttype)
                            t.track = false;
                        }
                    }

                    if(t.alertprice !== null) {
                        let sendAlert = (t.alertprice == price) || 
                                        (previousprice !== null && (t.alertprice >= price && t.alertprice < previousprice) || (t.alertprice <= price && t.alertprice > previousprice))
                                    
                        if(sendAlert) {
                            sendPriceAlert(t.ticker, price, t.alerttype);
                            t.alertprice = null;
                        }
                    }
                } 

                t.save();
            }
            
            monitorResponse();
            res.sendStatus(200);

        }) .catch(err => {
            logger.log(err.message);
            res.sendStatus(500);
        })
    })  
});


//get all tickers entries
router.get('/', async(req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err) {
            console.logError(err);
            res.sendStatus(500);
        }
 
        ticker.find({}, (err, entries) => {

            if (err) {
                console.logError(err);
                res.sendStatus(500);
            }

            res.status(200).json(entries);
        })
    })  
});

router.post('/realtimeprice', jsonParser, async(req, res, next) => {
    
    try {
        var price = await scrape.getTickerPrice(req.body);
        res.status(200).json(price);    
    }catch(err){
        logger.log(err)
        res.sendStatus(500);
    }
});

//get a tickers' value
router.post('/price', jsonParser, async(req, res, next) => {

    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err) {
            console.logError(err);
            res.sendStatus(500);
        }
         
        market.findOne({ticker: req.body.ticker, exchange:req.body.exchange, isCrypto:req.body.isCrypto}, async (err, entry) => {

            if (err) {
                console.logError(err);
                res.sendStatus(500);
            }

            res.status(200).json(entry);
        })

    })

});

//Insert a single ticker entry
router.put('/', jsonParser, (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true, useFindAndModify: false }, (err) => {

        if (err) {
            console.logError(err);
            res.sendStatus(500);
        }

        ticker.create(req.body, (err, item) => {
           
            if (err) {
                console.logError(err);
                res.sendStatus(500);
            }

            res.status(200).json(item);
        });
    });        
});

//Update a single ticker entry
router.post('/', jsonParser, (req, res, next) => {
    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true, useFindAndModify: false }, (err) => {

        if (err) {
            console.logError(err);
            res.sendStatus(500);
        }

        ticker.findOne({_id: req.body._id}, async (err, entry) => {

            if (err) {
                console.logError(err);
                res.sendStatus(500);
            }

            //if wasnt tracked, but now is tracked, reset the highest price value on the market price
            if(!entry.track && req.body.track) {
                market.findOne({ticker : req.body.ticker, exchange: req.body.exchange, isCrypto:req.body.isCrypto}, (err, item) =>
                {
                    if(!item)
                        return;

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

        }).catch(err => {
            logger.log(err.message);
            res.sendStatus(500);
        });
    });        
});

//delete a ticker
router.delete('/:id', async(req, res, next) => {

    mongoose.connect('mongodb+srv://' + config.db_config.user + ':' + config.db_config.pass + '@' + config.db_config.cluster + '/' + config.db_config.db + '?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
     
        if (err)
            throw err;

        ticker.findOneAndDelete({_id: req.params.id}, async (err, entry) => {

            if (err) {
                console.logError(err);
                res.sendStatus(500);
            }

            res.sendStatus(200);
        })
    })
});



module.exports = router;