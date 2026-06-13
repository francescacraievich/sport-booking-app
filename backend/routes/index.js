const express = require("express");
const router = express.Router(); // main router

// authentication management (login, registration)
const authRoutes = require("./auth");

// sports field management (list, details, bookings)
const fieldRoutes = require("./fields");

// user management (user list + user detail)
const userRoutes = require("./users");

// team and player search
const searchRoutes = require("./search");

// tournament management (creation, editing, details, teams)
const tournamentRoutes = require("./tournaments");

// match management (schedule, results)
const matchRoutes = require("./matches");

// attach all routes
router.use(authRoutes);
router.use(fieldRoutes);
router.use(userRoutes);
router.use(searchRoutes);
router.use(tournamentRoutes);
router.use(matchRoutes);

module.exports = router;
