const db = require('../../lib/db')


module.exports = {
    get:(req,res) => {
      /* ...
      // #swagger.tags = ['Training Techniques']
      ...
      */
            let sql = `
            SELECT * FROM grow_technique_types
            ORDER BY grow_technique_types.grow_techniques_id
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