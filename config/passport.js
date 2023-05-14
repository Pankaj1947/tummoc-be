const JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;
const opts = {};
const UserModel = require("./database");
const passport = require("passport");

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_KEY;

passport.use(
  new JwtStrategy(opts, function (jwt_payload, done) {
    UserModel.findOne({ id: jwt_payload.id }, function (err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
        // or you could create a new account
      }
    });
  })
);

const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"],
    },
    function (accessToken, refreshToken, profile, callback) {
      callback(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// const GoogleStrategy = require("passport-google-oauth20").Strategy;

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID:
//         "612637490150-1dc6s3nc3jt7le16s0o5f3llv999gvre.apps.googleusercontent.com",
//       clientSecret: "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",
//       callbackURL: "http://localhost:8080/auth/callback",
//     },
//     function (accessToken, refreshToken, profile, cb) {
//       console.log(accessToken, profile);
//       UserModel.findOne({ googleId: profile.id }, (err, user) => {
//         if (err) return cb(err, null);
//         if (!user) {
//           let newUser = new UserModel({
//             googleId: profile.id,
//             name: profile.displayName,
//           });

//           newUser.save();
//           return cb(null, newUser);
//         } else {
//           return cb(null, user);
//         }
//       });
//     }
//   )
// );

// //Persists user data inside session
// passport.serializeUser(function (user, done) {
//   done(null, user.id);
// });

// //Fetches session details using session id
// passport.deserializeUser(function (id, done) {
//   UserModel.findById(id, function (err, user) {
//     done(err, user);
//   });
// });
