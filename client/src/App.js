import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import { FormControl, Button,  Table, Jumbotron } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { database } from './database';
import Select from 'react-select';

function App() {

    const [editingCopy, setEditingCopy] = useState(null);
    const [rows, setRows] = useState({
      needsSaving : false,
      needsReloading : false,
      items : []  
    });
    
    useEffect(() => {
        load();
    }, []);

    useEffect(async () => {

       if(rows.needsSaving) {
           await save();
       }

       if(rows.needsReloading) {
            await load();
        }

    }, [rows.needsSaving]);

    const blankTicker = () => ({ ticker: null, exchange: null, isCrypto:false, price: null, startingprice:null, highestprice: null, timestamp:null, sl_price: null, trlng_sl_offset: null, track:false, initialising:true });

    const load = async () => {
        assignRowsAsync(async(r) =>
        {
            var items = await database.load();

            for (var i in items) {
                var item = items[i];

                var m = await database.getPrice({ticker : item.ticker, exchange:item.exchange, isCrypto:item.isCrypto});

                item.price = m.price;
                item.startingprice = m.startingprice;
                item.highestprice = m.highestprice;
                item.timestamp = m.timestamp;
            }

            return items;
        });
    };

    const save = async () => {
        await updateRowsAsync(async (r) => {
            for(var n in r){
                let x= r[n];

                if(!x._id)
                    x._id = (await database.insert(x))._id;
                else
                    await database.update(x);
             }     
        })   

    }

    const remove = async (id) => {
        await database.delete(id);
    }

    const assignRows = (func, needsSaving=false, needsReloading=false) => {
        var tmp = {...rows};
        tmp.items = func();
        tmp.needsSaving=needsSaving;
        tmp.needsReloading=needsReloading;
        setRows(tmp);
    }

    const assignRowsAsync = async (func, needsSaving=false, needsReloading=false) => {
        var tmp = {...rows};
        tmp.items = await func();
        tmp.needsSaving=needsSaving;
        tmp.needsReloading=needsReloading;
        setRows(tmp);
    }

    const updateRowsAsync = async (func, needsSaving=false, needsReloading=false) => {
        var tmp = {...rows};
        await func(tmp.items);
        tmp.needsSaving=needsSaving;
        tmp.needsReloading=needsReloading;
        setRows(tmp);
    }

    const updateRows = (func, needsSaving=false, needsReloading=false) => {
        var tmp = {...rows};
        func(tmp.items);
        tmp.needsSaving=needsSaving;
        tmp.needsReloading=needsReloading;
        setRows(tmp);
    }

    const updateEditingCopyObject = (func) => {
        var tmp = {...editingCopy};
        func(tmp.object);
        setEditingCopy(tmp);
    }

    const addRow = () => {
        updateRows(r => {
            r.push(blankTicker());
            setEditingCopy({
                index:r.length-1,
                object:r[r.length-1]
            });
        });
    }

    //Editable Handlers (editingCopy)

    const handleExchangeChange = (e, i) => {
        updateEditingCopyObject(o => o.exchange = e.value);
    }

    const handleOnChangeIsCrypto = (e, i) => {
        updateEditingCopyObject(o => o.isCrypto = !o.isCrypto);
    }

    const handleTickerChange = (e, i) => {
        updateEditingCopyObject(o => o.ticker = e.target.value.toUpperCase());
    }

    const handleTrailingStopLossOffsetChange = (e, i) => {
        updateEditingCopyObject(o => o.trlng_sl_offset = e.target.value);
    }
    
    const handleStopLossPriceChange = (e, i) => {
        updateEditingCopyObject(o => o.sl_price = e.target.value);
    }

    //Button Handlers
    const handleOnChangeTrack = (e, i) => {
        updateRows(r => {
            r[i].track = !r[i].track;
        }, true, true);
    }

    const handleOnClickRemove = async (e, i) => {
        if(rows.items[i]._id !== undefined) {
            await remove(rows.items[i]._id);
        }
        updateRows(r => {
            r.splice(i, 1);
        });
    }

    const handleOnClickEdit = async (e, i) => {
        setEditingCopy({
            index:i,
            object:{...rows.items[i]}
        });
    }

    const handleOnClickSave = (e) => {
        updateRows(r => {
            editingCopy.object.initialising=false;
            r[editingCopy.index] = {...editingCopy.object};
            setEditingCopy(null);
        }, true)
    }

    const handleOnClickCancel = (e, i) => {
        if(editingCopy.object.initialising)
            handleOnClickRemove(e, i);
        setEditingCopy(null);
        console.log(rows);
    }

    const handleOnClickRefresh = async (e, i) => {
        updateRowsAsync(async (r) => {
            var m = await database.getPrice({ticker : r[i].ticker, exchange:r[i].exchange, isCrypto:r[i].isCrypto});

            r[i].price = m.price;
            r[i].highestprice = m.highestprice;
        });
    }


    //utility
    const isNullOrUndefined = (n) => {
        return n === null || n === undefined;
    }

    const format = (n, prefix, postfix, isNumeric=false) => {
        if(isNullOrUndefined(n))
            return null;


        var returnStr = isNumeric ? n.toLocaleString() : n;

        if(prefix)
            returnStr = prefix + returnStr;

        if(postfix)
        returnStr = returnStr+ postfix;

        return returnStr;
    }

    const formatN = (n, prefix, postfix) => {
        return format(n, prefix, postfix, true);
    }

    const getGoogleLink = (r) => {
        return 'https://www.google.com/finance/quote/' + r.ticker + (r.isCrypto ? '-' : ':') + r.exchange;
    }

    const getTmxMoneyLink = (r) => {
        if(r.isCrypto)
            return null;

        return 'https://money.tmx.com/en/quote/' + r.ticker
    }

    const getYahooLink = (r) => {
        if(r.isCrypto)
            return null;

        return 'https://ca.finance.yahoo.com/quote/'+ r.ticker + '.' + (r.exchange == 'TSE' ? 'TO' : 'V');
    }

    const getTrailingStopLossPrice = (r) => {
        if(r.highestprice === null)
            return null;
        return calculateTrailingStopPrice(r);
    }

    const getPosition = (r) => {
        if(!r.track)
            return 'Untracked';
            
        return "Hold";
    }

    const calculateTrailingStopPrice = (r) => {
        return  Number(r.highestprice) - Number(r.trlng_sl_offset);
    }

    //deletion
    const deleteAllTickers = async () => {
        await database.deleteTickers();
        await load();
    }

    const deleteAllMarkets = async () => {
        await database.deleteMarkets();
        await load();
    }

    const deleteAll = async () => {
        await database.deleteAll();
        await load();
    }

    const diff_minutes = (dt2, dt1) => {

        var diff =(dt2.getTime() - dt1.getTime()) / 1000;
        diff /= 60;
        return Math.abs(Math.round(diff));
        
    }

    const ageMinutes = (r) => {
        if(!r.timestamp)
            return null;

       return  diff_minutes(new Date(r.timestamp), new Date());
    }

    const stock_exchanges = [{label:"TSE", value:"TSE"}, {label:"CVE", value:"CVE"}];
    const crypto_currencies = [{label:"CAD", value:"CAD"}, {label:"GBP", value:"GBP"}, {label:"USD", value:"USD"}];
    
    const content = rows.items.map((r, i) => 
    {
        var options = r.isCrypto ? crypto_currencies : stock_exchanges;
        if(editingCopy && editingCopy.index == i) {
            return (
                (<tr key={i}>
                    <td>
                        <FormControl
                            placeholder="ticker"
                            aria-label={"ticker_" + i}
                            aria-describedby="basic-addon1"
                            onChange={(event) => handleTickerChange(event, i)}
                            value={(editingCopy.object.ticker || '').toUpperCase()}
                        />
                    </td>  
                    <td>
                        <a href='#' onClick={(event) => handleOnChangeIsCrypto(event, i)}><i className={r.isCrypto ? "fa fa-check-square-o fa-lg" : "fa fa-square-o fa-lg"} aria-hidden="true"></i></a>
                    </td>    
                    <td>
                        <Select 
                            aria-label={"exchange_" + i}
                            options={options}
                            value={options.filter(n => n.value == editingCopy.object.exchange)}
                            isSearchable={false}
                            onChange={(event) => handleExchangeChange(event, i)}
                        />
                    </td>   
                   

                    <td className="td-readonly">                      
                        <FormControl
                            placeholder=""
                            aria-label={"price_" + i}
                            aria-describedby="basic-addon1"
                            readOnly={true}
                            value={editingCopy.object.price || ''}
                            type="number"
                        />
                    </td>

                    <td className="td-readonly">                      
                        <FormControl
                            placeholder=""
                            aria-label={"startingprice_" + i}
                            aria-describedby="basic-addon1"
                            readOnly={true}
                            value={editingCopy.object.startingprice || ''}
                            type="number"
                        />
                    </td>

                    <td className="td-readonly">                      
                        <FormControl
                            placeholder=""
                            aria-label={"highestprice_" + i}
                            aria-describedby="basic-addon1"
                            readOnly={true}
                            value={editingCopy.object.highestprice || ''}
                            type="number"
                        />
                    </td>
                    <td>{ageMinutes(r)}</td>
                    <td>
                        <FormControl
                            placeholder=""
                            aria-label={"trlng_sl_prc" + i}
                            aria-describedby="basic-addon1"
                            onChange={(event) => handleTrailingStopLossOffsetChange(event, i)}
                            readOnly={!editingCopy.object.price}
                            value={editingCopy.object.trlng_sl_offset || ''}
                            type="number"
                        />
                    </td>

                    <td className="td-readonly">                      
                        <FormControl
                            placeholder=""
                            aria-label={"trlng_sl_price_" + i}
                            aria-describedby="basic-addon1"
                            readOnly={true}
                            value={editingCopy.object.trlng_sl_price || ''}
                            type="number"
                        />
                    </td>
                    <td>
                        <FormControl
                            placeholder=""
                            aria-label={"trlng_sl_prc" + i}
                            aria-describedby="basic-addon1"
                            onChange={(event) => handleStopLossPriceChange(event, i)}
                            readOnly={!editingCopy.object.price}
                            value={editingCopy.object.sl_price || ''}
                            type="number"
                        />
                    </td>
                    <td className="td-readonly"><i>{getPosition(editingCopy.object) || ''}</i></td>
                    <td>
                       <i className={editingCopy.object.track ? "fa fa-check-square-o fa-lg" : "fa fa-square-o fa-lg"} aria-hidden="true"></i>
                    </td>
                    <td>
                        <span>
                            {
                                (editingCopy.object.ticker && editingCopy.object.exchange) ? 
                                (
                                    <a href='#' onClick={(event) => handleOnClickSave(event, i) }>
                                        <i className="fa fa-check fa-lg" aria-hidden="true"/>
                                    </a>
                                ) :
                                (
                                    <i className="fa fa-check fa-lg" aria-hidden="true"/>
                                ) 
                            }
                            
                        </span>
                        
                        <span>
                            <a href='#' onClick={(event) => handleOnClickCancel(event, i)}><i className="fa fa-times fa-lg" aria-hidden="true"></i></a>
                        </span>

                    </td>
                </tr>)
            )
        }
        else {
            return (
                (<tr key={i} className={r.track?'tr-tracked':''}>
                    <td><span className="table-content-text"><b>{format(r.ticker).toUpperCase()}</b></span></td>     
                    <td><span className="table-content-text"><i className={r.isCrypto ? "fa fa-check-square-o fa-lg" : "fa fa-square-o fa-lg"} aria-hidden="true"></i> </span></td>     
                    <td><span className="table-content-text">{format(r.exchange).toUpperCase()}</span></td>     
                    <td className="td-readonly"><span className="table-content-text"><b>{formatN(r.price, '$') || ''}</b></span></td>
                    <td className="td-readonly"><span className="table-content-text">{formatN(r.startingprice, '$') || ''}</span></td>
                    <td className="td-readonly"><span className="table-content-text">{formatN(r.highestprice, '$') || ''}</span></td>
                    <td><span className="table-content-text">{ageMinutes(r)}</span></td>
                    <td><span className="table-content-text">{format(r.trlng_sl_offset, '$') || ''}</span></td>
                    <td className="td-readonly"><span className="table-content-text">{formatN(getTrailingStopLossPrice(r), '$') || ''}</span></td>
                    <td><span className="table-content-text">{formatN(r.sl_price, '$') || ''}</span></td>
                    <td className="td-readonly"><span className="table-content-text"><i>{getPosition(r) || ''}</i></span></td>
                    <td>
                        <a href='#' onClick={(event) => handleOnChangeTrack(event, i)}><i className={r.track ? "fa fa-check-square-o fa-lg" : "fa fa-square-o fa-lg"} aria-hidden="true"></i></a>
                    </td>
                    <td className="td-icons">
                        <span>
                            <a href='#' onClick={(event) => handleOnClickEdit(event, i)}><i className="fa fa-pencil fa-lg" aria-hidden="true"></i></a>
                        </span>
                        
                        <span>
                            <a href='#' onClick={(event) => handleOnClickRefresh(event, i)}><i className="fa fa-refresh fa-lg" aria-hidden="true"></i></a>
                        </span>

                        <span>
                            <a href='#' onClick={(event) => handleOnClickRemove(event, i)}><i className="fa fa-trash-o fa-lg" aria-hidden="true"></i></a>
                        </span>

                        <span>
                            <a href={getGoogleLink(r)}><i className="fa fa-google fa-lg" aria-hidden="true"></i></a>
                        </span>

                        <span>
                            <a href={getTmxMoneyLink(r)}><i className="fa fa-usd fa-lg" aria-hidden="true"></i></a>
                        </span>

                        <span>
                            <a href={getYahooLink(r)}><i className="fa fa-yahoo fa-lg" aria-hidden="true"></i></a>
                        </span>


                    </td>
                </tr>)
            )
        }
    });

    return (
        <div className="App">
            <Jumbotron className="app-jumbo">
            <header>
                <h1 className="navbar-brand">Trailing StopWatch</h1>
                <h2><p>
                    Use this to track stop loss and trailing stop loss against a specific ticker. 
                    </p>
                    <p>
                    An alert will only be sent if either the price drops below the <i>stop loss</i> price or the price drops below the <i>trailing stop loss</i> price (above the starting price).
                    </p>
                </h2>
                <span><div className="graphimg"/></span>
            </header>
            </Jumbotron>

            <Table bordered hover>
                <thead>
                    <tr>
                    <th className="th-ticker">Ticker</th>
                    <th className="th-crypto">Crypto</th>
                    <th className='th-exchange'>Exchange</th>
                    <th>Price</th>
                    <th>Starting Price</th>
                    <th>Highest Price</th>
                    <th>Age (min)</th>
                    <th>Trailing Stop Loss Offset</th>
                    <th>Trailing Stop Loss Price</th>
                    <th>Stop Loss Price</th>
                    <th>Position</th>
                    <th className="th-crypto">Track</th>
                    <th className="th-icons"></th>
                    </tr>
                </thead>
                <tbody>
                    {content}
                </tbody>
            </Table>
            <div className="addbutton"><Button variant="primary" onClick={addRow}>Add</Button></div>
            <div className="deletebuttons">
                <div><Button variant="danger" onClick={deleteAllTickers}>Delete All Tickers</Button></div>
                <div><Button variant="danger" onClick={deleteAllMarkets}>Delete All Market Values</Button></div>
                <div><Button variant="danger" onClick={deleteAll}>Delete All</Button></div>
            </div>
            
        </div>

    );
}

export default App;
