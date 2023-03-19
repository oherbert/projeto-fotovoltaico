import './App.css';
import { useState, useEffect, useCallback } from 'react';
import Container from 'react-bootstrap/Container';
import useWebSocket from 'react-use-websocket';

function App() {
  const [ionizadorState, setIonizadorState] = useState(false);
  const [sensorValue, setSensorValue] = useState('');
  let timer: any;

  const { lastMessage, sendMessage } = useWebSocket('ws://192.168.0.6:3333', {
    onOpen: () => console.log(`Connected to App WS`),
    onMessage: () => {
      if (lastMessage) {
        console.log(lastMessage);

        if(lastMessage.data && lastMessage.data.includes('sensor')){
          const msg = `${lastMessage.data}`.split(': ')[1];
          setSensorValue(msg.split(',')[0]);
          setIonizadorState(msg.split(',')[1] === 'true');
      }
      }
    },
    // queryParams: { 'token': '123456' },
    onError: (event) => { console.error(event); },
    shouldReconnect: (closeEvent) => true,
    reconnectInterval: 3000
  });


  const senderMessage = () => {
    timer = !timer && setInterval(() => {
      console.log('sender');
      
      sendMessage(`frontend: ${ionizadorState}`)
    }, 3000)
  }

  useEffect(() => {
    senderMessage();
    return () => clearInterval(timer)
  }, [])

  return (
    <Container className="p-3">
      <Container className="p-5 mb-4 bg-light rounded-3" style={{ alignContent: 'center', alignItems: 'center' }}>
        <h1 className="header">Purificador e Phmetro de água</h1>

        <p>Leitura Phmetro: <strong>{sensorValue && sensorValue}</strong></p>
        <Container>
          <span>Estado do Ionizador: </span>
          <button className={ionizadorState ? "btn btn-primary" : "btn btn-danger"} type="button" onClick={() => setIonizadorState(!ionizadorState)}>
            {ionizadorState && <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden={true}></span>}
            {ionizadorState ? ' Puricando...' : ' Inativo'}
          </button>
        </Container>
      </Container>
    </Container>
  );
}

export default App;
