
import * as express from 'express';
import * as WebSocket from 'ws';
import { realtime } from './realtime';
import { analysis } from './analysis';

const HTTP_PORT = 3000;
const DATA_FILE_BASEPATH = "./";

const app = express();

app.use(express.static('wwwroot'));
app.use(express.json());

const server = app.listen(HTTP_PORT);
const wss = new WebSocket.Server({ server });


realtime(app,wss, DATA_FILE_BASEPATH);

analysis(app, DATA_FILE_BASEPATH);

