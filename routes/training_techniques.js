const express = require('express')
const router = express.Router();

const TrainingTechniqueController = require('../controllers/TrainingTechniqueController/TrainingTechniqueController')

router.get('/', TrainingTechniqueController.get)

module.exports = router;