const express = require('express')
const router = express.Router();
var Minio = require("minio");
const {createPool} = require('mysql')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');


require('dotenv').config()

const db = createPool({
  host:process.env.DB_HOST,
  port:process.env.DB_PORT,
  user:process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  database:process.env.DB_SWEETLEAF,
  connectionLimit:1000,
});

router.post('/',(req,res) =>{
 /* ...
  // #swagger.tags = ['Auth']
  ...
  */
 
    //Getting values
    const Token = req.body.token;
    
    //Getting userList 
    db.query(`select * from users`,(err,result,fields)=>{
        UserList = JSON.parse(JSON.stringify(result))
        
    //Checking Verification_Code against userList 
    if(UserList.find(User => User.verification_code === Token)){

      let UserFound = UserList.find(User => User.verification_code === Token)
      let sqlUpdateThumbnail = `UPDATE users SET verification_status=? WHERE user_id=?`

      let data = [1, UserFound.user_id];

      db.query(sqlUpdateThumbnail,data,(err,result,fields)=>{
        res.json(
          {
            url:`/sign-in`
        }
        )
      })
        
 
     }else{
      res.json(
        {
          err:"Account doesn't exist"
      }
      )
       
     }
    });
})



module.exports = router;