import express from 'express';
import logger from 'morgan';

import router from './routes';

const app = express();

app.use(logger('dev'));
app.use(express.json());

app.use('/', router);

module.exports = app;
