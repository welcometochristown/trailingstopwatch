const axios = require('axios');
const cheerio = require('cheerio');

async function getTickerPrice(ticker) {

    const url = 'https://ca.advfn.com/stock-market/TSX/' + ticker + '/stock-price';

    return await axios(url)
    .then(async response => {

      const html = response.data;

      const $ = cheerio.load(html);
      const price = $('.PriceTextDown', $('.qs-current-price', $('.quote-summary-header')));

      return Number(price.text());
    });
}

module.exports.getTickerPrice = getTickerPrice;