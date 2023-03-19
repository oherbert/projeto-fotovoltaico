import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { ISensors } from '../frontend/src/types/ISensors';

const app = express();
const port = 3332;

// update: {"ionizador":{"ph":2, "output":false, "autoStart":{"on":false,"minValue":0,"maxValue":0}}}


//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

const sensors: ISensors = { ionizador: { ph: 0, output: false, autoStart: { on: false, minValue: 0, maxValue: 0 } } }

wss.on('connection', (ws: WebSocket) => {

    //connection is up, let's add a simple simple event
    ws.on('message', (message: string) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);

        try {
            if (message && message.includes('get')) {
                ws.send(`${JSON.stringify(sensors)}`);
            }
            else if (message && message.includes('update')) {
                const newValues: ISensors = JSON.parse(`${message}`.split(': ')[1]);
                sensors.ionizador = newValues.ionizador;
                ws.send(`${JSON.stringify(sensors)}`);
            }
            else
                ws.send(`Hello, you sent -> ${message}`);

        } catch (error) {
            console.log(error);
        }
    });

    //send immediatly a feedback to the incoming connection    
    ws.send('Connectado ao servidor');
    ws.send(`${JSON.stringify(sensors)}`);
});

//start our server
server.listen(process.env.PORT || port, () => {
    console.log(`Server started on port ${port} :)`);
});