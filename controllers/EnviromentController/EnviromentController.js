const db = require('../../lib/db')
let channel = "SweetLeaf"

module.exports = {
  get: (req, res) => {
    /* ...
      // #swagger.tags = ['Environment']
      ...
      */

    let sql = `
    SELECT environments.environment_id,environments.name,environments.description,environments.light_exposure,environments.cover_img,environments.creation_date,environments.last_updated,environment_types.environment_type_name,environment_types.environment_type_id,length,width,height
    FROM environment_types
    JOIN environments ON environments.environment_type_id = environment_types.environment_type_id
    WHERE environments.user_id = ?
    `

    db.query(sql, [req.user.user_id], (err, result, fields) => {
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

    console.log(isNaN(parseInt(req.body.light_exposure)))
    let envObj = {
      user_id: req.user.user_id,
      environment_type_id: req.body.environment_type_id == null || undefined ? null : req.body.environment_type_id,
      name: req.body.name,
      description: req.body.description == null || undefined ? null : req.body.description,
      light_exposure: isNaN(parseInt(req.body.light_exposure)) ? null : parseInt(req.body.light_exposure),
      height: isNaN(parseInt(req.body.height)) ? null : parseInt(req.body.height),
      length: isNaN(parseInt(req.body.length)) ? null : parseInt(req.body.length),
      width: isNaN(parseInt(req.body.width)) ? null : parseInt(req.body.width),
      cover_img: req.body.environment_type_id == 2 ? "https://minio.s3.sweetleaf.co.za/sweetleaf/outdoor2.jpg" : "https://minio.s3.sweetleaf.co.za/sweetleaf/indoor.jpg"
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
        req.pubClient.publish(channel, str_payload)

        res.send(result)

      }
    })
  },
  edit: (req, res) => {
    /* ...
      // #swagger.tags = ['Environment']
      ...
      */

    if (isNaN(parseInt(req.body.light_exposure))) {
     req.body.light_exposure = null
    }
    if (isNaN(parseInt(req.body.length))) {
      req.body.length = null
    }
    if (isNaN(parseInt(req.body.width))) {
      req.body.width = null
    }
    if (isNaN(parseInt(req.body.height))) {
      req.body.height = null
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
        req.pubClient.publish(channel, str_payload)

        res.send(result)

      }
    })
  },
  delete: (req, res) => {
    /* ...
      // #swagger.tags = ['Environment']
      ...
      */

    let sql = `
      DELETE FROM environments WHERE environments.environment_id = ? AND environments.user_id = ?
      `
    db.query(sql, [req.params.environment_id, req.user.user_id], (err, result, fields) => {
      if (err) {
        console.log(err)

      } else {

        res.send(result)

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

