import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../../lib/auth";
import * as model from "../_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import moment from "moment"
import { ISession } from 'interfaces/common.interface';

interface IPagination {
    month: string | any
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
    department: string
    company: string
    startDate?: string | any
    endDate?: string | any
}

export const enumerateDays = async (startDate: any, endDate: any, isWeekday?: boolean, isDayoff?: boolean) => {
    let now = startDate
    const dates = [];

    if (isWeekday) {
        const weekend = [0,6]
        const start = moment(startDate).format('YYYY-MM-DD');
        const end = moment(endDate).format('YYYY-MM-DD');
        const findDayOff = await model.totalDayoffMonthly(start, end)
        const dayOff = findDayOff[0].date ? findDayOff[0].date : [];  
             
        while (now.isSameOrBefore(endDate)) {
            if (!weekend.includes(now.day()) && (!dayOff.includes(now.format('YYYY-MM-DD')))){
                dates.push(now.format('YYYY-MM-DD'));
            }
            now.add(1, 'days');
        }
        return dates;
    }

    if (isDayoff) {
        const weekend = [0,6]
        const start = moment(startDate).format('YYYY-MM-DD');
        const end = moment(endDate).format('YYYY-MM-DD');
        const findDayOff = await model.totalDayoffMonthly(start, end)
        const dayOff = findDayOff[0].date ? findDayOff[0].date : [];
        
        while (now.isSameOrBefore(endDate)) {
            if (weekend.includes(now.day()) && (!dayOff.includes(now.format('YYYY-MM-DD')))) {
                dates.push(now.format('YYYY-MM-DD'))
            }
            now.add(1, 'days');
        }

        const total = dayOff.length + dates.length;
        return total;
    }
    
    while (now.isSameOrBefore(endDate)) {
        dates.push(now.format('YYYY-MM-DD'));
        now.add(1, 'days');
    }
    return dates;
};

export async function getData(employeeId: string, month: string, session: ISession) {
    const start = moment(month).startOf('month')
    const end = moment(month).endOf('month')
        
    const startDate = moment(start).format('YYYY-MM-DD')
    const endDate = moment(end).format('YYYY-MM-DD')

    const mapQry = await enumerateDays(start, end)

    let coalesce = ""
    let left = ""
    let group = ""

    for(let n = 0; n < mapQry.length; n++) {
        coalesce += `COALESCE("${mapQry[n]}"."duration", 0) AS "${mapQry[n]}"`
        group += `"${mapQry[n]}"."duration", "${mapQry[n]}"."work_hour"`
        left += `LEFT JOIN (
            SELECT "employeeId", "work_hour",
                (
                    (
                        DATE_PART('day', check_out - "work_hour") * 24 +
                        DATE_PART('hour', check_out - "work_hour")
                    ) * 60 +
                    DATE_PART('minute', check_out - "work_hour")
                ) * 60 +
                    DATE_PART('second', check_out - "work_hour") AS "duration"
            FROM
                attendance
            LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id
            LEFT JOIN (
                SELECT id, (check_in + INTERVAL '1 hour') AS "work_hour" FROM attendance
            ) A ON attendance.id = A.id
            WHERE
                DATE(check_in) = '${mapQry[n]}' AND mst_request_type.tipe = 1
            GROUP BY "employeeId", check_out, check_in, "work_hour"
        ) AS "${mapQry[n]}" ON "${mapQry[n]}"."employeeId" = B.id `
        
        if(n !== mapQry.length - 1) {
            coalesce += ', '
            group += ', '
        }
    }
    const checkGetLastDayBiggerThanToday: boolean = end > moment()

    const list: any = await model.listMonthly(Number(employeeId), startDate, endDate, coalesce, left, group, checkGetLastDayBiggerThanToday);

    let series: any = []
    let categories: any = []
    Object.keys(list[0]).forEach((key, idx) => {
        categories.push(key)
        series.push(Math.floor(list[0][key] % (60*60*24) / 3600))
    })

    return {
        series,
        categories
    }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        const session = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({message: "Unauthorized!"})
        }

        if (req.method !== 'GET') {
            return res.status(403).json({message: "Forbidden!"})
        }

        const {empId, periode} = req.query

        if(empId != '0') {
            let data = await getData(empId as string, periode as string, session)
            return res.json(data)
        } else {
            let data: any = []
            return res.json(data)
        }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export default protectAPI(handler);