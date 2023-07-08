const express = require('express')
const router = express.Router();
const base64ToImage = require('base64-to-image')
var Minio = require("minio");
const { createPool } = require('mysql')
const fs = require('fs')
const authenticateToken = require('../middleware/authenticate')
const addAction = require('../middleware/addAction')

const { format, formatDistance, formatRelative, subDays } = require('date-fns')
require('dotenv').config()

const PlantController = require('../controllers/PlantController/PlantController')
const PlantActionController = require('../controllers/PlantActionController/PlantActionController')

const db = createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_SWEETLEAF,
  connectionLimit: 2000,
  timezone: 'SAST',
  charset: 'utf8mb4'
});

let channel = "SweetLeaf"


router.get('/', authenticateToken, PlantController.getMyPlants)
router.get('/public', PlantController.getPublic)
router.get('/stages', PlantController.getStages)
router.get('/strains', PlantController.getStrains)
router.delete('/delete/:plant_id',authenticateToken, PlantController.delete)
router.post('/add',authenticateToken,PlantController.add)

router.post('/actions', PlantActionController.get)
router.get('/actions_types', PlantActionController.getTypes)

router.post('/actions/:type', PlantActionController.getActionsByType)
router.post('/take_action/:type',authenticateToken, PlantActionController.takeAction)



module.exports = router;