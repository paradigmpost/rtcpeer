import express from 'express';
import uuid from 'uuid';

import db from '../db';

const router = express.Router();

/* POST to get a uuid for peering. */
router.post('/', function(_, res, _) {
  const id = uuid.v4();
  db[id] = {};

  res.statusCode(201).json({ id }).end();
});

export default router;
