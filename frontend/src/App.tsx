import './App.css';
import { useEffect, useRef, useState } from 'react';
import Container from 'react-bootstrap/Container';
import useWebSocket from 'react-use-websocket';
import { ISensors } from './types/ISensors';


const inicialSensors: ISensors = {
  ionizador: { ph: 0, output: undefined, autoStart: { on: false, minValue: 0, maxValue: 0 } },
  placaSolar: { tensaoEntrada: 0, tensaoRebaixada: 0 },
  client: "frontend",
}

function App() {
  const [sensorState, setSensorState] = useState<ISensors>(inicialSensors);
  const componentFocus = useRef<null | 'min' | 'max'>(null);
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');

  const { lastMessage, sendMessage } = useWebSocket('ws://192.168.0.5:3332', {
    onOpen: () => { console.log(`Connected to App WS`); sendMessage(`get`) },
    onMessage: (msg) => {
      if (msg) {
        console.log(msg);

        if (msg.data && msg.data.includes('ionizador')) {
          const serverState: ISensors = JSON.parse(`${msg.data}`);
          serverState.client = sensorState.client;
          setSensorState({ ...serverState });
        }
      }
    },
    // queryParams: { 'token': '123456' },
    onError: (event) => { console.error(event); },
    shouldReconnect: (closeEvent) => true,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    if (componentFocus.current !== 'min') {
      setMinVal(`${sensorState.ionizador.autoStart.minValue}`);
    }
    if (componentFocus.current !== 'max') {
      setMaxVal(`${sensorState.ionizador.autoStart.maxValue}`);
    }
    if (!componentFocus.current) {
      setMinVal(`${sensorState.ionizador.autoStart.minValue}`);
      setMaxVal(`${sensorState.ionizador.autoStart.maxValue}`);
    }

  }, [sensorState]);

  return (
    <Container className="p-3">
      <Container className="p-5 mb-4 bg-light rounded-3" style={{ alignContent: 'center', alignItems: 'center' }}>
        <h1 className="header">Purificador e Phmetro de água</h1>

        <Container className='info-conteiner'>
          <p className='p-info'>Leitura Phmetro: <strong>{sensorState.ionizador.ph.toFixed(2)}</strong></p>
          <p className='p-info'>Tensão de entrada Placa Solar: <strong>{sensorState.placaSolar.tensaoEntrada.toFixed(2)}</strong></p>
          <p className='p-info'>Tensão de regulada Placa Solar: <strong>{sensorState.placaSolar.tensaoRebaixada.toFixed(2)}</strong></p>
        </Container>

        <Container>
          <span>Estado do Ionizador: </span>
          <button className={sensorState.ionizador.output ? "btn btn-primary" : "btn btn-danger"} type="button" onClick={() => {
            const newState = sensorState;
            newState.ionizador.output = !newState.ionizador.output;
            sendMessage(`update: ${JSON.stringify(newState)}`)
            setSensorState({ ...newState });
          }}
            disabled={sensorState.ionizador.autoStart.on}
          >
            {sensorState.ionizador.output && <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden={true}></span>}
            {sensorState.ionizador.output ? ' Puricando...' : ' Inativo'}
          </button>
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault" checked={sensorState.ionizador.autoStart.on} onChange={() => {
              const newState = sensorState;
              newState.ionizador.autoStart.on = !newState.ionizador.autoStart.on;

              sendMessage(`update: ${JSON.stringify(newState)}`)
              setSensorState({ ...newState });
            }} />
            <label className="form-check-label">Auto Start</label>
          </div>
          <h4>
            Faixa de funcionamento automático
          </h4>
          <div className="input-group mb-3">
            <span className="input-group-text" id="basic-addon1">Mín.</span>
            <input type="number" min={0} step={0.1}
              className="form-control input-control"
              placeholder="Valor mínimo" aria-label="Minimo" aria-describedby="basic-addon1"
              value={minVal}
              onChange={(e) => {
                setMinVal(e.target.value);
              }}
              onFocus={() => {
                componentFocus.current = 'min'
              }}
              onBlur={(() => {
                const newState = sensorState;
                newState.ionizador.autoStart.minValue = + minVal;
                setSensorState({ ...newState });
                sendMessage(`update: ${JSON.stringify(newState)}`);
                componentFocus.current = null;
              })}
            />
            <span className='input-odd' />
            <span className="input-group-text" id="basic-addon1">Máx.</span>
            <input type="number"
              min={0}
              step={0.1}
              className="form-control input-control" placeholder="Valor máximo"
              aria-label="Maximo"
              aria-describedby="basic-addon1"
              value={maxVal}
              onChange={(e) => {
                setMaxVal(e.target.value);
              }}
              onFocus={() => {
                componentFocus.current = 'max'
              }}
              onBlur={(() => {
                const newState = sensorState;
                newState.ionizador.autoStart.maxValue = +maxVal;
                setSensorState({ ...newState });
                sendMessage(`update: ${JSON.stringify(newState)}`);
                componentFocus.current = null;
              })}
            />
          </div>
        </Container>
        {/* <p>{JSON.stringify(lastMessage?.data)}</p> */}
      </Container>
    </Container >
  );
}

export default App;
