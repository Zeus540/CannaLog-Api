const db = require('../../lib/db')
require('dotenv').config()




module.exports = {
  get: (req, res) => {
    /* ...
      // #swagger.tags = ['Environment']
      ...
      */

    let get_environment_sql = `
    SELECT environments.environment_id,environments.environment_name,environments.environment_description,environments.environment_light_exposure,environments.environment_cover_img,environments.creation_date,environments.last_updated,environment_types.environment_type_name,environment_types.environment_type_id,environment_length,environment_width,environment_height
    FROM environment_types
    JOIN environments ON environments.environment_type_id = environment_types.environment_type_id
    WHERE environments.user_id = ?
    `

    db.query(get_environment_sql, [req.user.user_id], (err, result, fields) => {
      if (err) {
        console.log(err)

      } else {

        res.send(result)

      }
    })
  },
  add: (req, res) => {
    /* ...
     // #swagger.tags = ['Environment']
     ...
     */
     pubClient = req.app.locals.pubClient
    console.log(isNaN(parseInt(req.body.environment_light_exposure)))
    let envObj = {
      user_id: req.user.user_id,
      environment_type_id: req.body.environment_type_id == null || undefined ? null : req.body.environment_type_id,
      environment_name: req.body.environment_name,
      environment_description: req.body.environment_description == null || undefined ? null : req.body.environment_description,
      environment_light_exposure: isNaN(parseInt(req.body.environment_light_exposure)) ? null : parseInt(req.body.environment_light_exposure),
      environment_height: isNaN(parseInt(req.body.environment_height)) ? null : parseInt(req.body.environment_height),
      environment_length: isNaN(parseInt(req.body.environment_length)) ? null : parseInt(req.body.environment_length),
      environment_width: isNaN(parseInt(req.body.environment_width)) ? null : parseInt(req.body.environment_width),
      environment_cover_img: req.body.environment_type_id == 2 ? "https://s3.cannalog.co.za/sweetleaf/outdoor2.jpg" : "https://s3.cannalog.co.za/sweetleaf/indoor.jpg"
    }
    

    console.log(req.body)
    const sql = 'INSERT INTO environments SET ?';


    db.query(sql, envObj, (err, result, fields) => {
      if (err) {
        console.log(err)

      } else {

        let payload = {
          type: "add_environment",
          user: req.user,
          data: result.insertId
        }

        let str_payload = JSON.stringify(payload)
        pubClient.publish(process.env.CHANNEL, str_payload)
  
        res.send(result)

      }
    })
  },
  edit: (req, res) => {
    /* ...
      // #swagger.tags = ['Environment']
      ...
      */
      pubClient = req.app.locals.pubClient
    if (isNaN(parseInt(req.body.environment_light_exposure))) {
     req.body.environment_light_exposure = null
    }
    if (isNaN(parseInt(req.body.environment_length))) {
      req.body.environment_length = null
    }
    if (isNaN(parseInt(req.body.environment_width))) {
      req.body.environment_width = null
    }
    if (isNaN(parseInt(req.body.environment_height))) {
      req.body.environment_height = null
    }

    delete req.body.environment_type_name
    delete req.body.environment_id
    delete req.body.creation_date
    delete req.body.last_updated

    let sql = `
      UPDATE environments SET ${Object.keys(req.body).map(key => `${key} = ?`).join(', ')}
       WHERE environment_id = ?
       AND environments.user_id = ?
      `

    const values = [...Object.values(req.body), parseInt(req.params.environment_id), req.user.user_id];

    db.query(sql, values, (err, result, fields) => {
      if (err) {
        console.log(err)

      } else {

        let payload = {
          type: "environment_edited",
          user: req.user,
          data: parseInt(req.params.environment_id)
        }
    
        let str_payload = JSON.stringify(payload)
        pubClient.publish(process.env.CHANNEL, str_payload)

        res.send(result)

      }
    })
  },
  delete: (req, res) => {
    /* ...
      // #swagger.tags = ['Environment']
      ...
      */
      pubClient = req.app.locals.pubClient
    let sql = `
      DELETE FROM environments WHERE environments.environment_id = ? AND environments.user_id = ?
      `
    db.query(sql, [req.params.environment_id, req.user.user_id], (err, result, fields) => {
      if (err) {
        console.log(err)

      } else {
        
        if(result.affectedRows > 0 ){
        let payload = {
          type: "environment_deleted",
          user: req.user,
          data: result.affectedRows,
          id: req.params.environment_id,
        }
      
        let str_payload = JSON.stringify(payload)
        pubClient.publish(process.env.CHANNEL, str_payload)
        res.send(result)
        }
      
      }
    })
  },
  getTypes: (req, res) => {
    /* ...
      // #swagger.tags = ['Environment']
      ...
      */

    let sql = `
     SELECT * FROM environment_types
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

