const db = require('../../lib/db')


module.exports = {
    get:(req,res) => {
      /* ...
      // #swagger.tags = ['Plants']
      ...
      */
            let sql = `
            SELECT * FROM irrigation_types
            `
    
            db.query(sql, (err, result, fields) => {
              if (err) {
                console.log(err)
              } else {
                res.send(result)
              }
            })
        },

}