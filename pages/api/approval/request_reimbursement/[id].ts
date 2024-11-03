import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";


export async function getData(data: number) {
    let list = await model.reimburseImages(data);
    return list
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        const session: any = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({ message: "Unauthorized!" })
        }

        if (req.method !== 'GET') {
            return res.status(403).json({ message: "Forbidden!" })
        }

        const id: any = req.query.id
        const data = await getData(id)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler)