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
router.post('/current_stage',authenticateToken, PlantController.current_stage);
router.post('/current_stage/public', PlantController.current_stage_public);
router.post('/current_environment',authenticateToken, PlantController.current_environment);
router.post('/current_environment/public', PlantController.current_environment_public);
router.post('/viewed/:plant_id', authenticateToken, PlantController.plant_viewed);
router.patch('/:plant_id/cover_image', authenticateToken, PlantController.update_cover_image);
router.delete('/delete/:plant_id', authenticateToken, PlantController.delete);

// Plant Actions
router.get('/actions_types', PlantActionController.getActionTypes);
router.post('/actions',authenticateToken,  PlantActionController.get_actions);
router.post('/actions/public', PlantActionController.get_actions_public);
router.post('/actions/:type/:plant_id?', PlantActionController.getActionDataByType);
router.post('/take_action/:type', authenticateToken, upload.single("file"), PlantActionController.takeAction);
router.patch('/:plant_id/edit_action/:type', authenticateToken, PlantActionController.editAction);
router.delete('/:plant_id/delete_action/:plant_action_id', authenticateToken, PlantActionController.deleteAction);

// Plant Information
router.get('/public', PlantController.getPublic);
router.get('/public_signed_in', authenticateToken, PlantController.getPublicSignedIn);
router.post('/:plant_id', authenticateToken, PlantController.get_detailed_plant_info);
router.post('/public/:plant_id', PlantController.get_detailed_plant_info_public);

router.get('/my_plants', authenticateToken, PlantController.getMyPlants); 


module.exports = router;