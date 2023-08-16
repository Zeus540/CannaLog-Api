const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
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


const pubClient = createClient({ url: 'redis://95.111.252.42:6380' });
const subClient = pubClient.duplicate();

pubClient.connect()
subClient.connect()

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

app.locals.pubClient = pubClient

const corsConfig = {
	origin: true,
	credentials: true,
	allowedHeaders: "Content-Type, Authorization, X-Request_With",
};

app.use(cors(corsConfig));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json());
app.use(router)
app.set('json spaces', 2)
app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerFile))


//Websocket Connections
io.on('connection', (socket, req) => {


	 const yourCookieValue = socket.request.headers.cookie
	 	?.split(';')
	 	?.map(cookie => cookie.trim())
	 	?.find(cookie => cookie.startsWith('session'));

	 let jwt_token = yourCookieValue?.split("=")[1]
	 
	 if (jwt_token !== undefined) {
	 	jwt.verify(jwt_token, process.env.TOKEN_REFRESH_SECRET, async (err, user) => {

	 		let sql = `
	 	UPDATE users
	 	SET is_logged_in = 1
	 	WHERE user_id = ?`
	 		db.query(sql, [await user?.user_id], (err, result, fields) => {
	 			if (err) {
	 				console.log(err)

	 			} else {
	 				console.log(user?.user_name, 'connected');
	 			}
	 		})
	 	})
	 }

	//Redis Subscribe 
	subClient.subscribe(process.env.CHANNEL, (payload) => {

		payload = JSON.parse(payload)

		switch (payload.type) {
			case "add_environment":

			let sql = `
			SELECT environments.environment_id,environments.environment_name,environments.environment_description,environments.environment_light_exposure,environments.environment_cover_img,environments.creation_date,environments.last_updated,environment_types.environment_type_name,environment_types.environment_type_id,environment_length,environment_width,environment_height
			FROM environment_types
			JOIN environments ON environments.environment_type_id = environment_types.environment_type_id
			WHERE environments.environment_id = ?
			`
				db.query(sql, [payload.data], (err, result, fields) => {
					if (err) {
						console.log(err)

					} else {
						io.emit(`environment_added${payload.user.user_id}`, result[0])

					}
				})

				break;

			case "environment_edited":
				console.log('environment_edited')
				let sql_edited = `
				SELECT environments.environment_id,environments.environment_name,environments.environment_description,environments.environment_light_exposure,environments.environment_cover_img,environments.creation_date,environments.last_updated,environment_types.environment_type_name,environment_types.environment_type_id,environment_length,environment_width,environment_height
				FROM environment_types
				JOIN environments ON environments.environment_type_id = environment_types.environment_type_id
				WHERE environments.environment_id = ?
				`
				db.query(sql_edited, [payload.data], (err, result, fields) => {
					if (err) {
						console.log(err)

					} else {
						console.log(err, result[0])
						io.emit(`environment_edited${payload.user.user_id}`, result[0])

					}
				})

				break;

			case "environment_deleted":
			socket.emit(`environment_deleted${payload.user.user_id}`, payload.id)
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
						socket.emit(`action_taken${payload.plant_id}`, result)
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
					socket.emit(`stage_changed${payload.plant_id}`, result[0])
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
				socket.emit(`note_added${payload.plant_id}`, result[0])
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
				socket.emit(`image_added${payload.plant_id}`, result[0])
			}
			})
		
			break;
			
			case "action_deleted":
			socket.emit(`action_deleted${payload.plant_id}`, payload)
			break;



			
			default:
			break;
		}

	})

	subClient.on("error", (err) => {
		console.log(err);
	});

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


server.listen(10000, () => { console.log('App listening on port 10000') })


