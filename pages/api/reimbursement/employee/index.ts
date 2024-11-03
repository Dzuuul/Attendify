import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../../lib/auth";
import * as model from "../_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import moment from 'moment';
import { IPagination } from "../../../../interfaces/reimbursement.interface";
import { paginationPSQL } from '@lib/helper';

export const getRemainingReimburseDisplay = async (empId: number) => {
        const allowance = await model.allowanceReimburse(empId)

        // const reimSep = await model.reimburseSeparator()

        // const reSep = reimSep.length < 1 ? 10 : reimSep[0].value

        const rg1 = new Date(`${moment().startOf('month').format("YYYY-MM-DD")} 00:00:00`)

        const rg2 = new Date(`${moment().endOf('month').format("YYYY-MM-DD")} 23:59:59`)

        let onPgrs

        let prevReimburse = []
        let prv: number = 0
        let prvPrc: number = 0
        let count = 0

        prevReimburse = await model.previousReimburse(empId, moment(rg1).format("YYYY-MM-DD HH:mm:ss"), moment(rg2).format("YYYY-MM-DD HH:mm:ss"))

        for(let x = 0; x < prevReimburse.length;x++) {
            prv += parseInt(prevReimburse[x].counts)
        }

        onPgrs = await model.previousReimburseProcessedAll(empId, moment(rg1).format("YYYY-MM-DD HH:mm:ss"), moment(rg2).format("YYYY-MM-DD HH:mm:ss"))

        for(let x = 0; x < onPgrs.length;x++) {
            prvPrc += parseInt(onPgrs[x].counts)
        }

        if((prvPrc + prv) > allowance[0].saldo_pengobatan) {
            count = 0
        } else {
            count = allowance[0].saldo_pengobatan - (prvPrc + prv)
        }

    let datas =  {
        allowed: count,
        processed: onPgrs,
        dateRg: `${moment(rg1).format("Do MMMM YYYY")} - ${moment(rg2).format("Do MMMM YYYY")}`
    }

    return datas
}

export async function getData(param: IPagination) {
    const employeeId = param.employeeId
    const row = param.row ? Number(param.row) : 10
    const page = param.page ? Number(param.page) : 0
    const key = param.key ? param.key : ""
    const direction = param.direction ? param.direction : ""
    const column = param.column ? param.column : ""
    const startDate = param.startDate ? param.startDate : ""
    const endDate = param.endDate ? param.endDate : ""
    const isApproved = param.isApproved ? param.isApproved : ""
    
    let params = {
        employeeId,
        isApproved,
        startDate,
        endDate,
        row,
        limit: 0,
        key,
        direction,
        column
    } as IPagination

    const total: any = await model.countListById(params);

    const paginations = await paginationPSQL(page, row, total[0]? total[0].counts : 0);
    params.limit = paginations.query

    let list = await model.listById(params);
    return {
        dataPerPage: paginations.dataPerPage,
        currentPage: paginations.currentPage,
        totalData: paginations.totalData,
        totalPage: paginations.totalPage,
        data: list,
        key: null
    }
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

        const {row, key, direction, column, page, employeeId, isApproved, startDate, endDate} = req.query

        let params = {
            row,
            key,
            direction,
            column,
            page,
            employeeId,
            startDate,
            endDate,
            isApproved
        } as IPagination

        const data = await getData(params)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler)