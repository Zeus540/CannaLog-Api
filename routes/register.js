const express = require('express')
const router = express.Router();
var Minio = require("minio");
const {createPool} = require('mysql')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const emailSend = require('@sendgrid/mail')

require('dotenv').config()

const db = createPool({
  host:process.env.DB_HOST,
  port:process.env.DB_PORT,
  user:process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  database:process.env.DB_NAME,
  connectionLimit:1000,
});

emailSend.setApiKey(process.env.SENDGRID_API)



  function generateAccessToken(Obj) {
    return jwt.sign(Obj, process.env.TOKEN_SECRET,{ expiresIn: "15m" } );
  }
  


router.post('/',(req,res) =>{
   /* ...
  // #swagger.tags = ['Auth']
  ...
  */
 
    //Getting values
    const UserName = req.body.userName;
    const Name = req.body.name;

    const Email = req.body.email;
    const Password = req.body.password;


    let tokenObj = {
      Email,
      Password
    }

    let Code = generateAccessToken(tokenObj)
    //Remove whitespacing 
    UserName.trim()
    let email = Email.trim().toLowerCase()

    //Getting userList 
    db.query(`select * from users WHERE user_email = ?`,[email],(err,result,fields)=>{
        UserList = result[0]
        console.log("UserList",UserList )

    //Checking email against userList 
    if(UserList !== undefined){
        res.json(
            {
              userRegisterSucces:false,
              userRegisterMsg:`Account already Exist`
          }
          )
 
     }else{

        //Hashing and salting 
        bcrypt.hash(Password, saltRounds, function(err, hash) {
        if(err){
            return console.log(err)
        }else{
       
        
            //Adding users to db
        
            db.query(`INSERT INTO users (user_acc_type,user_name,user_email,user_password,user_img,verification_code,verification_status) VALUES (2,'${Name}','${email}','${hash}','','${Code}',0 )` ,(err,result,fields)=>{
                if(err){
                  console.log(err)
                    res.json(
                        {
                          userRegisterSucces:false,
                          userRegisterMsg:`User Registration Failed`
                      }
                    )
                }else{

                  res.json(
                    {
                      userRegisterSucces:true,
                      userRegisterMsg:`/sign-up/${Name}/${Email}`,
                   
                  }
                  )
                    "Send Mail"

                    let msg = {
                      to: email,
                      from: 'admin@sweetleaf.co.za',
                      templateId: 'd-f18c03b74fba4f588f4f592c9c3c7f09',
                      dynamicTemplateData: {
                        subject: 'Account Verfication Email For Sweetleaf',
                        body: `asdasdasd`,
                        url: `https://cannalog.co.za/verify/${Code}`,
                        name: Name,
              
                      },
      
                    }
                    
                    emailSend.send(msg)
                 
                   
             
                  
                        
                }
            });
         
            }
        });
     }
    });
})



module.exports = router;