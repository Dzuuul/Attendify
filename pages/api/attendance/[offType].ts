import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";

interface attdOff {
    offType: any
}

export async function getData(param: attdOff) {
    const datas: any = await model.chkClockType(param.offType); 
    const sendparam: any = {
        dayLimit: datas[0].day_limit == null ? 0 : datas[0].day_limit,
        tipe: datas[0].tipe
    };
    return sendparam
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

        const {offType} = req.query

        let params = {
            offType
        } as attdOff

        const data = await getData( params )

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler);
