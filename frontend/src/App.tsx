import './App.css';
import { useState, useEffect, useCallback } from 'react';
import Container from 'react-bootstrap/Container';
import useWebSocket from 'react-use-websocket';
import { ISensors } from './types/ISensors';


const inicialSensors: ISensors = {
  ionizador: { ph: 0, output: undefined, autoStart: { on: false, minValue: 0, maxValue: 0 } }
}

function App() {
  const [sensorState, setSensorState] = useState<ISensors>(inicialSensors);
  let timer: NodeJS.Timer | undefined;

  const { lastMessage, sendMessage } = useWebSocket('ws://192.168.0.5:3332', {
    onOpen: () => { console.log(`Connected to App WS`); sendMessage(`get`) },
    onMessage: () => {
      if (lastMessage) {
        console.log(lastMessage);

        if (lastMessage.data && lastMessage.data.includes('server')) {
          const serverState: ISensors = JSON.parse(`${lastMessage.data}`.split('server: ')[1]);
          setSensorState({ ...serverState });
        }
      }
    },
    // queryParams: { 'token': '123456' },
    onError: (event) => { console.error(event); },
    shouldReconnect: (closeEvent) => true,
    reconnectInterval: 3000
  });

  useEffect(() => {
    if (timer !== undefined) return;
    timer = setInterval(() => sendMessage(`get`), 3000)
    return () => clearInterval(timer)
  }, []);


  return (
    <Container className="p-3">
      <Container className="p-5 mb-4 bg-light rounded-3" style={{ alignContent: 'center', alignItems: 'center' }}>
        <h1 className="header">Purificador e Phmetro de água</h1>

        <p>Leitura Phmetro: <strong>{sensorState.ionizador.ph}</strong></p>
        <Container>
          <span>Estado do Ionizador: </span>
          <button className={sensorState.ionizador.output ? "btn btn-primary" : "btn btn-danger"} type="button" onClick={() => {
            const newState = sensorState;
            newState.ionizador.output = !newState.ionizador.output;
            sendMessage(`update: ${JSON.stringify(newState)}`)
            setSensorState(newState);
          }}>
            {sensorState.ionizador.output && <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden={true}></span>}
            {sensorState.ionizador.output ? ' Puricando...' : ' Inativo'}
          </button>
        </Container>
      </Container>
    </Container >
  );
}

export default App;
