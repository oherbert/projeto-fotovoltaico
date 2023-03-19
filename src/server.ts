import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { ISensors } from '../frontend/src/types/ISensors';
import { IntervalBasedCronScheduler, Cron, parseCronExpression } from 'cron-schedule';

const scheduler = new IntervalBasedCronScheduler(1000)

const app = express();
const port = 3332;

// update: {"ionizador":{"ph":2.9, "output":false, "autoStart":{"on":false,"minValue":0,"maxValue":0}},"placaSolar":{"tensaoEntrada":0,"tensaoRebaixada":0}, "client":"sensor"}

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

const sensors: ISensors = { ionizador: { ph: 0, output: false, autoStart: { on: false, minValue: 0, maxValue: 0 } }, placaSolar: { tensaoEntrada: 0, tensaoRebaixada: 0 }, client: "server" };

const checkAutoStart = () => {
    if (sensors.ionizador.autoStart.on) {
        if (sensors.ionizador.ph > sensors.ionizador.autoStart.minValue
            && sensors.ionizador.ph < sensors.ionizador.autoStart.maxValue) {
            sensors.ionizador.output = true;
        } else {
            sensors.ionizador.output = false;
        }
    }
}

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
                if (newValues.client === 'frontend') {
                    if (sensors.ionizador.autoStart.on && !newValues.ionizador.autoStart.on && sensors.ionizador.output) {
                        sensors.ionizador.output = false;
                        console.log('true');

                    } else {
                        console.log('false');
                        sensors.ionizador.output = newValues.ionizador.output;
                    }
                    sensors.ionizador.autoStart = newValues.ionizador.autoStart;
                } else if (newValues.client === 'sensor') {
                    sensors.ionizador.ph = newValues.ionizador.ph;
                    sensors.placaSolar = newValues.placaSolar;
                }
                checkAutoStart();

                scheduler.registerTask(
                    parseCronExpression("*/3 * * * * *"),
                    () => wss.clients.forEach(client => {
                        client.send(`${JSON.stringify(sensors)}`)
                    }
                    ),
                    {
                        isOneTimeTask: true,
                        errorHandler: (err) => console.log(err),
                    }
                );

                // ws.send(`${JSON.stringify(sensors)}`);
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