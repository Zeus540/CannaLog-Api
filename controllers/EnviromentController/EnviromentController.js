const db = require('../../lib/db')
require('dotenv').config()
const { zonedTimeToUtc, format } = require('date-fns-tz');
const { parse } = require('date-fns');



module.exports = {
  get: (req, res) => {
    /* ...
      // #swagger.tags = ['Environment']
      ...
      */

let limit = ''
let orderBy = ''

if(req.query.sort == undefined ){
  orderBy = 'DESC'
}else{
  orderBy = req.query.sort
}

if(req.query.limit == undefined ){
  limit = ""
}else{
  limit = parseInt(req.query.limit)
}

let last_value = req.query.key_sort

let utcTimestamp = ""

if(last_value == "undefined"){
  utcTimestamp = "";
}else{
  utcTimestamp = last_value;
}

    let get_environment_sql = `
    SELECT environments.environment_id, 
    environments.user_id,
    environments.environment_type_id,
    environment_types.environment_type_name,
    environments.environment_name,
    environments.environment_light_exposure,
    environments.environment_length,
    environments.environment_width,
    environments.environment_height,
    environments.environment_cover_img,
    environments.creation_date,
    (SELECT JSON_ARRAYAGG(JSON_OBJECT('plant_id', plants.plant_id, 'plant_name', plants.plant_name,'cover_thumbnail', plants.cover_thumbnail,'environment_id', plants.environment_id))
     FROM plants 
     WHERE plants.environment_id = environments.environment_id) AS plants
FROM environment_types
JOIN environments ON environments.environment_type_id = environment_types.environment_type_id
WHERE environments.user_id = ? AND environments.creation_date ${utcTimestamp == "" ? ">":"<"} ?
ORDER BY creation_date ${orderBy}
LIMIT ?
    `
   
  db.query(get_environment_sql, [req.user.user_id,`${utcTimestamp}`,limit], (err, result_pagination, fields) => {
      if (err) {
        console.log(err)

      } else {

      let sql_pagination_total = `SELECT COUNT(*) AS total FROM environments WHERE environments.user_id = ?`

        db.query(sql_pagination_total, [req.user.user_id], (err, result, fields) => {
          if (err) {
            console.log(err)
    
          } else {
       
            let next_cursor = result_pagination[result_pagination.length - 1]?.creation_date
            let total_count = result[0].total
            let has_more = result_pagination.length > limit - 1; 

            let paginated_result = 
            {
                data: result_pagination,
                next_cursor:next_cursor,
                has_more:has_more,
                total_count: total_count,
            };
            
            res.send(paginated_result)
    
          }
        })

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
    delete req.body.timezone
    delete req.body.plants
    
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

