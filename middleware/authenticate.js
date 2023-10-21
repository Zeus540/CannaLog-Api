const jwt = require('jsonwebtoken');
const dayjs = require("dayjs");

let blacklisted = []

function generateAccessToken(Obj) {
  return jwt.sign(Obj, process.env.TOKEN_SECRET, { expiresIn: "30s" });
}

function generateRefreshToken(Obj) {
  return jwt.sign(Obj, process.env.TOKEN_REFRESH_SECRET, { expiresIn: "7d" });
}

function authenticateToken(req, res, next) {
  const token = req.cookies['session']
  const refresh_token = req.cookies['session_refresh']

  if (token == undefined && refresh_token == undefined) {
    res.sendStatus(401)
   
  } else {

    if (token == undefined) {

      if (refresh_token == undefined) {

        res.sendStatus(401)
          } else {

        let isRefreshTokenExp = jwt.decode(refresh_token, process.env.TOKEN_REFRESH_SECRET).exp * 1000 < Date.now()

        if (isRefreshTokenExp == false) {

          jwt.verify(refresh_token, process.env.TOKEN_REFRESH_SECRET, async (err, user) => {

            let userCleaned = {
              user_id: user.user_id,
              user_name: user.user_name,
              user_email: user.user_email,
            }

            let userCleanedToken = {
              user_name: user.user_name,
              user_email: user.user_email,
            }
           
           await res.clearCookie("session")
           await res.clearCookie("session_refresh")

           await res.cookie("session_refresh", generateRefreshToken(userCleaned), {
              sameSite:'strict',
              secure: true,
              httpOnly: true ,
              domain:".cannalog.co.za",
              expires: dayjs().add(7, "days").toDate(),
            });

            await res.cookie("session", generateAccessToken(userCleaned), {
              sameSite:'strict',
              secure: true,
              httpOnly: true ,
              domain:".cannalog.co.za",
              expires: dayjs().add(30, "seconds").toDate(),
            });

            await res.cookie("user", JSON.stringify(userCleanedToken), {
              sameSite:'strict',
              secure: true,
              httpOnly: false ,
              domain:".cannalog.co.za",
              expires: dayjs().add(7, "days").toDate(),
            });
            

            req.user = await userCleaned
            blacklisted.push(refresh_token)
            next()

          })

    
        } else {
          
          blacklisted.push(refresh_token)
          res.clearCookie("session")
          res.clearCookie("session_refresh")
          res.sendStatus(401)
        }
      }

    } else {

      let isTokenExp = jwt.decode(token, process.env.TOKEN_SECRET).exp * 1000 < Date.now()

      if (isTokenExp == false) {

        jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {

          try {

            let userCleaned = {
              user_id: user.user_id,
              user_name: user.user_name,
              user_email: user.user_email,
            }

            req.user = userCleaned
            next()
            // console.log("req.user",req.user)
          } catch (error) {
            console.log("error", error)
          }

        })

      }else{
        console.log("here")
       
          let isRefreshTokenExp = jwt.decode(refresh_token, process.env.TOKEN_REFRESH_SECRET).exp * 1000 < Date.now()
  
          if (isRefreshTokenExp == false) {
  
            jwt.verify(refresh_token, process.env.TOKEN_REFRESH_SECRET, async (err, user) => {
  
              let userCleaned = {
                user_id: user.user_id,
                user_name: user.user_name,
                user_email: user.user_email,
              }

              let userCleanedToken = {
                user_name: user.user_name,
                user_email: user.user_email,
              }
             
             await res.clearCookie("session")
             await res.clearCookie("session_refresh")
  
             await res.cookie("session_refresh", generateRefreshToken(userCleaned), {
                sameSite:'strict',
                secure: true,
                httpOnly: true ,
                domain:".cannalog.co.za",
                expires: dayjs().add(7, "days").toDate(),
              });
  
              await res.cookie("session", generateAccessToken(userCleaned), {
                sameSite:'strict',
                secure: true,
                httpOnly: true ,
                domain:".cannalog.co.za",
                expires: dayjs().add(30, "seconds").toDate(),
              });
  
              await res.cookie("user", JSON.stringify(userCleanedToken), {
                sameSite:'strict',
                secure: true,
                httpOnly: false ,
                domain:".cannalog.co.za",
                expires: dayjs().add(7, "days").toDate(),
              });
              
  
              req.user = await userCleaned
              blacklisted.push(refresh_token)
              next()
  
            })
  
      
          } else {
            
            blacklisted.push(refresh_token)
            res.clearCookie("session")
            res.clearCookie("session_refresh")
            res.sendStatus(401)
          }
        
      }

    }
  }

}

module.exports = authenticateToken;