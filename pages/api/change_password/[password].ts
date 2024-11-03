import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import { verifyPwrd } from "../../../lib/helper";

export async function getData(value: string, id: number) {
    const old_pass = value ? value : ''
    if(old_pass.length < 8 || old_pass.length > 8) {
        return {
            error: {
              type: "error",
              message: "Password must be 8 characters",
              description: "Error",
            },
          };
    } else {
        const getHash = await model.findHash(id);

        if (getHash.length < 1) {
            return {
                error: {
                  type: "error",
                  message: "Error",
                  description: "Error",
                },
            };
        }
        
        const data = await verifyPwrd(value, getHash[0].password)
        return data
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

        const old_pass = req.query.password
        const data = await getData(old_pass.toString(), session.emp)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler)