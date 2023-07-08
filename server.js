

const { createPool } = require('mysql')
const bodyParser = require('body-parser');
require('dotenv').config()
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require('cors')
const cookieParser = require('cookie-parser')
const app = express();
const httpServer = createServer(app);
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger-output.json')
const router = require('./routes')
const db = require('./lib/db');
const { ca } = require('date-fns/locale');


let channel = "SweetLeaf"

const pubClient = createClient({ url: 'redis://95.111.252.42:6379' });
const subClient = pubClient.duplicate();

pubClient.connect()
subClient.connect()

const io = new Server(httpServer, {
	cors: {
		origin: true,
		credentials: true
	}
});

io.adapter(createAdapter(pubClient, subClient));

const corsConfig = {
	origin: true,
	credentials: true,
	allowedHeaders: "Content-Type, Authorization, X-Request_With",
};

app.use(cors(corsConfig));
app.use(cookieParser());
app.use(express.static('./images'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json());
app.use(router)
app.set('json spaces', 5)
app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerFile))



//Websocket Connections
io.on('connection', (socket, req) => {
	console.log("new user connected", socket.id)

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
			default:
				break;
		}

	})

	socket.on('disconnect', () => {
		console.log('user disconnected');

	});
})




subClient.on("error", (err) => {
	console.log(err);
});

//

httpServer.listen(9954)
console.log('App listening on port 9954')


