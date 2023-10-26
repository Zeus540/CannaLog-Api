const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const cors = require('cors')
const cookieParser = require('cookie-parser')
const app = express();
const server = createServer(app);

const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger-output.json')
const router = require('./routes')
const db = require('./lib/db');
require('dotenv').config()
const compression = require("compression");

const pubClient = createClient({ url: 'redis://95.111.252.42:6380' });
const subClient = pubClient.duplicate();

pubClient.connect()
subClient.connect()

const allowedOrigins = ["http://localhost:5173","https://cannalog.co.za"]

const io = new Server(server, {
	cors: {
		origin: true,
		credentials: true
	},
	// cookie: {
	// 	httpOnly: true // Enable HTTP-only cookies
	// }
});

io.adapter(createAdapter(pubClient, subClient));

instrument(io, {
	auth: false
  });

app.locals.pubClient = pubClient

const corsConfig = {
	origin: allowedOrigins,
	credentials: true,
	allowedHeaders: "Content-Type, Authorization, X-Request_With",
};

app.use(cors(corsConfig));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json());
app.use(compression())
app.use(router)
app.set('json spaces', 2)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile))



 //Websocket Connections
 io.on('connection', async(socket, req) => {


 	 const yourCookieValue = socket.request.headers.cookie
 	 	?.split(';')
 	 	?.map(cookie => cookie.trim())
 	 	?.find(cookie => cookie.startsWith('session'));

 	 let jwt_token = yourCookieValue?.split("=")[1]
	 
 	 if (jwt_token !== undefined) {
		await jwt.verify(jwt_token, process.env.TOKEN_REFRESH_SECRET,  async(err, user) => {

 	 		let sql = `
 	 	UPDATE users
 	 	SET is_logged_in = 1
 	 	WHERE user_id = ?`
 	 	await db.query(sql, [ user?.user_id], (err, result, fields) => {
 	 			if (err) {
 	 				console.log(err)

 	 			} else {
 	 				console.log(user?.user_name, 'connected');
 	 			}
 	 		})
 	 	})
 	 }


 	socket.on('disconnect', () => {

 	 	const yourCookieValue = socket.request.headers.cookie
 	 		?.split(';')
 	 		?.map(cookie => cookie.trim())
 	 		?.find(cookie => cookie.startsWith('session'));

 	 let jwt_token = yourCookieValue?.split("=")[1]
	 
 	 	if (jwt_token !== undefined) {

 	 		jwt.verify(jwt_token, process.env.TOKEN_REFRESH_SECRET, async (err, user) => {

 	 			let sql = `
 	 		UPDATE users
 	 		SET is_logged_in = 0
 	 		WHERE user_id = ?`
 	 			db.query(sql, [await user?.user_id], (err, result, fields) => {
 	 				if (err) {
 	 					console.log(err)

 	 				} else {
 	 					console.log(user?.user_name, 'disconnected');
 	 				}
 	 			})
 	 		})
 	 	}

 	});
 })

	//Redis Subscribe 
	subClient.subscribe(process.env.CHANNEL, (payload) => {
		
		payload = JSON.parse(payload)

		switch (payload.type) {
			case "add_environment":

			let sql = `
			SELECT
    environments.environment_id,
    environments.environment_name,
    environments.environment_description,
    environments.environment_light_exposure,
    environments.environment_cover_img,
    environments.creation_date,
    environments.last_updated,
    environment_types.environment_type_name,
    environment_types.environment_type_id,
    environment_length,
    environment_width,
    environment_height,
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'plant_id', plants.plant_id,
                'plant_name', plants.plant_name,
                'cover_img', plants.cover_img,
                'environment_id', plants.environment_id
            )
        )
        FROM plants
        WHERE plants.environment_id = environments.environment_id
    ) AS plants
FROM
    environments
JOIN environment_types ON environments.environment_type_id = environment_types.environment_type_id
WHERE
    environments.environment_id = ?;
			`
				db.query(sql, [payload.data], (err, result, fields) => {
					if (err) {
						console.log(err)

					} else {
						io.local.emit(`environment_added${payload.user.user_id}`, result[0])
						console.log('environment_added')
					}
				})

				break;

			case "environment_edited":
				
				let sql_edited = `
				SELECT
				environments.environment_id,
				environments.environment_name,
				environments.environment_description,
				environments.environment_light_exposure,
				environments.environment_cover_img,
				environments.creation_date,
				environments.last_updated,
				environment_types.environment_type_name,
				environment_types.environment_type_id,
				environment_length,
				environment_width,
				environment_height,
				(
					SELECT JSON_ARRAYAGG(
						JSON_OBJECT(
							'plant_id', plants.plant_id,
							'plant_name', plants.plant_name,
							'cover_img', plants.cover_img,
							'environment_id', plants.environment_id
						)
					)
					FROM plants
					WHERE plants.environment_id = environments.environment_id
				) AS plants
			FROM
				environments
			JOIN environment_types ON environments.environment_type_id = environment_types.environment_type_id
			WHERE
				environments.environment_id = ?;
				`
				db.query(sql_edited, [payload.data], (err, result, fields) => {
					if (err) {
						console.log(err)

					} else {
						console.log(err, result[0])
						io.local.emit(`environment_edited${payload.user.user_id}`, result[0])
						console.log('environment_edited')
					}
				})

				break;

			case "environment_deleted":
			io.local.emit(`environment_deleted${payload.user.user_id}`, payload.id)
			console.log('environment_deleted')
			break;
			
			case "action_taken":

					let action_taken_sql = `
					SELECT plant_action_types.plant_action_type_name, plant_actions.plant_action_id,plant_actions.plant_id,DATE_FORMAT(plant_actions.creation_date, "%Y-%m-%dT%H:%i:%sZ") creation_date,plant_actions.plant_action_type_id
					FROM plant_action_types
					JOIN plant_actions ON plant_action_types.plant_action_type_id = plant_actions.plant_action_type_id
				
					WHERE plant_actions.plant_id = ?
					ORDER BY plant_actions.creation_date DESC
						`
				
					db.query(action_taken_sql, [payload.plant_id], (err, result, fields) => {
					if (err) {
						console.log(err)
					} else {
						io.local.emit(`action_taken${payload.plant_id}`, result)
					
					}
					})
			break;
			
			case "stage_changed":

				let stage_changed_sql = `
				SELECT plant_stages.plant_stage,plant_stages.user_id, plant_stages.plant_id,plant_stages.plant_stage_id,stages.stage_name,plant_stages.plant_action_id,DATE_FORMAT(plant_stages.creation_date, "%Y-%m-%dT%H:%i:%sZ")as creation_date,stages.stage_color
				FROM plant_stages
				JOIN stages ON plant_stage = stages.stage_id
				WHERE plant_stages.plant_id = ?
				ORDER BY creation_date DESC
				`
			
				db.query(stage_changed_sql, [payload.plant_id], (err, result, fields) => {
				if (err) {
					console.log(err)
				} else {
					io.local.emit(`stage_changed${payload.plant_id}`, result[0])
				}
				})
			break;
				
			case "note_added":

			let note_added_sql = `
			SELECT plant_note_id,plant_id,user_id,plant_action_id,plant_note,DATE_FORMAT(plant_notes.creation_date, "%Y-%m-%dT%H:%i:%sZ") as creation_date,last_updated FROM plant_notes
			WHERE plant_notes.plant_note_id = ?

			`
		
			db.query(note_added_sql, [payload.data], (err, result, fields) => {
			if (err) {
				console.log(err)
			} else {
				io.local.emit(`note_added${payload.plant_id}`, result[0])
			}
			})
		
			break;

			case "image_added":

			let image_added_sql = `
			SELECT plant_image_id,plant_id,user_id,plant_action_id,thumbnail_img,thumbnail_img_next_gen,mid_img,mid_img_next_gen,full_img,full_img_next_gen,DATE_FORMAT(creation_date, "%Y-%m-%dT%H:%i:%sZ") as creation_date FROM plant_images
            WHERE plant_images.plant_image_id = ?
           
			`
		
			db.query(image_added_sql, [payload.data], (err, result, fields) => {
			if (err) {
				console.log(err)
			} else {
				io.local.emit(`image_added${payload.plant_id}`, result[0])
			}
			})
		
			break;

			case "watering_added":

		
			watering_added_sql = `
			SELECT 
			plant_feeding.plant_feeding_id,
			plant_feeding.plant_id,
			plant_feeding.user_id,
			plant_feeding.plant_action_id,
			plant_feeding.nutrient_amount,
			DATE_FORMAT(plant_feeding.creation_date, "%Y-%m-%dT%H:%i:%sZ") AS creation_date,
			nutrient_options.nutrient_name,
			measurement_units.measurement_unit_id,
			measurement_units.measurement_unit,
			NULL AS water_amount,
			NULL AS water_amount_measurement
		FROM 
			plant_feeding
		JOIN
			nutrient_options ON plant_feeding.nutrient_id = nutrient_options.nutrient_id
		JOIN
			measurement_units ON plant_feeding.nutrient_measurement = measurement_units.measurement_unit_id
		WHERE 
			plant_feeding.plant_id = ?
		UNION
		SELECT
			NULL AS plant_feeding_id,
			plant_watering.plant_id,
			NULL AS user_id,
			plant_watering.plant_action_id,
			NULL AS nutrient_amount,
			DATE_FORMAT(plant_watering.creation_date, "%Y-%m-%dT%H:%i:%sZ") AS creation_date,
			NULL AS nutrient_name,
			measurement_units.measurement_unit_id,
			measurement_units.measurement_unit,
			plant_watering.water_amount,
			plant_watering.water_amount_measurement
		FROM
			plant_watering
		JOIN
			measurement_units ON plant_watering.water_amount_measurement = measurement_units.measurement_unit_id
		WHERE 
			plant_watering.plant_id = ?;
		
				  `
			db.query(watering_added_sql, [payload.plant_id,payload.plant_id], (err, result, fields) => {
			  if (err) {
				console.log(err)
			  } else {
				io.local.emit(`watering_added${payload.plant_id}`, result)
			  }
			})
		
			break;

			case "feeding_added":

		
			feeding_added_sql = `
			SELECT 
			plant_feeding.plant_feeding_id,
			plant_feeding.plant_id,
			plant_feeding.user_id,
			plant_feeding.plant_action_id,
			plant_feeding.nutrient_amount,
			DATE_FORMAT(plant_feeding.creation_date, "%Y-%m-%dT%H:%i:%sZ") AS creation_date,
			nutrient_options.nutrient_name,
			measurement_units.measurement_unit_id,
			measurement_units.measurement_unit,
			NULL AS water_amount,
			NULL AS water_amount_measurement
		FROM 
			plant_feeding
		JOIN
			nutrient_options ON plant_feeding.nutrient_id = nutrient_options.nutrient_id
		JOIN
			measurement_units ON plant_feeding.nutrient_measurement = measurement_units.measurement_unit_id
		WHERE 
			plant_feeding.plant_id = ?
		UNION
		SELECT
			NULL AS plant_feeding_id,
			plant_watering.plant_id,
			NULL AS user_id,
			plant_watering.plant_action_id,
			NULL AS nutrient_amount,
			DATE_FORMAT(plant_watering.creation_date, "%Y-%m-%dT%H:%i:%sZ") AS creation_date,
			NULL AS nutrient_name,
			measurement_units.measurement_unit_id,
			measurement_units.measurement_unit,
			plant_watering.water_amount,
			plant_watering.water_amount_measurement
		FROM
			plant_watering
		JOIN
			measurement_units ON plant_watering.water_amount_measurement = measurement_units.measurement_unit_id
		WHERE 
			plant_watering.plant_id = ?;
		
				  `
			db.query(feeding_added_sql, [payload.plant_id,payload.plant_id], (err, result, fields) => {
			  if (err) {
				console.log(err)
			  } else {
				io.local.emit(`feeding_added${payload.plant_id}`, result)
			  }
			})
		
			break;

			case "action_deleted":
			io.local.emit(`action_deleted${payload.plant_id}`, payload)
			break;


			case "notify":

			let get_notification_sql = `
			SELECT
			user_notifications.user_notification_id,
			user_notifications.plant_id,
			user_notifications.notification_read,
			users_receiver.user_name AS receiver_user_name,
			users_actor.user_name AS actor_user_name,
			notification_actions.notification_action_type AS notification_action_type,
			DATE_FORMAT(user_notifications.creation_date, "%Y-%m-%dT%H:%i:%sZ") AS creation_date
			FROM
				user_notifications 
			JOIN
				users AS users_receiver ON user_notifications.user_id = users_receiver.user_id
			JOIN
				users AS users_actor ON user_notifications.actor_user_id = users_actor.user_id
			JOIN
				notification_actions ON user_notifications.notification_action_id = notification_actions.notification_action_id
			WHERE
				user_notifications.user_notification_id = ?;
		
			`
		
			db.query(get_notification_sql, [payload.data], (err, result, fields) => {
			if (err) {
				console.log(err)
			} else {
				console.log("notify result",payload.user)

				io.local.emit(`notification${payload.user}`, result[0])
			}
			})

			
			break;
			

			
			default:
			break;
		}

	})

	subClient.on("error", (err) => {
		console.log(err);
	});


server.listen(5050, () => { console.log('App listening on port 5050') })