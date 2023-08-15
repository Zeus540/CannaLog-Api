const db = require('../../lib/db')


module.exports = {
    get:(req,res) => {
      /* ...
      // #swagger.tags = ['Nutrients']
      ...
      */
            let sql = `
            SELECT * FROM nutrient_options
            ORDER BY nutrient_options.nutrient_name
            `
    
            db.query(sql, (err, result, fields) => {
              if (err) {
                console.log(err)
              } else {
                res.send(result)
              }
            })
        },
        get_measurement_units:(req,res) => {
          /* ...
          // #swagger.tags = ['Nutrients']
          ...
          */
                let sql = `
                SELECT * FROM measurement_units ORDER BY measurement_units.measurement_unit_id
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

