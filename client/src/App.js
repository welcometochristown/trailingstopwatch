import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import { InputGroup, FormControl, Button, Row, Col } from 'react-bootstrap';
import { useState, useEffect } from 'react';

import { database } from './database';

function App() {

  const [rows, setRows] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async() => {
    var items = await database.load();

    for(var i in items)
    {
      items[i].value = await database.get(items[i].ticker);
      items[i].trlng_sl_limit = Number(items[i].value) - (Number(items[i].value) * (Number(items[i].trlng_sl_prc) / 100));
    }
    setRows(items);
  };

  const save = async() => {
    await database.save(rows);
  }

  const updateRowsAsync = async (func) => {
    var tmp = [...rows];
    await func(tmp);
    setRows(tmp);
  }

  const updateRows = (func) => {
    var tmp = [...rows];
    func(tmp);
    setRows(tmp);
  }

  const handleOnClickGo = async (e, i) => {
    updateRows(r => r[i].value = 'loading');
    updateRowsAsync(async(r) => {
        try
        {
          r[i].value = await database.get(r[i].ticker);
          refreshTrailingLimit(i);
        }catch {
          r[i].value = 'error';
        }
    });
  }

  const handleKeyPress = (e, i) => {
    if(e.key == "Enter"){
      handleOnClickGo(e, i);
    } 
  }

  const handleOnClickRemove = async (e, i) => {
    updateRows(r => r.splice(i, 1));
  }

  const handleTickerChange = (e, i) => {
    updateRows(r => r[i].ticker = e.target.value);
  } 

  const handleTrailingStopLossPercentageChange = (e, i) => {
    updateRows(r => {
      r[i].trlng_sl_prc = e.target.value;
      refreshTrailingLimit(i);
    });
  }

  const refreshTrailingLimit = (i) => {
    updateRows(r => {
        r[i].trlng_sl_limit = Number(r[i].value) - (Number(r[i].value) * (Number(r[i].trlng_sl_prc) / 100));
    });
    save();
  }

  const addRow = () => {
    updateRows(r => {
          r.push({ticker:null, value:null, trlng_sl_prc:0, trlng_sl_limit:null});
    });
  }

  const content = rows.length==0 ? 'Loading...' : rows.map((r, i) => (
      <Row key={i}>
      <Col>
        <InputGroup className="mb-3">
          <FormControl
            placeholder="ticker"
            aria-label={"ticker_" + i}
            aria-describedby="basic-addon1"
            onChange={(event) => handleTickerChange(event, i)}
            onKeyPress={(event) => handleKeyPress(event, i)}
            value={r.ticker || ''}
          />
        </InputGroup>
      </Col>
      <Col>
        <InputGroup className="mb-3">
          <FormControl
            placeholder=""
            aria-label={"value_" + i}
            aria-describedby="basic-addon1"
            readOnly={true}
            value={r.value || ''}
            type="number"
          />
        </InputGroup>
      </Col>
      <Col>
     
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text id="basic-addon1">%</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            placeholder=""
            aria-label={"trlng_sl_prc" + i}
            aria-describedby="basic-addon1"
            onChange={(event) => handleTrailingStopLossPercentageChange(event, i)}
            readOnly={!r.value}
            value={r.trlng_sl_prc || ''}
            type="number"
          />
        </InputGroup>
      </Col>

      <Col>
        <InputGroup className="mb-3">
          <FormControl
            placeholder=""
            aria-label={"value_" + i}
            aria-describedby="basic-addon1"
            readOnly={true}
            value={r.trlng_sl_limit || ''}
            type="number"
          />
        </InputGroup>
      </Col>

      <Col>
        <Button onClick={(event) => handleOnClickGo(event, i)}>Go</Button>
        <Button variant="danger" onClick={(event) => handleOnClickRemove(event, i)}>Remove</Button>
      </Col>
    </Row>
  ));

  return (
    <div className="App">
      {content}
      <Button variant="secondary" onClick={addRow}>+</Button>
    </div>

  );
}

export default App;
