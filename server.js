require("dotenv").config()
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); 

const userRoutes = require("./routes/userRoute")

const app = express();

app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies

app.use(
 cors({
	 origin:"https://next-front-auth.vercel.app",
	 methods:["POST","GET","PUT","DELETE"],
	 allowedHeaders: ["Content-Type"],
	 credentials:true
 })
)

app.get("/", (req, res) => {
  res.send("Backend deployed successfully..........");
});


app.use('/api/users',userRoutes)

//DB connection
const PORT = process.env.PORT || 5000;

// DB connection and server start
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Database connected and server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Database connection failed:`, error.message);
  });;
