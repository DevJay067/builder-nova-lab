const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { syncData, getRecent, getHistory } = require('../controllers/dataController');

router.post('/sync', authenticate, syncData);
router.get('/recent', authenticate, getRecent);
router.get('/history', authenticate, getHistory);

module.exports = router;