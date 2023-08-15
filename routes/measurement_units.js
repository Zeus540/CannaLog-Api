const express = require('express')
const router = express.Router();
const NutrientController = require('../controllers/NutrientController/NutrientController')
const authenticateToken = require('../middleware/authenticate')


router.get('/',authenticateToken,NutrientController.get_measurement_units)

module.exports = router;