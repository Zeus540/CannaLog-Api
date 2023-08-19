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
      users AS actors ON user_notifications.actor_user_id = actors.user_id -- Join with the users table for actor_user_id
  WHERE 
      user_notifications.user_id = ?
      ORDER BY creation_date DESC;
  
      `
  
      db.query(get_notifications, [req.user.user_id], (err, result, fields) => {
        if (err) {
          console.log(err)
  
        } else {
  
          res.send(result)
  
        }
      })
    },
  }
  
  