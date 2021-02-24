const logger = require('./logger');
const fetch = require('node-fetch');

async function getTickerPrice(ticker) {
    var prices = await getTickerPrices([ticker]);

    if (!prices || prices.length == 0)
        return null;

    return prices[0];
}

async function scrapeTMXMoneyPrice(ticker) {
    const url =  'https://app-money.tmx.com/graphql';
    const body = {
        operationName: "getQuoteBySymbol",
        variables: {
            symbol: ticker,
            locale: "en"
        },
        query: "query getQuoteBySymbol($symbol: String, $locale: String) {  getQuoteBySymbol(symbol: $symbol, locale: $locale) {symbol name price}}"
    }
    
    const reponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36'
        },
        body: JSON.stringify(body)
    })
    .then(resp => resp.json())
    .catch(err => logger.logError(err));

    logger.log(reponse);
    return Number(reponse.data.getQuoteBySymbol.price);
}

//this only works for a small set of tickers that bit buy supports
async function scrapeBitBuyProPrice(ticker, exchange) {
    const url =  'https://bitbuy.ca/api/public/market-list?_=1613971614995';
    const reponse= await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36'
        }
    })
    .then(resp => resp.json())
    .catch(err => logger.logError(err));

    logger.log(reponse);
    return Number(reponse[ticker+'-'+exchange].last);
}

async function getTickerPrices(tickers) {
    logger.log("starting scrapes");
    logger.log(tickers);
    
    try
    {
        var prices = []

        logger.log('iterating over tickers');
        for (var i =0; i < tickers.length; i++) {

            if(tickers[i] === undefined)   
                continue;

            logger.logInfo('scraping for ' + tickers[i].ticker);

            const ticker = tickers[i].ticker;
            const exchange = tickers[i].exchange;
            const isCrypto = tickers[i].isCrypto;

            var p = {
                ticker: ticker,
                exchange: exchange,
                price: null
            };

            try {
                if(isCrypto) {
                    p.price = await scrapeBitBuyProPrice(ticker, exchange);
                } 
                else {
                    p.price = await scrapeTMXMoneyPrice(ticker, exchange);
                }
            } 
            catch (err) {
                //ignore for now, probably a bad ticker
                logger.logError(err);
            }
                    
            prices.push(p);
        }
    }
    catch(err) {
        logger.logError(err);
    }

    logger.logInfo(prices);
    return prices;
}

module.exports.getTickerPrice = getTickerPrice;
module.exports.getTickerPrices = getTickerPrices;