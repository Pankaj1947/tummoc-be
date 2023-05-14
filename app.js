const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const { hash, compare } = require("bcrypt");
const UserModel = require("./config/database");
const jwt = require("jsonwebtoken");
const passport = require("passport");
dotenv.config({ path: "./src/config/.env" });
const cookieSession = require("cookie-session");
const session = require("express-session");

// app.use(
//   cookieSession({
//     name: "session",
//     keys: ["cyberwolve"],
//     maxAge: 24 * 60 * 60 * 1000,
//   })
// );
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // Add any additional configuration options as needed
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 3000;

require("./config/passport");

app.get("/", (req, res) => {
  res.send({ message: "Welcome to our tummoc backend" });
});

app.post("/signup", async (req, res) => {
  try {
    const existingUser = await UserModel.findOne({ email: req.body.email });
    if (existingUser) {
      return res.send({ message: "user already registered" });
    }

    const hashedPassword = await hash(req.body.password, 10);

    const user = new UserModel({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    res.send({
      success: true,
      message: "User created successfully.",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (err) {
    console.log("err: ", err);
    res.send({
      success: false,
      message: "Something went wrong",
      error: err,
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });

    // No user found
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "Could not find the user.",
      });
    }

    // Incorrect password
    const isPasswordValid = await compare(req.body.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({
        success: false,
        message: "Invalid Credential",
      });
    }

    const payload = {
      email: user.email,
      id: user._id,
    };

    const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "1d" });

    return res.status(200).send({
      success: true,
      message: "Logged in successfully!",
      token: "Bearer " + token,
      userDetails: {
        name: user.name,
        email: user.email,
        id: user._id,
      },
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error: err,
    });
  }
});

app.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = await UserModel.findById(req.user._id);

      if (!user) {
        return res.status(404).send({
          success: false,
          message: "User not found.",
        });
      }

      return res.status(200).send({
        success: true,
        user: {
          id: user._id,
          email: user.email,
        },
      });
    } catch (err) {
      return res.status(500).send({
        success: false,
        message: "Something went wrong",
        error: err,
      });
    }
  }
);
// passport-google-oauth20


// function generateToken(user) {
//   // Create a payload with user information
//   const payload = {
//     id: user.id,
//     email: user.email,
//     // Add any other relevant user data to the payload
//   };

//   // Generate the JWT token with the payload
//   const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

//   return token;
// }


// app.post("/api/verify-token", async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ error: true, message: "Token not provided" });
//   }

//   try {
//     // Verify the token and extract the payload
//     const payload = jwt.verify(token, process.env.JWT_SECRET);

//     // Find the user based on the payload data (e.g., user ID)
//     // Replace this with your logic to find the user in your database
//     const user = await UserModel.findById(payload.id);

//     if (!user) {
//       return res.status(404).json({ error: true, message: "User not found" });
//     }

//     // Token is valid, return the user data
//     return res.status(200).json({ success: true, user });
//   } catch (error) {
//     return res.status(401).json({ error: true, message: "Invalid token" });
//   }
// });



app.get("/auth/login/success", (req, res) => {
  if (req.user) {
    res.status(200).json({
      error: false,
      message: "Successfully Logged In",
      user: req.user,
    });
  } else {
    res.status(403).json({ error: true, message: "Not Authorized" });
  }
});

app.get("/auth/login/failed", (req, res) => {
  res.status(401).json({
    error: true,
    message: "Log in failure",
  });
});

app.get("/auth/google", passport.authenticate("google", ["profile", "email"]));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: process.env.CLIENT_URL,
    failureRedirect: "/login/failed",
  }),
//   (req, res) => {
//     // Generate JWT token
//     const token = generateToken(req.user);

//     // Redirect to the frontend URL with the token as a query parameter
//     res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}`);
//   }
);

app.get("/", (req, res) => {
  req.logout();
  res.redirect(process.env.CLIENT_URL);
});


app.listen(PORT, () => {
  console.log(`server start at ${PORT}`);
});
