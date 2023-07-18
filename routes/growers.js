const express = require('express')
const router = express.Router();
const GrowerController = require('../controllers/GrowerController/GrowerController')
const authenticateToken = require('../middleware/authenticate')


router.get('/',authenticateToken,GrowerController.get)

module.exports = router;