import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import moment from 'moment';
import { ISession } from 'interfaces/common.interface';

export async function getData(start: any, end: any, type: any, session: ISession) {
    const startDate = start ? moment(start).format('YYYY-MM-DD') : "";
    const endDate = end ? moment(end).format('YYYY-MM-DD') : "";
    const datas: any = await model.checkReqAtt(startDate, endDate, type, session);
    return datas
}

export async function getAttendance(start: any, end: any, session: ISession) {
    const startDate = start ? moment(start).format('YYYY-MM-DD') : "";
    const endDate = end ? moment(end).format('YYYY-MM-DD') : "";
    const datas: any = await model.checkAtt(startDate, endDate, session); 
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
        
        const { check, start, end, type } = req.query

        const data = check === 'request' ? await getData( start, end, type, session ) : check === 'attendance' ? await getAttendance( start, end, session ) : [];

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler);
