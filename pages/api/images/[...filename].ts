import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
const appRoot = require("app-root-path");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  let img: any = req.query.filename ? req.query.filename : null;
  const imagePath = img.join("/");
  const filePath = path.resolve(".", `${appRoot}/../public/${imagePath}`);
  const imageBuffer = fs.readFileSync(filePath);
  res.setHeader("Content-Type", "image/jpg");
  return res.send(imageBuffer);
}
