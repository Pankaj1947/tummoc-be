const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });
mongoose.set("strictQuery", false);

const url = process.env.DATABASE;

mongoose
  .connect(url)
  .then(() => console.log("Database successfully connect"))
  .catch((err) => console.log("error", err));

const userSchema = mongoose.Schema({
  name:String,
  email: String,
  password: String,
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
