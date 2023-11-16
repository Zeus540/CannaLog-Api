const express = require('express')
const logout = require("./logout")
const verify = require("./verify")
const login = require("./login")
const register = require("./register")
const plants = require("./plants")
const environments = require("./environments")
const irrigation_types = require("./irrigation_types")
const nutrients = require("./nutrients")
const training_techniques = require("./training_techniques")
const growers = require("./growers")
const measurement_units = require("./measurement_units")
const notes = require("./notes")
const notifications = require("./notifications")

const router = express.Router()

 router.use(function (req, res, next) {
     const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
     console.log(req.path + " " + userIP)
     next();
 });

router.use("/login", login);
router.use("/register", register);
router.use("/plants", plants);
router.use("/environments", environments);
router.use("/irrigation_types", irrigation_types);
router.use("/nutrients", nutrients);
router.use("/training_techniques", training_techniques);
router.use("/growers", growers);
router.use("/notes", notes);
router.use("/user", notifications);
router.use("/logout", logout);
router.use("/verify", verify);
router.use("/measurement_units", measurement_units);

module.exports = router