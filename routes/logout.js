const express = require('express')
const router = express.Router();
const { createPool } = require('mysql')

require('dotenv').config()

const db = createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_SWEETLEAF,
  connectionLimit: 2000,
});

///refreshToken
router.post('/', (req, res) => {
 /* ...
  // #swagger.ignore = true
  ...
  */
  res.clearCookie("session",{domain:".cannalog.co.za"})
  res.clearCookie("session_refresh",{domain:".cannalog.co.za"})
  res.clearCookie("user",{domain:".cannalog.co.za"})
  res.clearCookie("session")
  res.clearCookie("session_refresh")
  res.clearCookie("user")
  res.sendStatus(200)
}
)




module.exports = router;