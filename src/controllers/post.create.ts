import * as dotenv from "dotenv";
dotenv.config();
import { Router, Request, Response } from "express";
import { redisClient } from "../server";
import { ClickHouse } from "clickhouse";
const router = Router();
let counter: number = 0;
const ch = new ClickHouse({
  url: process.env.CHURL || "http://localhost",
  port: parseInt(process.env.CHPORT!) || 8123,
});
const queries = [
  `CREATE DATABASE IF NOT EXISTS test_db`,
  `CREATE TABLE IF NOT EXISTS customers (
      id UUID,
      date Date,
      name String,
      middlename String,
      surname String
  ) ENGINE = MergeTree(date, (id, name, middlename, surname), 8192)`,
  `CREATE TABLE IF NOT EXISTS employees (
    id UUID,
    date Date,
    name String,
    middlename String,
    surname String
) ENGINE = MergeTree(date, (id, name, middlename, surname), 8192)`,
  `SELECT (*) FROM customers`,
  `SELECT (*) FROM employees`,
];

queries.forEach(async (element) => {
  return await ch.query(element).toPromise();
});

router.post("/create/:table", async (req: Request, res: Response) => {
  const table = req.params.table;
  req.body.table = table;
  if (table === "customers" || table === "employees") {
    redisClient.set(counter.toString(), JSON.stringify(req.body));
    redisClient.get(counter.toString(), (error, string) => {
      counter++;
      if (counter === parseInt(process.env.MAXBUFFER!)) syncTables();
      return res.json(JSON.parse(string));
    });
  }
});
const syncTables = () => {
  redisClient.keys("*", (error, keys) => {
    redisClient.mget(keys, (error, array) => {
      const customersValue = (
        name: string,
        middleName: string,
        surname: string
      ): string => {
        return `(generateUUIDv4(), now(), '${name}', '${middleName}', '${surname}')`;
      };
      let valuesCustomersArray: string[] = [];
      let valuesEmployeesArray: string[] = [];
      if (!array) {
        clearInterval(interval);
        interval = setInterval(
          syncTables,
          parseInt(process.env.SYNCTIMER!) || 100000
        );
        console.log("nothing to sync");
        return;
      }
      array.forEach((string) => {
        const person = JSON.parse(string);
        const { name, middlename, surname } = person;
        if (person.table === "customers") {
          return valuesCustomersArray.push(
            customersValue(name, middlename, surname)
          );
        }
        if (person.table === "employees") {
          valuesEmployeesArray.push(customersValue(name, middlename, surname));
        }
        return;
      });
      if (valuesCustomersArray.length !== 0) {
        ch.query(
          `INSERT INTO customers(id, date, name, middlename, surname) VALUES ${valuesCustomersArray.join(
            ", "
          )}`
        )
          .toPromise()
          .then((rows) => {
            console.log("customers synced");
          });
      }
      if (valuesEmployeesArray.length !== 0) {
        ch.query(
          `INSERT INTO employees(id, date, name, middlename, surname) VALUES ${valuesEmployeesArray.join(
            ", "
          )}`
        )
          .toPromise()
          .then((rows) => {
            console.log("employees synced");
          });
      }
      redisClient.flushall((err) => {
        clearInterval(interval);
        interval = setInterval(
          syncTables,
          parseInt(process.env.SYNCTIMER!) || 100000
        );
      });
    });
  });
};

let interval = setInterval(
  syncTables,
  parseInt(process.env.SYNCTIMER!) || 100000
);

export default router;
