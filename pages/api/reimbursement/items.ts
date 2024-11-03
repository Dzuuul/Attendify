import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import {paginationPSQL} from "@lib/helper";
import { IPagination } from 'interfaces/reimbursement.interface';
import {titleCase} from '../master';

export async function getItems(id: any) {
    try {
        const decryp: any = JSON.parse(Buffer.from(id, 'base64').toString('ascii'))
        const items = await model.reimburseItems(decryp)
        return items
     } catch (err) {
        return {
            error: {
                type: 'error',
                message: 'error',
                description: 'ERROR'
            }
        }
    }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        const session: any = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({ message: "Unauthorized!" })
        }

        if (req.method !== 'POST') {
            return res.status(403).json({ message: "Forbidden!" })
        }

        const id = req.body.data

        const data = await getItems(id)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler)