require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Field = require("../models/Field");
const Booking = require("../models/Booking");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const Player = require("../models/Player");
const Match = require("../models/Match");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected for seed");

    // reset DB
    await Booking.deleteMany({});
    await Match.deleteMany({});
    await Player.deleteMany({});
    await Team.deleteMany({});
    await Tournament.deleteMany({});
    await Field.deleteMany({});
    await User.deleteMany({});

    // ======================
    // USERS
    // ======================
    const francesca = await User.create({
      username: "francesca",
      password: await bcrypt.hash("123", 10),
      name: "Francesca",
      surname: "Craievich"
    });

    const marco = await User.create({
      username: "marco",
      password: await bcrypt.hash("123", 10),
      name: "Marco",
      surname: "Ferrari"
    });

    // ======================
    // FIELDS
    // ======================
const [field1, field2, field3] = await Field.create([
  {
    name: "Victory Field",
    sport: "football",
    address: "Via Garibaldi 5, Milano",
    slots: ["09:00", "10:00", "11:00", "12:00"]
  },
  {
    name: "Sunrise Court",
    sport: "volleyball",
    address: "Corso Buenos Aires 14, Milano",
    slots: ["09:00", "10:00", "11:00", "12:00"]
  },
  {
    name: "Golden Dome",
    sport: "basketball",
    address: "Viale Monza 8, Milano",
    slots: ["09:00", "10:00", "11:00", "12:00"]
  }
]);

    // ======================
    // BOOKINGS
    // ======================
    await Booking.create([
      {
        field: field1._id,
        user: francesca._id,
        date: "2026-05-01",
        slot: "10:00"
      },
      {
        field: field2._id,
        user: marco._id,
        date: "2026-05-01",
        slot: "11:00"
      }
    ]);

    // ======================
    // FRANCESCA'S TOURNAMENT
    // ======================
    const tournament1 = await Tournament.create({
      name: "Spring Cup 2026",
      sport: "football",
      maxTeams: 4,
      startDate: "2026-06-15",
      creator: francesca._id
    });

    const [t1a, t1b, t1c, t1d] = await Team.create([
      { name: "Roses FC", tournament: tournament1._id },
      { name: "Storm FC", tournament: tournament1._id },
      { name: "Blaze FC", tournament: tournament1._id },
      { name: "Wave FC", tournament: tournament1._id }
    ]);

    await Player.create([
      { name: "Sara",      surname: "Esposito", jerseyNumber: 9,  team: t1a._id },
      { name: "Laura",     surname: "Moretti",  jerseyNumber: 10, team: t1b._id },
      { name: "Alessia",   surname: "Fontana",  jerseyNumber: 7,  team: t1c._id },
      { name: "Valentina", surname: "Costa",    jerseyNumber: 11, team: t1d._id }
    ]);

    // ======================
    // MARCO'S TOURNAMENT
    // ======================
    const tournament2 = await Tournament.create({
      name: "City League 2026",
      sport: "basketball",
      maxTeams: 4,
      startDate: "2026-07-01",
      creator: marco._id
    });

    const [t2a, t2b, t2c, t2d] = await Team.create([
      { name: "Eagles",  tournament: tournament2._id },
      { name: "Bulls",   tournament: tournament2._id },
      { name: "Hawks",   tournament: tournament2._id },
      { name: "Wolves",  tournament: tournament2._id }
    ]);

    await Player.create([
      { name: "Luca",    surname: "Martini",  jerseyNumber: 5,  team: t2a._id },
      { name: "Davide",  surname: "Romano",   jerseyNumber: 8,  team: t2b._id },
      { name: "Matteo",  surname: "Greco",    jerseyNumber: 14, team: t2c._id },
      { name: "Giorgio", surname: "Conti",    jerseyNumber: 23, team: t2d._id }
    ]);

    console.log("Seed completed.");
    console.log("Login:");
    console.log("francesca / 123");
    console.log("marco / 123");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
