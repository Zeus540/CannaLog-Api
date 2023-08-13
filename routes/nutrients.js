const express = require('express')
const router = express.Router();

const NutrientController = require('../controllers/NutrientController/NutrientController')

router.get('/', NutrientController.get)

module.exports = router;