const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
// const connectDB = require("./config/db");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// const mongoose = require("mongoose");

const app = express();
// connectDB();

//Init Middleware
app.use(express.json({ extended: false }));
app.use(morgan("combined"));

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("DATABASE CONNECTED");
  });

app.use(cors());

//Define Routes
//app.use("url", require("path of the file you want to render"))

// app.get("/", (req, res) => res.send("API RUNNING"));

app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/posts", require("./routes/api/posts"));
app.use("/api/users", require("./routes/api/users"));

// Serve static assests, if in production
if (process.env.NODE_ENV === "production") {
  //set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`SERVER WORKING ON ${port}`));
