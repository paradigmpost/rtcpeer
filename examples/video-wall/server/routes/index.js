import express from 'express';

const router = express.Router();

/* GET home page. */
router.get('/', function(_, res, _) {
  res.render('index', { title: 'Express' });
});

export default router;
