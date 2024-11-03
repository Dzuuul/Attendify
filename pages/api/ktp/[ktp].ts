import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";

export async function getData(ktp: string) {
    const code = ktp ? ktp : ''
    if(code.length < 16) {
        return {
            error: {
              type: "error",
              message: "Bad KTP Format",
              description: "Error",
            },
          };
    } else {
        const parsing = await model.parsingIdentity(code)
        return parsing
    }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        const session = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({ message: "Unauthorized!" })
        }

        if (req.method !== 'GET') {
            return res.status(403).json({ message: "Forbidden!" })
        }

        const ktp = req.query.ktp

        const data = await getData(ktp.toString())

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler)