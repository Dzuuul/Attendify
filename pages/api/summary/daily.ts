import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "@lib/auth";
import { pagination } from "@lib/helper";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import { titleCase } from '../../../lib/helper'
import moment from 'moment';
import { ISession } from 'interfaces/common.interface';
import { enumerateDays } from "./monthly"

interface IPagination {
    day: string | any
    startDate?: string
    endDate?: string
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
    department: string
    company: string
}

const percentage = (totalEmp: number, weekday: number, value: number) => {
    const result = Math.round((value / (totalEmp * weekday)) * 100);
    const displayName = `${value} (${result}%)`;
    return displayName
}

async function getTotalEmp(param: IPagination, session: ISession) {
    const totalEmp = await model.totalEmployee(param, session);
    return totalEmp.length > 0 ? totalEmp[0].row_count : 0
}

async function getTotalAtt(param: IPagination, session: ISession, totalEmp: number, totalDayWork: number) {
    const totalAtt = await model.totalAttendance(param, session);
    const total: number = totalAtt.length > 0 ? totalAtt[0].row_count : 0;
    return percentage(totalEmp, totalDayWork, total)
}

async function getTotalAbsent(param: IPagination, session: ISession) {
    const totalAbs = await model.totalAbsentDaily(param, session);
    return totalAbs.length > 0 ? totalAbs[0].row_count : 0
}

async function getTotalDet(param: IPagination, session: ISession) {
    const total = await model.totalDetDaily(param, session);
    return total.length > 0 ? total[0] : []
}

async function getTotalLeave(param: IPagination, session: ISession, totalEmp: number, totalDayWork: number) { 
    const totalLeave = await model.totalLeave(param, session);
    const total =  totalLeave.length > 0 ? totalLeave[0].row_count : 0;
    return percentage(totalEmp, totalDayWork, total)
}

async function getTotalSickLeave(param: IPagination, session: ISession, totalEmp: number, totalDayWork: number) { 
    const totalSickLeave = await model.totalSickLeave(param, session);
    const total =  totalSickLeave.length > 0 ? totalSickLeave[0].row_count : 0;
    return percentage(totalEmp, totalDayWork, total)
}

async function getTotalDayWork(param: IPagination) { 
    const month = moment(param.startDate);
    const start = moment(month).startOf('month');
    const end = moment(month).endOf('month');
    
    const mapQry = await enumerateDays(start, end, true);
    return mapQry.length;
}

export async function getData(param: IPagination, session: ISession) {
    const key = param.key ? param.key : ""
    const direction = param.direction ? param.direction : ""
    const column = param.column ? param.column : ""
    const startDate = param.day ? param.day : moment().format("YYYY-MM-DD")
    const department = param.department ? param.department : ""
    const company = param.company ? param.company : ""

    let params = {
        startDate,
        key: key.toUpperCase(),
        direction,
        column,
        department,
        company
    } as IPagination

    const totalEmp = await getTotalEmp(params, session);
    const totalDayWork = await getTotalDayWork(params);
    const totalAtt = await getTotalAtt(params, session, totalEmp, totalDayWork);
    const totalAbs = await getTotalAbsent(params, session);
    const totalDet = await getTotalDet(params, session);
    const totalLeave = await getTotalLeave(params, session, totalEmp, totalDayWork);
    const totalSickLeave = await getTotalSickLeave(params, session, totalEmp, totalDayWork);

    if (!totalDet.sumLate) {
        totalDet.sumLate = 0;
    }
    if (!totalDet.sumEarly) {
        totalDet.sumEarly = 0;
    }
    if (!totalDet.sumNoCheck) {
        totalDet.sumNoCheck = 0;
    }
    
    if (totalDet.length < 1) {
        totalDet.push ({
            sumLate: 0,
            sumEarly: 0,
            sumNoCheck: 0
        })
    }

    const list: any = await model.list(params, session);

    const tabling: any = [];

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
        sum_emp: totalEmp,
        sum_att: totalAtt,
        sum_abs: totalAbs,
        sum_late: totalDet.sumLate,
        sum_early: totalDet.sumEarly,
        sum_NoCheck: totalDet.sumNoCheck,
        sum_dayoff: 0,
        sum_leave: totalLeave,
        sum_SickLeave: totalSickLeave,
        sum_DayWork: totalDayWork,
        // 19 Jul 24
        sum_total_att: 0,
        sum_total_abs: 0,
        sum_total_lea: 0,
        sum_total_silea: 0,
        sum_total_dw_ae: 0,

        sum_total_att_pe: 0,
        sum_total_abs_pe: 0,
        sum_total_lea_pe: 0,
        sum_total_silea_pe: 0,
        sum_total_dw_pe: 0,

        sum_total_att_pm: 0,
        sum_total_abs_pm: 0,
        sum_total_lea_pm: 0,
        sum_total_silea_pm: 0,
        sum_total_dw_pm: 0,
        //
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

        const {key, direction, column, day, department, company} = req.query

        let params = {
            key,
            direction,
            column,
            day,
            department,
            company
        } as IPagination

        if (params.company == "undefined" || params.company == "null") {
            params.company = ""
        }
        if (params.department == "undefined" || params.department == "null") {
            params.department = ""
        }
        
        const data = await getData(params, session)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

export default protectAPI(handler);
