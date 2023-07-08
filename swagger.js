const swaggerAutogen = require('swagger-autogen')()
require('dotenv').config()


const doc = {

    info: {
        version: "1.0.0",
        title: "Sweet Leaf API",
        contact:{
            "name": "Creator",
            "url": "https://zaheerroberts.co.za",
            "email": "zaheerroberts4@gmail.com"
        },
       
        description: "Set of API endpoints for recalling and manipulating the data relating to Sweet Leaf"
    },
    host: process.env.SWAGGER_URL,
    basePath: "/",
    schemes: ['https',"http"],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
        {
            "name": "Auth",
            
        },
        {
            "name": "User",
            
        },
        {
            "name": "Journals",
       
        },
        {
            "name": "Harvested Journals",
        },
        {
            "name": "Strains",
        
        },
        {
            "name": "Grow Techniques",
         
        },
        {
            "name": "Nutrients",
            
        },
        {
            "name": "Smell Profiles",
            
        },
        {
            "name": "Journal Data",
            
        },
        {
            "name": "Journal Weeks",
            
        },
        {
            "name": "Journal Week Information",
            
        },
        {
            "name": "Journal Days",
        },
        {
            "name": "Journal Notes",
        },
   
        {
            "name": "Germination Methods",
        },
       
        
    ],
    securityDefinitions: {
        apiKeyAuth:{
            type: "apiKey",
            in: "cookie",       // can be "header", "query" or "cookie"
            name: "session user",  // name of the header, query parameter or cookie
            description: "any description..."
        }
    },
    definitions: {
      
    }
}

const outputFile = './swagger-output.json'
const endpointsFiles = ['./server']

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    require('./server')           // Your project's root file
})