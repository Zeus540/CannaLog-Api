const express = require('express')
const router = express.Router();
const { createPool } = require('mysql')
const bcrypt = require('bcrypt');
var Minio = require("minio");
const jwt = require('jsonwebtoken');
const dayjs = require("dayjs");

require('dotenv').config()

const db = createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_SWEETLEAF,
  connectionLimit: 2000,
});


function generateAccessToken(Obj) {
  return jwt.sign(Obj, process.env.TOKEN_SECRET, { expiresIn: "30s" });
}

function generateRefreshToken(Obj) {
  return jwt.sign(Obj, process.env.TOKEN_REFRESH_SECRET, { expiresIn: "7d" });
}

let refreshTokenArray = []

let UserObj = {}


//Admin Login
router.post('/', (req, res) => {
  /* ...
 // #swagger.tags = ['Auth']
 ...
 */


  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password;

  if (email == "" || password == "") {
    res.sendStatus(500)
  } else {

    //Get user
    db.query(`select * from users WHERE user_email = ?`, [email], (err, result, fields) => {
      try {
        let User = result[0]

        if (User == undefined) {
          console.log("User", undefined)
          res.status(500).send("Account doesnt exist")
        } else {
      
          bcrypt.compare(password, User.user_password, (err, result) => {
            if (err) {

            } else {
          
              if (result === true) {

                UserObj = {
                  user_id: User.user_id,
                  user_name: User.user_name,
                  user_email: User.user_email,
                }

                UserObjCleaned = {
                  user_id: User.user_id,
                  user_name: User.user_name,
                  acc_type: User.user_acc_type
                }
                 ""
             
                let token =  generateAccessToken(UserObj)
                let refreshtoken  = generateRefreshToken(UserObj)
                refreshTokenArray.push(refreshtoken)



                res.cookie("session", token, {
                  sameSite:'strict',
                  secure: true,
                  httpOnly: true ,
                  domain:".cannalog.co.za",
                  expires: dayjs().add(30, "seconds").toDate(),
                });

                res.cookie("session_refresh", refreshtoken, {
                  sameSite:'strict',
                  secure: true, 
                  httpOnly: true ,
                  domain:".cannalog.co.za",
                  expires: dayjs().add(7, "days").toDate(),
                });

                res.cookie("user", JSON.stringify(UserObjCleaned), {
                  sameSite:'strict',
                  secure: true,
                  httpOnly: false ,
                  domain:".cannalog.co.za",
                  expires: dayjs().add(7, "days").toDate(),
                });
                res.sendStatus(200)
              } else {
                res.sendStatus(401)
              }
            }
          })
        }

      } catch (error) {

        res.sendStatus(500)
      }

    })

  }

});


///refreshToken
router.post('/token', (req, res) => {
  /* ...
  // #swagger.ignore = true
  ...
  */
  const refreshToken = req.body.token;


  if (refreshToken == null) {
    res.sendStatus(401)
  }

  if (!refreshTokenArray.includes(refreshToken)) {
    res.send("Exp")
  } else {

    jwt.verify(refreshToken, process.env.TOKEN_REFRESH_SECRET, (err, user) => {
      if (err) {
        res.sendStatus(403)
      } else {


        const token = generateAccessToken({
          user_id: user.user_id,
          Email: user.Email,
          Password: user.Password,
        })

        res.json({ token })
      }


    })

  }


}
)




module.exports = router;