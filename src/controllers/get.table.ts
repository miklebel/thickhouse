import * as dotenv from "dotenv";
dotenv.config();
import { Router, Request, Response } from "express";
import { redisClient } from "../server";
import { ClickHouse } from "clickhouse";
const router = Router();
let counter: number = 0;
const ch = new ClickHouse({
  url: process.env.CHURL || "http://localhost",
  port: Number(process.env.CHPORT) || 8123,
});

router.get("/tables", async (req: Request, res: Response) => {
  let buffer: string[] = [];
  redisClient.keys("*", async (error, keys) => {
    redisClient.mget(keys, (error, array) => {
      if (array) {
        const bufferArray = array;
        bufferArray.forEach((element) => {
          const item = JSON.parse(element);
          buffer.push(JSON.parse(element));
        });
        return;
      }
    });
  });
  const customers = await ch.query(`SELECT (*) FROM customers`).toPromise();
  const employees = await ch.query(`SELECT (*) FROM employees`).toPromise();
  res.json({ customers: customers, employees: employees, buffer: buffer });
});

export default router;
