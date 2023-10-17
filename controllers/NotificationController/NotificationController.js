const db = require('../../lib/db')
const { formatToTimeZone } = require('date-fns-timezone');
const {rollback,commit,releaseConnectionAndRespond} = require('../../lib/db_helper');
const { zonedTimeToUtc, format } = require('date-fns-tz');
const { parse } = require('date-fns');


module.exports = {
    get: (req, res) => {
      /* ...
        // #swagger.tags = ['Notifications']
        ...
        */
  
      let get_notifications = `
      SELECT 
      user_notifications.user_notification_id,
      user_notifications.user_id,
      user_notifications.notification_action_id,
      user_notifications.plant_id,
      user_notifications.actor_user_id,
      user_notifications.notification_read,
      notification_actions.notification_action_id,
      notification_actions.notification_action_type,
      actors.user_name AS actor_user_name,
      DATE_FORMAT(user_notifications.creation_date, "%Y-%m-%dT%H:%i:%sZ") AS creation_date
  FROM 
      user_notifications
  JOIN 
      notification_actions ON user_notifications.notification_action_id = notification_actions.notification_action_id
  LEFT JOIN 
      users AS actors ON user_notifications.actor_user_id = actors.user_id 
  WHERE 
      user_notifications.user_id = ?
      ORDER BY creation_date DESC;
  
      `
  
      db.query(get_notifications, [req.user.user_id], (err, result, fields) => {
        if (err) {
          res.status(500).json({ error: 'Failed to get notification' });
        } else {
          res.send(result)
        }
      })
    },
    read:(req, res)=>{
      /* ...
            // #swagger.tags = ['Notifications']
            ...
            */
       
          let id = req.params.notification_id
    
          console.log("id",id)
          const read_notifications = `
          UPDATE user_notifications
          SET user_notifications.notification_read = ?
          WHERE user_notifications.user_notification_id = ?;
        `;
    
     
        db.query(read_notifications, [1, id], (err, result, fields) => {
          if (err) {
            res.status(500).json({ error: 'Failed to update entry' });
          } else {
            res.status(200).json({ message: 'Notification successfully read'});
          }
        });
    
        },
    readAll:(req, res)=>{
  /* ...
        // #swagger.tags = ['Notifications']
        ...
        */
   
      let ids = req.body.ids

      const read_notifications = `
      UPDATE user_notifications
      SET user_notifications.notification_read = ?
      WHERE user_notifications.user_notification_id IN (?);
    `;

 
    db.query(read_notifications, [1, ids], (err, result, fields) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to update entries' });
      } else {
        res.status(200).json({ message: 'Entries updated successfully' });
      }
    });

    }
  }
  
  