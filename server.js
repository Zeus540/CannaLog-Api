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

let channel = "SweetLeaf"

const pubClient = createClient({ url: 'redis://95.111.252.42:6379' });
const subClient = pubClient.duplicate();

pubClient.connect()
subClient.connect()

const io = new Server(server, {
	cors: {
		origin: true,
		credentials: true
	},
	cookie: {
		httpOnly: true // Enable HTTP-only cookies
	  }
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
app.set('json spaces', 5)
app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerFile))


//Websocket Connections
io.on('connection', (socket, req) => {
	

	const yourCookieValue = socket.request.headers.cookie
	.split(';')
	.map(cookie => cookie.trim())
	.find(cookie => cookie.startsWith('session'));
	
	let jwt_token = yourCookieValue.split("=")[1]

	jwt.verify(jwt_token, process.env.TOKEN_REFRESH_SECRET, async (err, user) => {
		
		let sql = `
		UPDATE users
		SET is_logged_in = 1
		WHERE user_id = ?`
			db.query(sql, [await user.user_id], (err, result, fields) => {
				if (err) {
					console.log(err)

				} else {
					console.log(user.user_name,'connected');
				}
			})
	})
	

	//Redis Subscribe 
	subClient.subscribe(channel, (payload) => {
		payload = JSON.parse(payload)
		switch (payload.type) {
			case "add_environment":

			let sql = `
			SELECT environments.environment_id,environments.name,environments.description,environments.light_exposure,environments.cover_img,environments.creation_date,environments.last_updated,environment_types.environment_type_name,environment_types.environment_type_id,length,width,height
			FROM environment_types
			JOIN environments ON environments.environment_type_id = environment_types.environment_type_id
			WHERE environments.environment_id = ?
			`
				db.query(sql, [payload.data], (err, result, fields) => {
					if (err) {
						console.log(err)

					} else {
						socket.emit("environment_add",result[0])
					
					}
				})
			
				break;
				
			case "environment_edited":
				console.log('environment_edited')
				let sql_edited = `
				SELECT environments.environment_id,environments.name,environments.description,environments.light_exposure,environments.cover_img,environments.creation_date,environments.last_updated,environment_types.environment_type_name,environment_types.environment_type_id,length,width,height
				FROM environment_types
				JOIN environments ON environments.environment_type_id = environment_types.environment_type_id
				WHERE environments.environment_id = ?
				`
					db.query(sql_edited, [payload.data], (err, result, fields) => {
						if (err) {
							console.log(err)
	
						} else {
							console.log(err,result[0])
							socket.emit("environment_edited",result[0])
						
						}
					})
				
					break;
			
			case "environment_deleted":

				let sql_select_environments = `
				SELECT environments.environment_id,environments.name,environments.description,environments.light_exposure,environments.cover_img,environments.creation_date,environments.last_updated,environment_types.environment_type_name,environment_types.environment_type_id,length,width,height
				FROM environment_types
				JOIN environments ON environments.environment_type_id = environment_types.environment_type_id
				WHERE environments.user_id = ?
				`
			console.log("payload.user.user_id",payload.user.user_id)
				db.query(sql_select_environments, [payload.user.user_id], (err, result, fields) => {
				if (err) {
					console.log(err)
			
				} else {
					socket.emit("environment_deleted",result)
				
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

	socket.on('disconnect', () => {

		const yourCookieValue = socket.request.headers.cookie
		.split(';')
		.map(cookie => cookie.trim())
		.find(cookie => cookie.startsWith('session'));
		
		let jwt_token = yourCookieValue.split("=")[1]

		jwt.verify(jwt_token, process.env.TOKEN_REFRESH_SECRET, async (err, user) => {
			
			let sql = `
			UPDATE users
			SET is_logged_in = 0
			WHERE user_id = ?`
				db.query(sql, [await user.user_id], (err, result, fields) => {
					if (err) {
						console.log(err)

					} else {
						console.log(user.user_name,'disconnected');
					}
				})
		})
		
	
	});
})


server.listen(9954,()=>{console.log('App listening on port 9954')})


