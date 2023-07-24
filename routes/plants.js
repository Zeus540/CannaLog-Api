const express = require('express')
const router = express.Router();
const authenticateToken = require('../middleware/authenticate')
const upload = require("../middleware/uploadImage")

require('dotenv').config()

const PlantController = require('../controllers/PlantController/PlantController')
const PlantActionController = require('../controllers/PlantActionController/PlantActionController')




router.get('/', authenticateToken, PlantController.getMyPlants)
router.get('/public', PlantController.getPublic)
router.get('/public_signed_in', authenticateToken, PlantController.getPublicSignedIn)

router.get('/stages', PlantController.getStages)
router.get('/strains', PlantController.getStrains)
router.delete('/delete/:plant_id',authenticateToken, PlantController.delete)
router.post('/add',authenticateToken,PlantController.add)
router.patch('/:plant_id/cover_image',authenticateToken,PlantController.update_cover_image)
router.post('/current_stage',PlantController.current_stage)
router.post('/current_environment',PlantController.current_environment)

router.post('/actions', PlantActionController.get)
router.get('/actions_types', PlantActionController.getActionTypes)

router.post('/actions/:type', PlantActionController.getActionDataByType)
router.post('/take_action/:type',authenticateToken,upload.single("file"), PlantActionController.takeAction)



module.exports = router;