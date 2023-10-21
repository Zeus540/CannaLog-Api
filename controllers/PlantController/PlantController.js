const db = require('../../lib/db')
const {rollback,commit,releaseConnectionAndRespond} = require('../../lib/db_helper');
const { zonedTimeToUtc, format } = require('date-fns-tz');
const { parse } = require('date-fns');

  // Query 1
  function insert_plant(req,res,connection) {

    let creation_date = req.body.creation_date
    let time_zone = req.body.timezone
    let plant_name = req.body.name
    let plant_strain = req.body.strain
    let environment_id = req.body.environment
    let irrigation_type = req.body.irrigation
    let public = req.body.public

    // Parse the user-submitted date string in the user's timezone
    const userDate = parse(creation_date, 'yyyy-MM-dd HH:mm:ss', new Date(), { timeZone: time_zone });

    // Convert the user's local date to UTC
    const utcDate  = zonedTimeToUtc(userDate, time_zone);

    // Format the UTC date as a string
    const utcTimestamp = format(utcDate, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Etc/UTC' });


    let values = {
      plant_name:`"${plant_name}"`,
      plant_strain,
      environment_id,
      irrigation_type,
      public,
      user_id:req.user.user_id,
      creation_date: `'${utcTimestamp}'`,
      last_updated: `'${utcTimestamp}'`
    }

    let sql = `INSERT INTO plants (${Object.keys(values)}) VALUES (${Object.values(values)})`

    db.query(sql, (error, results) => {
      if (error) {
        console.error('Error executing query 1: ', error);
        rollback(connection, res);
        return;
      }

      console.log('Results of query 1: ', results);

      // Continue with other queries or commit the transaction
      insert_plant_action(connection,req,res,results,utcTimestamp);
    });
  }

  // Query 2
  function insert_plant_action(connection,req,res,prev_results,utcTimestamp) {

      let sql = `INSERT INTO plant_actions (plant_id,user_id,plant_action_type_id,creation_date) VALUES (${prev_results.insertId},${req.user.user_id},14,'${utcTimestamp}')`
  
      db.query(sql, (error, results) => {
        if (error) {
          console.error('Error executing query 2: ', error);
          rollback(connection, res);
          return;
        }
  
        console.log('Results of query 2: ', results);
  
        // Continue with other queries or commit the transaction
        insert_plant_strain_action(connection,req,res,prev_results,results.insertId,utcTimestamp);
      });
  }

  // Query 3
  function insert_plant_strain_action(connection,req,res,prev_results,id,utcTimestamp) {

          console.log("prev_results",prev_results)
          console.log("req",req.body.stage)
          let sql = `INSERT INTO plant_stages (plant_id,user_id,plant_action_id,plant_stage,creation_date,last_updated) VALUES (${prev_results.insertId},${req.user.user_id},${id},${req.body.stage},'${utcTimestamp}','${utcTimestamp}')`
      
          db.query(sql, (error, results) => {
            if (error) {
              console.error('Error executing query 3: ', error);
              rollback(connection, res);
              return;
            }
      
            console.log('Results of query 3: ', results);
      
            // Continue with other queries or commit the transaction
            get_plant(connection,req,res,prev_results);
          });
  }

  // Query 4
  function get_plant(connection,req,res,prev_results) {

    let sql = `
    SELECT users.user_name,users.user_id,irrigation_types.irrigation_type, strains.strain_name, plants.plant_id, plants.plant_name,plants.cover_img,plants.cover_thumbnail, DATE_FORMAT(plants.creation_date,"%Y-%m-%dT%H:%i:%sZ") as creation_date,plants.last_updated,plants.environment_id,environments.environment_name
    FROM users
    JOIN plants ON users.user_id = plants.user_id
    JOIN irrigation_types ON irrigation_types.irrigation_type_id = plants.irrigation_type
    JOIN strains ON strains.strain_id = plants.plant_strain
    JOIN environments ON environments.environment_id = plants.environment_id
    WHERE plants.user_id = ?
    AND plants.plant_id = ?
    `

    db.query(sql,[req.user.user_id,prev_results.insertId], (error, results) => {
      if (error) {
        console.error('Error executing query 4: ', error);
        rollback(connection, res);
        return;
      }
      commit(connection,res, results, prev_results);
      console.log('Results of query 4: ', results);


    });
  }
 

   // Query 5
   function plant_viewed(req,res,connection) {

    let creation_date = req.body.creation_date
    let time_zone = req.body.timezone

    // Parse the user-submitted date string in the user's timezone
    const userDate = parse(creation_date, 'yyyy-MM-dd HH:mm:ss', new Date(), { timeZone: time_zone });

    // Convert the user's local date to UTC
    const utcDate  = zonedTimeToUtc(userDate, time_zone);

    // Format the UTC date as a string
    const utcTimestamp = format(utcDate, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Etc/UTC' });

    let plant_viewed_sql = `
    INSERT INTO plant_views(plant_id, plant_viewer_user_id, creation_date) VALUES (${req.params.plant_id},${req.user.user_id},'${utcTimestamp}')
    `

     db.query(plant_viewed_sql,[req.params.plant_id], (err, result, fields) => {
       if (err) {
         console.log(err)
       } else {
        insert_notification(req,res,result,connection,2)
       }
     })
  }

   // Query 6
   function insert_notification(req,res,prev_result,connection,type) {


    let creation_date = req.body.creation_date
    let time_zone = req.body.timezone
    console.log("req.body",req.body)

    // Parse the user-submitted date string in the user's timezone
    const userDate = parse(creation_date, 'yyyy-MM-dd HH:mm:ss', new Date(), { timeZone: time_zone });

    // Convert the user's local date to UTC
    const utcDate  = zonedTimeToUtc(userDate, time_zone);

    // Format the UTC date as a string
    const utcTimestamp = format(utcDate, 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Etc/UTC' });

    let user_notifications_sql = `
    INSERT INTO user_notifications( user_id, notification_action_id, plant_id, actor_user_id, creation_date) VALUES (${req.body.plant_user_id},${type},${req.params.plant_id},${req.user.user_id},'${utcTimestamp}')
    `

     db.query(user_notifications_sql,[req.params.plant_id], (err, result, fields) => {
       if (err) {
         console.log(err)
       } else {
         notify(req,res,result)
        commit(connection,res,prev_result)
       
       }
     })
  }

 
  function notify(req,res,prev_result){
    pubClient = req.app.locals.pubClient

    console.log("plant_user_id",req.body.plant_user_id)

    let payload = {
      type: "notify",
      user: req.body.plant_user_id,
      data: prev_result.insertId
    }

    let str_payload = JSON.stringify(payload)
    pubClient.publish(process.env.CHANNEL, str_payload)

  }

module.exports = {
  getPublic: (req, res) => {
    /* ...
    // #swagger.tags = ['Plants']
    ...
    */
    
    let sql_public = `
    SELECT users.user_name,users.user_id, irrigation_types.irrigation_type, strains.strain_name, plants.plant_id, plants.plant_name,plants.cover_img,plants.cover_thumbnail,DATE_FORMAT(plants.creation_date, '%Y-%m-%dT%H:%i:%sZ') AS creation_date,plants.last_updated,plants.environment_id,environments.environment_name,COUNT(plant_likes.plant_like_id) AS likes,COUNT(plant_views.plant_view_id) AS views
    FROM users
    JOIN plants ON users.user_id = plants.user_id
    JOIN irrigation_types ON irrigation_types.irrigation_type_id = plants.irrigation_type
    JOIN strains ON strains.strain_id = plants.plant_strain
    JOIN environments ON environments.environment_id = plants.environment_id
    LEFT JOIN plant_likes ON plants.plant_id = plant_likes.plant_id
    LEFT JOIN plant_views ON plants.plant_id = plant_views.plant_id
    WHERE plants.public = 1
    GROUP BY
    users.user_name,
    irrigation_types.irrigation_type,
    strains.strain_name,
    plants.plant_id,
    plants.plant_name,
    plants.cover_img,
    plants.cover_thumbnail,
    plants.creation_date,
    plants.last_updated,
    plants.environment_id,
    environments.environment_name
    ORDER BY plants.creation_date DESC
    `

    db.query(sql_public, (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    })
   
  },
  getPublicSignedIn: (req, res) => {
    /* ...
    // #swagger.tags = ['Plants']
    ...
    */
    let sql = `
    SELECT users.user_name,users.user_id, irrigation_types.irrigation_type, strains.strain_name, plants.plant_id, plants.plant_name,plants.cover_img,plants.cover_thumbnail,DATE_FORMAT(plants.creation_date, '%Y-%m-%dT%H:%i:%sZ') AS creation_date,plants.last_updated,plants.environment_id,environments.environment_name,COUNT(plant_likes.plant_like_id) AS likes,COUNT(plant_views.plant_view_id) AS views
    FROM users
    JOIN plants ON users.user_id = plants.user_id
    JOIN irrigation_types ON irrigation_types.irrigation_type_id = plants.irrigation_type
    JOIN strains ON strains.strain_id = plants.plant_strain
    JOIN environments ON environments.environment_id = plants.environment_id
    LEFT JOIN plant_likes ON plants.plant_id = plant_likes.plant_id
    LEFT JOIN plant_views ON plants.plant_id = plant_views.plant_id
    WHERE plants.public = 1
    AND plants.user_id != ?
    GROUP BY
    users.user_name,
    irrigation_types.irrigation_type,
    strains.strain_name,
    plants.plant_id,
    plants.plant_name,
    plants.cover_img,
    plants.cover_thumbnail,
    plants.creation_date,
    plants.last_updated,
    plants.environment_id,
    environments.environment_name
    ORDER BY plants.creation_date DESC
    `

    db.query(sql,[req.user.user_id], (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    })
   
  },
  getStrains: (req, res) => {
    /* ...
    // #swagger.tags = ['Plants']
    ...
    */
    let sql = `
            SELECT * FROM strains
            ORDER BY strains.strain_name
            `

    db.query(sql, (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    })
  },
  getStages: (req, res) => {
    /* ...
    // #swagger.tags = ['Plants']
    ...
    */
    let sql = `
            SELECT * FROM stages
            `

    db.query(sql, (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    })
  },
  getMyPlants: async(req, res) => {
    /* ...
    // #swagger.tags = ['Plants']
    ...
    */

    let limit = ''
    let orderBy = ''

    if (req.query.sort == undefined) {
      orderBy = 'DESC'
    } else {
      orderBy = req.query.sort
    }

    if (req.query.limit == undefined) {
      limit = ""
    } else {
      limit = parseInt(req.query.limit)
    }
    let key_sort = req.query.key_sort
    
    let getMyPlants_sql = ''

    if (key_sort == "undefined") {
    getMyPlants_sql = `
    SELECT users.user_name,users.user_id, irrigation_types.irrigation_type, strains.strain_name, plants.plant_id, plants.plant_name,plants.cover_img,plants.cover_thumbnail,DATE_FORMAT(plants.creation_date, '%Y-%m-%dT%H:%i:%sZ') AS creation_date,plants.last_updated,plants.environment_id,environments.environment_name,COUNT(plant_likes.plant_like_id) AS likes,COUNT(plant_views.plant_view_id) AS views
    FROM users
    JOIN plants ON users.user_id = plants.user_id
    JOIN irrigation_types ON irrigation_types.irrigation_type_id = plants.irrigation_type
    JOIN strains ON strains.strain_id = plants.plant_strain
    JOIN environments ON environments.environment_id = plants.environment_id
    LEFT JOIN plant_likes ON plants.plant_id = plant_likes.plant_id
    LEFT JOIN plant_views ON plants.plant_id = plant_views.plant_id
    WHERE plants.user_id = ?
    GROUP BY
    users.user_name,
    irrigation_types.irrigation_type,
    strains.strain_name,
    plants.plant_id,
    plants.plant_name,
    plants.cover_img,
    plants.cover_thumbnail,
    plants.creation_date,
    plants.last_updated,
    plants.environment_id,
    environments.environment_name
    ORDER BY plants.creation_date ${orderBy}
    LIMIT ${limit}
    `
    }else{
      getMyPlants_sql = `
      SELECT users.user_name,users.user_id, irrigation_types.irrigation_type, strains.strain_name, plants.plant_id, plants.plant_name,plants.cover_img,plants.cover_thumbnail,DATE_FORMAT(plants.creation_date, '%Y-%m-%dT%H:%i:%sZ') AS creation_date,plants.last_updated,plants.environment_id,environments.environment_name,COUNT(plant_likes.plant_like_id) AS likes,COUNT(plant_views.plant_view_id) AS views
      FROM users
      JOIN plants ON users.user_id = plants.user_id
      JOIN irrigation_types ON irrigation_types.irrigation_type_id = plants.irrigation_type
      JOIN strains ON strains.strain_id = plants.plant_strain
      JOIN environments ON environments.environment_id = plants.environment_id
      LEFT JOIN plant_likes ON plants.plant_id = plant_likes.plant_id
      LEFT JOIN plant_views ON plants.plant_id = plant_views.plant_id
      WHERE plants.user_id = ? AND plants.creation_date < ?
      GROUP BY
      users.user_name,
      irrigation_types.irrigation_type,
      strains.strain_name,
      plants.plant_id,
      plants.plant_name,
      plants.cover_img,
      plants.cover_thumbnail,
      plants.creation_date,
      plants.last_updated,
      plants.environment_id,
      environments.environment_name
      ORDER BY plants.creation_date ${orderBy}
      LIMIT ${limit}
      `
    }

  await  db.query(getMyPlants_sql, [req.user.user_id,`${key_sort}`], (err, result_pagination, fields) => {
      if (err) {
        console.log(err)
      } else {

        let sql_pagination_total = `SELECT COUNT(*) AS total FROM plants WHERE plants.user_id = ?`

        db.query(sql_pagination_total, [req.user.user_id], (err, result, fields) => {
          if (err) {
            console.log(err)

          } else {

            let next_cursor = result_pagination.length === limit ? result_pagination[result_pagination.length - 1]?.creation_date : null
            let total_count = result[0].total
            let has_more = result_pagination.length === limit;

            let paginated_result =
            {
              data: result_pagination,
              next_cursor: next_cursor,
              has_more: has_more,
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
        // #swagger.tags = ['Plants']
        ...
        */
        
        db.getConnection((error, connection) => {
          if (error) {
            console.error('Error acquiring connection from the pool: ', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
            
        connection.beginTransaction((error) => {
        if (error) {
          console.error('Error starting the transaction: ', error);
          releaseConnectionAndRespond(connection, res, 500, 'Internal server error');
          return;
        }

        
        insert_plant(req,res,connection);
      
      });

  });
     
  },
  delete: (req, res) => {
    /* ...
      // #swagger.tags = ['Plants']
      ...
      */

      let delete_sql = `
      DELETE FROM plants WHERE plants.plant_id = ? AND plants.user_id = ?
      `
    db.query(delete_sql, [req.params.plant_id, req.user.user_id], (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    })
  },
  current_stage: (req, res) => {
    /* ...
      // #swagger.tags = ['Plants']
      ...
      */
      let current_stage_sql = `
      SELECT DATE_FORMAT(plant_stages.creation_date, "%Y-%m-%dT%H:%i:%sZ") AS creation_date,plant_stages.last_updated,plant_stages.plant_action_id,plant_stages.plant_id,plant_stages.plant_stage,plant_stages.plant_stage_id,plant_stages.user_id,stages.stage_name,stages.stage_color
      FROM plant_stages
      JOIN stages ON stages.stage_id = plant_stages.plant_stage
      JOIN plants ON plant_stages.plant_id = plants.plant_id
      WHERE plant_stages.plant_id = ?  AND plants.user_id = ?
      ORDER BY creation_date DESC
      LIMIT 1
      `
    db.query(current_stage_sql, [req.body.plant_id,req.user.user_id], (err, result, fields) => {
      if (err) {
        res.status(500).send(err)
      } else {
        if(result.length > 0){
          res.send(result[0])
        }else{
          res.status(401).send("Unable to fetch stage data for the requested plant")
        }
      }
    })
  },
  current_stage_public: (req, res) => {
    /* ...
      // #swagger.tags = ['Plants']
      ...
      */
      let current_stage_sql = `
      SELECT DATE_FORMAT(plant_stages.creation_date, "%Y-%m-%dT%H:%i:%sZ") AS creation_date,plant_stages.last_updated,plant_stages.plant_action_id,plant_stages.plant_id,plant_stages.plant_stage,plant_stages.plant_stage_id,plant_stages.user_id,stages.stage_name,stages.stage_color
      FROM plant_stages
      JOIN stages ON stages.stage_id = plant_stages.plant_stage
      JOIN plants ON plant_stages.plant_id = plants.plant_id
      WHERE plant_stages.plant_id = ? AND plants.public = 1
      ORDER BY creation_date DESC
      LIMIT 1
      `
    db.query(current_stage_sql, [req.body.plant_id], (err, result, fields) => {
      if (err) {
        res.status(500).send(err)
      } else {
        if(result.length > 0){
          res.send(result[0])
        }else{
          res.status(401).send("Unable to fetch stage data for the requested plant")
        }
      }
    })
  },
  current_environment: (req, res) => {
    /* ...
      // #swagger.tags = ['Plants']
      ...
      */
      let sql = `
      SELECT 
      environments.environment_id,
      plants.public,
      environments.environment_name,
      environments.environment_description,
      environments.environment_light_exposure,
      environments.environment_cover_img,
      environments.creation_date,
      environments.last_updated,
      environment_types.environment_type_name,
      environment_types.environment_type_id,
      environments.environment_length,
      environments.environment_width,
      environments.environment_height
      FROM environment_types
      JOIN environments ON environments.environment_type_id = environment_types.environment_type_id
      JOIN plants ON environments.environment_id = plants.environment_id
      WHERE environments.environment_id = ? AND plants.user_id = ?;
      `
    db.query(sql, [req.body.environment_id,req.user.user_id], (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        if(result.length > 0){
          res.send(result[0])
        }else{
          res.status(401).send("Unable to fetch enviroment data for the requested plant")
        }
      }
    })
  },
  current_environment_public: (req, res) => {
    /* ...
      // #swagger.tags = ['Plants']
      ...
      */
      let sql = `
      SELECT 
      environments.environment_id,
      plants.public,
      environments.environment_name,
      environments.environment_description,
      environments.environment_light_exposure,
      environments.environment_cover_img,
      environments.creation_date,
      environments.last_updated,
      environment_types.environment_type_name,
      environment_types.environment_type_id,
      environments.environment_length,
      environments.environment_width,
      environments.environment_height
      FROM environment_types
      JOIN environments ON environments.environment_type_id = environment_types.environment_type_id
      JOIN plants ON environments.environment_id = plants.environment_id
      WHERE environments.environment_id = ? AND plants.public = 1;
      `
    db.query(sql, [req.body.environment_id], (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        if(result.length > 0){
          res.send(result[0])
        }else{
          res.status(401).send("Unable to fetch enviroment data for the requested plant")
        }
      }
    })
  }, 
  update_cover_image: (req, res) => {
    /* ...
      // #swagger.tags = ['Plants']
      ...
      */
      let sql = `
      UPDATE plants
      SET cover_img = ?, cover_thumbnail = ?
      WHERE plant_id = ?
      `
console.log("req.body.cover_img",req.body.cover_img)
console.log("req.body.cover_thumbnail",req.body.cover_thumbnail)

    db.query(sql, [req.body.cover_img,req.body.cover_thumbnail,req.params.plant_id], (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result[0])
      }
    })
  },
  plant_viewed: (req, res) => {
    /* ...
      // #swagger.tags = ['Plants']
      ...
      */
      db.getConnection((error, connection) => {
        if (error) {
          console.error('Error acquiring connection from the pool: ', error);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }

      connection.beginTransaction((error) => {
      if (error) {
        console.error('Error starting the transaction: ', error);
        releaseConnectionAndRespond(connection, res, 500, 'Internal server error');
        return;
      }
      plant_viewed(req,res,connection)

    
    });

});

  },
  get_detailed_plant_info_public: (req, res)=>{

    let plant_id = req.params.plant_id
   
    let getMyPlants_sql = `
    SELECT users.user_name,users.user_id, irrigation_types.irrigation_type, strains.strain_name, plants.plant_id, plants.plant_name,plants.cover_img,plants.cover_thumbnail,plants.public,DATE_FORMAT(plants.creation_date, '%Y-%m-%dT%H:%i:%sZ') AS creation_date,plants.last_updated,plants.environment_id,environments.environment_name,COUNT(plant_likes.plant_like_id) AS likes,COUNT(plant_views.plant_view_id) AS views
    FROM users
    JOIN plants ON users.user_id = plants.user_id
    JOIN irrigation_types ON irrigation_types.irrigation_type_id = plants.irrigation_type
    JOIN strains ON strains.strain_id = plants.plant_strain
    JOIN environments ON environments.environment_id = plants.environment_id
    LEFT JOIN plant_likes ON plants.plant_id = plant_likes.plant_id
    LEFT JOIN plant_views ON plants.plant_id = plant_views.plant_id
    WHERE plants.public = 1 AND plants.plant_id = ?
    GROUP BY
    users.user_name,
    irrigation_types.irrigation_type,
    strains.strain_name,
    plants.plant_id,
    plants.plant_name,
    plants.cover_img,
    plants.cover_thumbnail,
    plants.creation_date,
    plants.last_updated,
    plants.environment_id,
    environments.environment_name
ORDER BY
    plants.creation_date DESC;
    `

    db.query(getMyPlants_sql, [plant_id], (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
      
        if(result.length > 0){
          res.send(result[0])
        }else{
          res.status(401).send("Unable to fetch information for the requested plant")
        }
  
      }
    })


  },
  get_detailed_plant_info: (req, res)=>{

      let plant_id = req.params.plant_id
     
      let getMyPlants_sql = `
      SELECT users.user_name,users.user_id, irrigation_types.irrigation_type, strains.strain_name, plants.plant_id, plants.plant_name,plants.cover_img,plants.cover_thumbnail,DATE_FORMAT(plants.creation_date, '%Y-%m-%dT%H:%i:%sZ') AS creation_date,plants.last_updated,plants.environment_id,environments.environment_name,COUNT(plant_likes.plant_like_id) AS likes,COUNT(plant_views.plant_view_id) AS views
      FROM users
      JOIN plants ON users.user_id = plants.user_id
      JOIN irrigation_types ON irrigation_types.irrigation_type_id = plants.irrigation_type
      JOIN strains ON strains.strain_id = plants.plant_strain
      JOIN environments ON environments.environment_id = plants.environment_id
      LEFT JOIN plant_likes ON plants.plant_id = plant_likes.plant_id
      LEFT JOIN plant_views ON plants.plant_id = plant_views.plant_id
      WHERE plants.user_id = ? AND plants.plant_id = ?
      GROUP BY
      users.user_name,
      irrigation_types.irrigation_type,
      strains.strain_name,
      plants.plant_id,
      plants.plant_name,
      plants.cover_img,
      plants.cover_thumbnail,
      plants.creation_date,
      plants.last_updated,
      plants.environment_id,
      environments.environment_name
  ORDER BY
      plants.creation_date DESC;
      `
  
      db.query(getMyPlants_sql, [req.user.user_id,plant_id], (err, result, fields) => {
        if (err) {
          console.log(err)
        } else {
        
          if(result.length > 0){
            res.send(result[0])
          }else{
            res.status(401).send("Unable to fetch information for the requested plant")
          }
    
        }
      })
 

  },
}

