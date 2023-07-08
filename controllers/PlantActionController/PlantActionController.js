const db = require('../../lib/db')
const { formatToTimeZone } = require('date-fns-timezone');
const { rollback, commit, releaseConnectionAndRespond } = require('../../lib/db_helper')

module.exports = {
  get: (req, res) => {
    /* ...
    // #swagger.tags = ['Plants']
    ...
    */
    let sql = `
    SELECT plant_action_types.plant_action_type_name, plant_actions.plant_action_id,plant_actions.plant_id,plant_actions.creation_date,plant_actions.plant_action_type_id
    FROM plant_action_types
    JOIN plant_actions ON plant_action_types.plant_action_type_id = plant_actions.plant_action_type_id

    WHERE plant_actions.plant_id = ?
    ORDER BY plant_actions.creation_date DESC
        `

    db.query(sql, [req.body.plant_id], (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    })
  },
  getTypes: (req, res) => {
    /* ...
    // #swagger.tags = ['Plant Actions']
    ...
    */
    let sql = `
    SELECT * FROM plant_action_types ORDER BY plant_action_type_id
  
        `
    db.query(sql, [req.body.plant_id], (err, result, fields) => {
      if (err) {
        console.log(err)
      } else {
        res.send(result)
      }
    })
  },
  getActionsByType: (req, res) => {
    /* ...
    // #swagger.tags = ['Plant Actions']
    ...
    */
    let sql = ``

    switch (req.params.type) {
      case "14":
     
        sql = `
        SELECT plant_stages.plant_stage,plant_stages.user_id, plant_stages.plant_id,plant_stages.plant_stage_id,stages.stage_name,plant_stages.plant_action_type_id,plant_stages.creation_date,stages.stage_color
        FROM plant_stages
        JOIN stages ON plant_stage = stages.stage_id
        WHERE plant_stages.plant_id = ?
        ORDER BY creation_date DESC
        `
        db.query(sql, [req.body.plant_id], (err, result, fields) => {
          if (err) {
            console.log(err)
          } else {
           
            res.send(result)
          }
        })

        break;

      default:
        break;
    }


  },
  takeAction: (req, res) => {
    console.log("values", req.body)

    const utcTimestamp = formatToTimeZone(new Date(req.body.creation_date), 'YYYY-MM-DD HH:mm:ss', { timeZone: 'Etc/UTC' });

    let sql = ''

    switch (req.body.plant_action_type_id) {
      case 14:

        function insert_stage_action(req, res, connection, prev_result) {
          sql = `
          INSERT INTO plant_stages (plant_action_type_id, user_id,plant_id,plant_stage, creation_date,last_updated) 
          VALUES (${prev_result.insertId},${req.user.user_id},${req.body.plant_id},${req.body.stage_id},'${utcTimestamp}','${utcTimestamp}')`

          db.query(sql, (err, result, fields) => {
            if (err) {
              console.log(err)
              rollback(connection, res);
            } else {
              res.send(result)
            }
          })

        }
        function insert_action(req, res, connection) {
          sql = `INSERT INTO plant_actions (plant_id, user_id, plant_action_type_id, creation_date) VALUES (${req.body.plant_id},${req.user.user_id},${req.body.plant_action_type_id},'${utcTimestamp}')`

          db.query(sql, (err, result, fields) => {
            if (err) {
              console.log(err)
              rollback(connection, res);
            } else {
              insert_stage_action(req, res, connection, result)
            }
          })

        }

        // Acquire a connection from the pool
        db.getConnection((error, connection) => {
          if (error) {
            console.error('Error acquiring connection from the pool: ', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
          // Start the transaction
          connection.beginTransaction((error) => {
            if (error) {
              console.error('Error starting the transaction: ', error);
              releaseConnectionAndRespond(connection, res, 500, 'Internal server error');
              return;
            }

            // Perform queries within the transaction
            insert_action(req, res, connection);

          });

        });

        break;

      default:
        break;
    }
  }
}