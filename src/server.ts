import express from "express";
import * as dotenv from "dotenv";
import bodyParser from "body-parser";
import redis from "redis";
import cors from "cors";
import postRouter from "./controllers/post.create";
import getRouter from "./controllers/get.table"
dotenv.config();
export const redisClient = redis.createClient({
  host: "127.0.0.1" || process.env.REDISIP,
  port: 6379 || Number(process.env.REDISPORT),
});
const app = express();
app.use(cors({ origin: "*" }));
app.use(
  bodyParser.urlencoded({
    parameterLimit: 100000,
    limit: "100mb",
    extended: true,
  })
);
app.use(bodyParser.json());
app.use("/", postRouter, getRouter);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
