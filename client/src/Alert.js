import Modal from 'react-bootstrap/Modal'
import ReactDOM from 'react-dom';
import { Button, FormControl, InputGroup } from 'react-bootstrap'
import { useState, useEffect } from 'react';

function Alert(props) {

    const [alertPrice, setAlertPrice] = useState(props.price);

    useEffect(() => { 
        setAlertPrice(props.price);
    }, [props]);

    const handleCancel = () => {
        if(props.onCancel) {
            props.onCancel();
        }
    }
    const handleSave = () => {
        if(props.onSave) {
            props.onSave(alertPrice);
        }
    }
    const handleRemove = () => {
        if(props.onRemove) {
            props.onRemove();
        }
    }

    const handleAlertPriceChanged = (event) => {
        setAlertPrice(event.target.value);
    }

    const handleKeyPress = (event) => {
        if(event.key == "Enter") {
            handleSave();
        }
    }

    return (
        <Modal show={props.visible} onHide={handleCancel} animation={true}>
            <Modal.Header closeButton>
            <Modal.Title>Alert Price</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <InputGroup>
                <InputGroup.Prepend>
                    <InputGroup.Text id="basic-addon1">$</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                    placeholder=""
                    aria-label={"alertprice"}
                    aria-describedby="basic-addon1"
                    value={alertPrice || ''}
                    onChange={(event) => handleAlertPriceChanged(event)}
                    onKeyPress={(event) => handleKeyPress(event)}
                    type="number"
                />
            </InputGroup>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="primary" onClick={handleSave}>
                Save
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
                Cancel
            </Button>
            <Button variant="danger" onClick={handleRemove}>
                Remove
            </Button>
            </Modal.Footer>
        </Modal>
    )

}

export default Alert;
