const express = require('express')
const router = express.Router();
const authenticateToken = require('../middleware/authenticate')
const EnviromentController = require('../controllers/EnviromentController/EnviromentController')

let channel = "SweetLeaf"

router.get('/', authenticateToken, EnviromentController.get)
router.post('/add', authenticateToken, EnviromentController.add)
router.delete('/delete/:environment_id', authenticateToken, EnviromentController.delete)
router.patch('/edit/:environment_id', authenticateToken, EnviromentController.edit)
router.get('/types', EnviromentController.getTypes)


module.exports = router;