import express, { urlencoded } from "express";
import dotenv from "dotenv";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoutes.js";
import postRoute from "./routes/postRoutes.js";
import notificationRoute from "./routes/notificationRoute.js";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import cors from "cors";
import path from "path";

const app = express();
const __dirname = path.resolve()

app.use(cors({
  origin : "http://localhost:3000",
  credentials : true
}));
app.use(urlencoded({
  extended : true
}))
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const PORT = process.env.PORT;
app.use(express.json({
  limit : "5mb"
}));
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/notifications", notificationRoute);

// app.get("/", (req, res) => {
//   res.send("Hello World ..!");
// });

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname,"/frontend/build")))
  app.use("*",(req, res) => {
    res.sendFile(path.resolve(__dirname,"frontend","build","index.html"))
  })
}

app.listen(PORT, () => {
  console.log("Server is running on Port", PORT);
  connectDB();
});
