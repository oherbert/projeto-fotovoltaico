import express from 'express';
import http from 'http';
import WebSocket from 'ws';

const app = express();
const port = 3333;

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

let sensorValue = 0;

let outputOn: boolean | undefined;

wss.on('connection', (ws: WebSocket) => {
 
    //connection is up, let's add a simple simple event
    ws.on('message', (message: string) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);

        if(message && message.includes('frontend')){

            const msg = `${message}`.split(': ')[1];

            if(msg === 'false') outputOn = true;
            else if(msg === 'true') outputOn = false;

            ws.send(`sensor: ${sensorValue},${outputOn}`);
        }
        else if(message && message.includes('sensor')){
            const msg = `${message}`.split(': ')[1];
            
            sensorValue = +msg.split(',')[0];

            if(outputOn === undefined){
                outputOn = msg.split(',')[1] === 'true';
            }
            
            ws.send(`${outputOn}`);
        }
        else
        ws.send(`Hello, you sent -> ${message}`);
    });

    //send immediatly a feedback to the incoming connection    
    ws.send('Hi there, I am a WebSocket server');
});

//start our server
server.listen(process.env.PORT || port, () => {
    console.log(`Server started on port ${port} :)`);
});