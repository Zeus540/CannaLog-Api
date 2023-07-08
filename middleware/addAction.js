const db = require('../lib/db') 

function addAction(req, res, next)  {
    let sql = ``
  
    db.query(sql,[req.user.user_id,result.insertId],(err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
       
      }
    })
  }

  module.exports = addAction