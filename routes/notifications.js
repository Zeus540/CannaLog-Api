const express = require('express')
const router = express.Router();
const authenticateToken = require('../middleware/authenticate')
const NotificationController = require('../controllers/NotificationController/NotificationController')

router.get('/notifications',authenticateToken, NotificationController.get)
router.patch('/notifications/read_all',authenticateToken, NotificationController.readAll)
router.post('/notifications/:notification_id',authenticateToken, NotificationController.read)
module.exports = router;