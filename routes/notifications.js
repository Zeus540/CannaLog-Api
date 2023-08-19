const express = require('express')
const router = express.Router();
const authenticateToken = require('../middleware/authenticate')
const NotificationController = require('../controllers/NotificationController/NotificationController')

router.get('/notifications',authenticateToken, NotificationController.get)

module.exports = router;