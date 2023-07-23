const express = require('express')
const router = express.Router();
const authenticateToken = require('../middleware/authenticate')
const upload = require("../middleware/uploadImage")

require('dotenv').config()

const PlantController = require('../controllers/PlantController/PlantController')
const PlantActionController = require('../controllers/PlantActionController/PlantActionController')




router.get('/', authenticateToken, PlantController.getMyPlants)
router.get('/public', PlantController.getPublic)
router.get('/stages', PlantController.getStages)
router.get('/strains', PlantController.getStrains)
router.delete('/delete/:plant_id',authenticateToken, PlantController.delete)
router.post('/add',authenticateToken,PlantController.add)
router.post('/current_stage',authenticateToken,PlantController.current_stage)

router.post('/actions', PlantActionController.get)
router.get('/actions_types', PlantActionController.getActionTypes)

router.post('/actions/:type', PlantActionController.getActionDataByType)
router.post('/take_action/:type',authenticateToken,upload.single("file"), PlantActionController.takeAction)



module.exports = router;