const express = require('express')
const router = express.Router();

const IrrigationTypesController = require('../controllers/IrrigationTypesController/IrrigationTypesController')

router.get('/', IrrigationTypesController.get)

module.exports = router;