import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "@lib/auth";
import { pagination } from "@lib/helper";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
// import { IForm } from "../../../interfaces/employees.interface";
import { titleCase } from '../../../lib/helper'
import moment from 'moment';

interface IPagination {
    day: string | any
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
}

export async function getTotalEmp() {
    const totalEmp = await model.totalEmployee();
    return totalEmp.length > 0 ? totalEmp[0].row_count : 0
}

export async function getTotalAtt(param: IPagination) {
    const startDate = param.day ? param.day : moment().format("YYYY-MM-DD")
    const totalAtt = await model.totalAttendance(startDate, "");
    return totalAtt.length > 0 ? totalAtt[0].row_count : 0
}

export async function getTotalAbsent(param: IPagination) {
    const startDate = param.day ? param.day : moment().format("YYYY-MM-DD")
    const totalAbs = await model.totalAbsentDaily(startDate, "");
    return totalAbs.length > 0 ? totalAbs[0].row_count : 0
}

export async function getTotalDet(day: string, type: string) {
    const days = day ? day : moment().format("YYYY-MM-DD")
    const total = await model.totalDetDaily(days);
    
    if (total.length > 0) {
        if (type === "late") {
            return total[0].lateIn
        }
        if (type === "early") {
            return total[0].earlyOut
        }
        if (type === "noCheck") {
            return total[0].noCheckOut
        }
    }
    
    return 0
}

export async function getData(param: IPagination) {
    const key = param.key ? param.key : ""
    const direction = param.direction ? param.direction : ""
    const column = param.column ? param.column : ""
    const day = param.day ? param.day : ""

    let params = {
        day,
        key: key.toUpperCase(),
        direction,
        column
    } as IPagination

    const list: any = await model.list(params);

    const tabling: any = [
        // item.dataIndex === 'check_in' || item.dataIndex === 'check_out' ?
        // (x: string) => x ? `${moment(x).format('HH:mm:ss')}` : 'DNC' :
    ]

    list.length > 0 ? Object.keys(list[0]).filter((item: any) => item !== 'id').map((item: any, indx: any) => 
        tabling.push({
        key: indx,
        title: titleCase(item),
        dataIndex: item,
        sorter: true
        })
    ) : tabling.push({
        key: '5',
        title: "Columns",
        dataIndex: "columns",
        sorter: true
        })

    return {
        tabling: tabling,
        data: list,
        key: null
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

        const {key, direction, column, day} = req.query

        let params = {
            key,
            direction,
            column,
            day
        } as IPagination

        const data = await getData(params)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

export default protectAPI(handler);
