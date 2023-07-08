const express = require('express')
const router = express.Router();
const base64ToImage = require('base64-to-image')
var Minio = require("minio");
const { createPool } = require('mysql')
const fs = require('fs')
const authenticateToken = require('../middleware/authenticate')
const { format, formatDistance, formatRelative, subDays } = require('date-fns')
require('dotenv').config()

const IrrigationTypesController = require('../controllers/IrrigationTypesController/IrrigationTypesController')


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


router.get('/', IrrigationTypesController.get)


module.exports = router;