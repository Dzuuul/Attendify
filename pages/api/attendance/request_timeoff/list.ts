import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../../lib/auth";
import { pagination } from "../../../../lib/helper";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import { IPagination } from "../../../../interfaces/request_timeoff.interface";

export async function getData(param: IPagination) {
    param.employeeId = param.employeeId ? param.employeeId : ""
    if (param.employeeId == "" || param.employeeId == null) {
        return []
    }

    const datas: any = await model.list(param);
    return datas
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

        const {row, key, direction, column, page, employeeId, startDate, endDate} = req.query

        let params = {
            row,
            key,
            direction,
            column,
            page,
            employeeId,
            startDate,
            endDate
        } as IPagination

        const data = await getData( params )

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler);
