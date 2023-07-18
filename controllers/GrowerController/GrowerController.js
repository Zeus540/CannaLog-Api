const db = require('../../lib/db')


module.exports = {
    get:(req,res) => {
 /* ...
  // #swagger.tags = ['Growers']
  ...
  */
    //Get Growers 
    db.query(`select * from users`,(err,result,fields)=>{
        res.send(result)
      });
     },

}