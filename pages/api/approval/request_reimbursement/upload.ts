import { NextApiRequest, NextApiResponse } from 'next';
import { getLoginSession } from "@lib/auth";
import { exeQuery, } from "@lib/db";
import nc from "next-connect";
import multer from "multer";
import path from "path";

const appRoot = require("app-root-path")

export type SuccessfulResponse<T> = { data: T; error?: never; statusCode?: number };
export type UnsuccessfulResponse<E> = { data?: never; error: E; statusCode?: number };

export type ApiResponse<T, E = unknown> = SuccessfulResponse<T> | UnsuccessfulResponse<E>;

interface NextConnectApiRequest extends NextApiRequest {
    files: Express.Multer.File[];
}

type ResponseData = ApiResponse<string[], string>;
export const config = {
    api: {
        bodyParser: false,
    },
};
const handler = nc({
    onError(error, req: NextConnectApiRequest, res: NextApiResponse<ResponseData>) {
      res.status(501).json({ error: `Sorry something Happened! ${error.message}` });
    },
    onNoMatch(req: NextConnectApiRequest, res: NextApiResponse<ResponseData>) {
      res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
    },
  });

function checkFileType(file: any, cb: any) {
    // const filetypes = /xls|xlsx|csv|vnd.openxmlformats-officedocument.spreadsheetml.sheet|vnd.ms-excel/; //alowed ext
    const filetypes = /png|jpg|jpeg|webp/; //alowed ext
    //check ext
    const extname = filetypes.test(path.extname((file.originalname).replace(/\s/g, "")).toLowerCase());
    //check mime
    const mimetype = filetypes.test(file.mimetype);

    //check if ext is true
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Extension Support PNG/JPEG/JPG"));
    }
}

let storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        cb(null, `${appRoot}/../public/reimbursement/`);
    },
    filename: function (req: any, file: any, cb: any) {
        const files: string = (file.originalname).replace(/\s/g, "");
        cb(null, + Date.now() + files);
    },
});

let upload = multer({
    storage: storage
});

let uploadFile = upload.single("file");
handler.use(uploadFile);
handler.post(async (req: any, res: any) => {
    const session = await getLoginSession(req)
    let url = "/api/reimbursement/"
    let id = req.body.id === 0 ? null : req.body.id
    let receipt_date = req.body.receipt_date
    let amount = req.body.amount
    let description = req.body.description
    let filename = req.file === undefined ? null : url + req.file.filename

    if(id === '0' || id === 'undefined') {
        let result: any = await exeQuery(`INSERT INTO reimburse (receipt_date, amount, description, filename, "employeeId") VALUES ($1,$2,$3,$4,$5)`, [
            receipt_date, amount, description, filename, session?.emp
        ]);
        res.status(200).send({
            result: result
        }); 
    } else {
        if(filename === null) {
            let result: any = await exeQuery("UPDATE reimburse SET receipt_date = $1, amount = $2, description = $3, updated_at = current_timestamp WHERE id = $4", [
                receipt_date, amount, description, id 
            ]);
            res.status(200).send({
                result: result
            });
        } else {
            let result: any = await exeQuery("UPDATE reimburse SET receipt_date = $1, amount = $2, description = $3, picture =$4, updated_at = current_timestamp WHERE id = $5", [
                receipt_date, amount, description, filename, id 
            ]);
            res.status(200).send({
                result: result
            });
        }
    }
});

export default handler;