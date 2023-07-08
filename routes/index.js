const express = require('express')
const logout = require("./logout")
const verify = require("./verify")
const test = require("./test")
const login = require("./login")
const register = require("./register")
const plants = require("./plants")
const environments = require("./environments")
const irrigation_types = require("./irrigation_types")

const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://95.111.252.42:6379' });
const subClient = pubClient.duplicate();

pubClient.connect()
subClient.connect()

const router = express.Router()

// Make io accessible to our router
router.use(function (req, res, next) {
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(req.path + userIP)

    req.subClient = subClient;
    req.pubClient = pubClient
    next();
});

router.use("/login", login);
router.use("/register", register);
router.use("/plants", plants);
router.use("/environments", environments);
router.use("/irrigation_types", irrigation_types);

router.use("/logout", logout);
router.use("/verify", verify);
router.use("/test", test);

module.exports = router