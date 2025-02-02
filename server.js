const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const app = express();
const port = process.env.PORT || 3000;
const MYSECRETJWTKEY = "mysecret";

const users = {}; // some sort of database
const highScores = []; // Store high scores

const optionsForJwtValidation = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: MYSECRETJWTKEY,
};

passport.use(
  new JwtStrategy(optionsForJwtValidation, (payload, done) => {
    if (!users[payload.userHandle]) {
      return done(null, false);
    }
    return done(null, payload);
  })
);

app.use(passport.initialize());
app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

// Your solution should be written here

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;
  if (!userHandle || !password || userHandle.length < 6 || password.length < 6) {
    return res.status(400).send("Invalid request body");
  }
  users[userHandle] = { password };
  res.status(201).send("User registered successfully");
});

app.post("/login", (req, res) => {
  const { userHandle, password, ...additionalFields } = req.body;

  if (!userHandle || !password || Object.keys(additionalFields).length > 0 ||
    typeof userHandle !== "string" || typeof password !== "string") {
    return res.status(400).send("Bad Request");
  } else if (!users[userHandle] || users[userHandle].password !== password) {
    return res.status(401).send("Invalid username or password");
  }
  // Generate JWT token
  const jsonWebToken = jwt.sign({ userHandle }, MYSECRETJWTKEY, { expiresIn: "1h" });
  res.status(200).json({ jsonWebToken });
});

app.post(
  "/high-scores",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { level, userHandle, score, timestamp } = req.body;

    // Validate request body
    if (
      !level ||
      !userHandle ||
      !score ||
      !timestamp ||
      typeof level !== "string" ||
      typeof userHandle !== "string" ||
      typeof score !== "number" ||
      isNaN(Date.parse(timestamp))
    ) {
      return res.status(400).send("Invalid request body");
    }

    // Ensure the user posting the score matches the authenticated user
    if (req.user.userHandle !== userHandle) {
      return res.status(401).send("Unauthorized: UserHandle mismatch");
    }

    // Store high score
    highScores.push({ level, userHandle, score, timestamp });

    res.status(201).send("High score posted successfully");
  }
);

app.get("/high-scores", (req, res) => {
  const { level, page } = req.query;

  // Validate level query parameter
  if (!level || typeof level !== "string") {
    return res.status(400).send("Level is required and must be a string");
  }

  // Filter scores for the requested level
  const scoresForLevel = highScores.filter((score) => score.level === level);

  // Sort scores in descending order (highest first)
  scoresForLevel.sort((a, b) => b.score - a.score);

  // Pagination setup
  const pageSize = 20;
  const pageNumber = parseInt(page) || 1;
  const startIndex = (pageNumber - 1) * pageSize;
  const paginatedScores = scoresForLevel.slice(startIndex, startIndex + pageSize);

  res.status(200).json(paginatedScores);
});


//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
