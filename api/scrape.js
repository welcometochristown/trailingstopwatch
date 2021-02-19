const puppeteer = require('puppeteer');
const logger = require('./logger');

async function getTickerPrice(ticker) {
    var prices = await getTickerPrices([ticker]);

    if (!prices || prices.length == 0)
        return null;

    return prices[0];
}

//slower but real time
async function scrapeTMXMoneyPrice(page, ticker, isCrypto, exchange, timeout=15000) {

    if(isCrypto)
        return null;

    const url = 'https://money.tmx.com/en/quote/' + ticker;

    logger.logInfo(url);
    const promise = page.goto(url, {timeout:timeout});

    logger.log('waiting for response');
    const resp = await page.waitForResponse((response) =>   response.request().url() == 'https://app-money.tmx.com/graphql' && 
                                                            response.request().method() == 'POST' &&
                                                            JSON.parse(response.request()._postData).operationName == "getQuoteBySymbol");

    logger.log('navigating to page');
    await promise;

    logger.log('getting content');
    const txt = await resp.text();
    
    logger.log(txt);
    const obj = JSON.parse(txt);
    const price = obj.data.getQuoteBySymbol.price;

    return price;
}

//fast but delayed
async function scrapeGooglePrice(page, ticker, isCrypto, exchange, timeout=5000) {
    const url = 'https://www.google.com/finance/quote/' + ticker + (isCrypto ? '-' : ':') + exchange;
    logger.log(url);

    await page.goto(url, {waitUntil: 'load'});
    await page.waitForSelector('.YMlKec.fxKbKc', { timeout : timeout });

    var element = await page.$('.YMlKec.fxKbKc');
    var price = (await page.evaluate(el => el.innerText, element));
    
    return price.replace(/[^0-9.]/g, '');
}

async function getTickerPrices(tickers) {
    logger.log("starting scrape");
    logger.log(tickers);

    // Launch the browser
    const browser = await puppeteer.launch({
        executablePath: "/usr/bin/chromium-browser",
        args:[
            '--no-sandbox'
        ]
    });

    try
    {
        logger.log('opening new browser page');
        // Create an instance of the page
        const page = await browser.newPage();

        logger.log('setting request interception');
        await page.setRequestInterception(true);

        logger.log('adding response interceptor');
        page.on('response', async(response) => {
            logger.log('--> Reponse From ' + response.request().url() + ' (' + response.request().method() + ')');
        });

        logger.log('adding request interceptor');
        page.on('request', async(request) => {
            if(request.resourceType() == 'stylesheet' || request.resourceType() == 'font' || request.resourceType() == 'image'){
                request.abort();
            }
            else if(!request.url().includes('money.tmx.com') && !request.url().includes('app.tmx.com')){
                request.abort();
            }
            else if(request.url().includes('area.chart.def.json')) {
                request.abort();
            }
            else {
                //logger.log(request.url());
                request.continue();
            }
            
        });

        var prices = []

        logger.log('iterating over tickers');
        for (var i =0; i < tickers.length; i++) {

            if(tickers[i] === undefined)   
                continue;

            const ticker = tickers[i].ticker;
            const exchange = tickers[i].exchange;
            const isCrypto = tickers[i].isCrypto;

            var p = {
                ticker: ticker,
                exchange: exchange,
                price: null
            };

            try {
                p.price = await scrapeTMXMoneyPrice(page, ticker, isCrypto, exchange);
            } catch (err) {
                //ignore for now, probably a bad ticker
                logger.logError(err);
            }
                    
            prices.push(p);
        }
    }
    catch(err) {
        logger.logError(err);
    }
    finally {
        logger.log('closing browser');
        await browser.close();
    }

    logger.logInfo(prices);
    return prices;
}

module.exports.getTickerPrice = getTickerPrice;
module.exports.getTickerPrices = getTickerPrices;