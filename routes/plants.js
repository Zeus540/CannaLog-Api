const express = require('express')
const router = express.Router();
const authenticateToken = require('../middleware/authenticate')
const upload = require("../middleware/uploadImage")

require('dotenv').config()

const PlantController = require('../controllers/PlantController/PlantController')
const PlantActionController = require('../controllers/PlantActionController/PlantActionController')

//Extra Plant Information
router.get('/stages', PlantController.getStages);
router.get('/strains', PlantController.getStrains);
router.post('/add', authenticateToken, PlantController.add);
router.post('/current_stage', PlantController.current_stage);
router.post('/current_environment', PlantController.current_environment);
router.post('/viewed/:plant_id', authenticateToken, PlantController.plant_viewed);
router.patch('/:plant_id/cover_image', authenticateToken, PlantController.update_cover_image);
router.delete('/delete/:plant_id', authenticateToken, PlantController.delete);

// Plant Actions
router.get('/actions_types', PlantActionController.getActionTypes);
router.post('/actions', PlantActionController.get);
router.post('/actions/:type', PlantActionController.getActionDataByType);
router.post('/take_action/:type', authenticateToken, upload.single("file"), PlantActionController.takeAction);
router.delete('/:plant_id/delete_action/:plant_action_id', authenticateToken, PlantActionController.deleteAction);

// Plant Information
router.get('/public', PlantController.getPublic);
router.get('/public_signed_in', authenticateToken, PlantController.getPublicSignedIn);
router.post('/plant_id',  authenticateToken, PlantController.get_detailed_plant_info); // Specific route should be at the end
router.get('/', authenticateToken, PlantController.getMyPlants); // General route should be after the specific one


module.exports = router;