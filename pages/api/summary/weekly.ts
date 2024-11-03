import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "@lib/auth";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import { titleCase } from '../../../lib/helper'
import moment from "moment"
import { ISession } from 'interfaces/common.interface';

interface IPagination {
    week: string | any
    month: string | any
    startDate?: any
    endDate?: any
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
    department?: string
    company?: string
}

const enumerateDays = async (startDate: any, endDate: any, isWeekday?: boolean, isDayoff?: boolean) => {
    let now = startDate, dates = [];

    if (isWeekday) {
        const weekend = [0,6]
        const start = moment(startDate).format('YYYY-MM-DD');
        const end = moment(endDate).format('YYYY-MM-DD');
        const findDayOff = await model.totalDayoffWeekly(start, end)
        const dayOff = findDayOff[0].date ? findDayOff[0].date : [];       
        while (now.isSameOrBefore(endDate)) {
            if (!weekend.includes(now.day()) && (!dayOff.includes(now.format('DD')))){
                dates.push({txt: now.format('dddd'), date: now.format("YYYY-MM-DD"), num: now.format('DD')});
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
        const dayOff = findDayOff[0].date ? findDayOff[0].date : []

        while (now.isSameOrBefore(endDate)) {
            if (weekend.includes(now.day()) && (!dayOff.includes(now.format('YYYY-MM-DD')))) {
                dates.push({txt: now.format('dddd'), date: now.format("YYYY-MM-DD"), num: now.format('DD')});
            }
            now.add(1, 'days');
        }

        const total = dayOff.length + dates.length;
        return total;
    }
    
    while (now.isSameOrBefore(endDate)) {
        dates.push({txt: now.format('dddd'), date: now.format("YYYY-MM-DD"), num: now.format('DD')});
        now.add(1, 'days');
    }
    return dates;
};

const percentage = (totalEmp: number, weekday: number, value: number) => {
    const result = Math.round((value / (totalEmp * weekday)) * 100);
    const displayName = `${value} (${result}%)`;
    return displayName
}

async function getTotalEmp(param: IPagination, session: ISession) {
    const totalEmp = await model.totalEmployee(param, session);
    return totalEmp.length > 0 ? totalEmp[0].row_count : 0
}

async function getTotalAtt(param: IPagination, session: ISession) {    
    const totalAtt = await model.totalAttendance(param, session);    
    return totalAtt.length > 0 ? totalAtt[0].row_count : 0
}

async function getTotalAbsent(param: IPagination, session: ISession) {
    const now = moment();
    const startDate = moment(param.startDate);
    let endDate = moment(param.endDate);
    if (endDate.isSameOrAfter(now)) {
        endDate = now;
    }
    
    const mapQry = await enumerateDays(startDate, endDate, true);
    const totalEmp = await getTotalEmp(param, session);
    const totalAtt = await getTotalAtt(param, session);
    const totalLeave = await getTotalLeave(param); 
    const totalSickLeave = await getTotalSickLeave(param);

    const totalAbs = (mapQry.length * totalEmp) - totalAtt - totalLeave - totalSickLeave;
    return totalAbs < 0 ? 0 : totalAbs;
}

async function getTotalDet(param: IPagination) {
    const mapQry = await enumerateDays(moment(param.startDate), moment(param.endDate))

    let sumLate = ""
    let sumEarly = ""
    let sumNoCheck = ""
    let qry = ""
    let comp = `AND B."companyId" = ${param.company}`
    let dept = `AND B."deptId" = ${param.department}`

    for(let n = 0; n < mapQry.length; n++) {
        sumLate += `COALESCE(${mapQry[n].txt}."late",0)`
        sumEarly += `COALESCE(${mapQry[n].txt}."early",0)`
        sumNoCheck += `COALESCE(${mapQry[n].txt}."noCheckOut",0)`
        qry += `(SELECT 
            SUM(CASE WHEN (A.check_in)::time > '08:00' THEN 1 ELSE 0 END) AS "late", 
            SUM(CASE WHEN (A.check_out)::time < '17:00' THEN 1 ELSE 0 END) AS "early",
            SUM(CASE WHEN A.check_out is null THEN 1 ELSE 0 END) AS "noCheckOut"
            FROM attendance A
            JOIN mst_employee B on A."employeeId" = B.id
            WHERE B."deptId" < 7 ${param.company ? comp : ""} ${param.department ? dept : ""} AND DATE(A.created_at) = '${mapQry[n].date}') AS ${mapQry[n].txt}`

        if(n !== mapQry.length - 1) {
            sumLate += '+ '
            sumEarly += '+ '
            sumNoCheck += '+ '
            qry += ', '
        }
    }

    const total = await model.totalDet(sumLate, sumEarly, sumNoCheck, qry);
    return total.length > 0 ? total[0] : []
}

async function getTotalDayoff(param: IPagination) {
    const mapQry = await enumerateDays(moment(param.startDate), moment(param.endDate), false, true)
    return mapQry
}

async function getTotalLeave(param: IPagination) { 
    const now = moment();
    const startDate = moment(param.startDate);
    let endDate = moment(param.endDate);
    
    const mapQry = await enumerateDays(startDate, endDate, true)
    
    let sum = ""
    let qry = ""
    let dept = `AND B."deptId" = ${param.department}`
    let comp = `AND B."companyId" = ${param.company}`

    for(let n = 0; n < mapQry.length; n++) {
        sum += `COALESCE("${mapQry[n].date}".ROW_COUNT,0)`
        qry += `(SELECT COUNT(1) AS ROW_COUNT 
            FROM attendance A
            JOIN mst_employee B ON A."employeeId" = B.id
            JOIN mst_request_type C ON A.check_type = C.id
            WHERE 1=1 AND (C.tipe = 2 OR C.tipe = 3) AND A.check_type != 9 ${param.department ? dept : ""} ${param.company ? comp : ""}
            AND DATE(A.created_at) = '${mapQry[n].date}'
            ) AS "${mapQry[n].date}"`
        if(n !== mapQry.length - 1) {
            sum += '+ '
            qry += ', '
        }
    }
    const totalLeave = await model.totalLeaveMonthly(sum, qry);
    return totalLeave.length > 0 ? totalLeave[0].SUM : 0
}

async function getTotalSickLeave(param: IPagination) { 
    const now = moment();
    const start = moment(param.startDate);
    let end = moment(param.endDate);
    if (end.isAfter(now)) {
        end = now;
    }
    
    const mapQry = await enumerateDays(start, end, true)
    
    let sum = ""
    let qry = ""
    let dept = `AND B."deptId" = ${param.department}`
    let comp = `AND B."companyId" = ${param.company}`

    for(let n = 0; n < mapQry.length; n++) {
        sum += `COALESCE("${mapQry[n].date}".ROW_COUNT,0)`
        qry += `(SELECT COUNT(1) AS ROW_COUNT 
            FROM attendance A
            JOIN mst_employee B ON A."employeeId" = B.id
            JOIN mst_request_type C ON A.check_type = C.id
            WHERE 1=1 AND (C.tipe = 2 OR C.tipe = 3) AND A.check_type = 9 ${param.department ? dept : ""} ${param.company ? comp : ""}
            AND DATE(A.created_at) = '${mapQry[n].date}'
            ) AS "${mapQry[n].date}"`
        if(n !== mapQry.length - 1) {
            sum += '+ '
            qry += ', '
        }
    }
    const totalLeave = await model.totalLeaveMonthly(sum, qry);
    return totalLeave.length > 0 ? totalLeave[0].SUM : 0
}

async function getTotalDayWork(param: IPagination) { 
    const start = moment(param.startDate);
    const end = moment(param.endDate);
    
    const mapQry = await enumerateDays(start, end, true);
    return mapQry.length;
}

export async function getData(param: IPagination, session: ISession) {
    const key = param.key ? param.key : ""
    const direction = param.direction ? param.direction : ""
    const column = param.column ? param.column : ""
    const week = param.week ? param.week : moment().format("YYYY-MM-DD")
    const department = param.department ? param.department : ""
    const company = param.company ? param.company : ""

    const start = moment(week, "YYYY-MM-DD").startOf('week');
    const end = moment(week, "YYYY-MM-DD").endOf('week');  
    const startDate = moment(start).format("YYYY-MM-DD");
    const endDate = moment(end).format("YYYY-MM-DD");

    let params = {
        week,
        key: key.toUpperCase(),
        direction,
        column,
        startDate,
        endDate,
        department,
        company,
    } as IPagination 

    const totalEmp = await getTotalEmp(params, session);
    const totalDayWork = await getTotalDayWork(params);
    const totalAtt = await getTotalAtt(params, session);
    const totalAbs = await getTotalAbsent(params, session);
    const totalDet = await getTotalDet(params);
    const totalDayoff = await getTotalDayoff(params);
    const totalLeave = await getTotalLeave(params);
    const totalSickLeave = await getTotalSickLeave(params);
    
    if (totalDet.length < 1) {
        totalDet.push ({
            sumLate: 0,
            sumEarly: 0,
            sumNoCheck: 0
        })
    }
    
    const mapQry = await enumerateDays(start, end)
    let coalesce = ""
    let qry = ""
    let left = ""
    let group = ""

    for(let n = 0; n < mapQry.length; n++) {
        coalesce += `COALESCE("${mapQry[n].date}"."duration", 0)`
        qry += `SUM(CASE WHEN DATE(A.created_at) = '${mapQry[n].date}' THEN (A.check_type) ELSE 0 END) AS "${mapQry[n].date}"`
        group += `"${mapQry[n].date}"."duration"`
        left += `
            LEFT JOIN (
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
                LEFT JOIN (
                    SELECT id, (check_in + INTERVAL '1 hour') AS "work_hour" FROM attendance
                ) A ON attendance.id = A.id
                WHERE
                    DATE(created_at) = '${mapQry[n].date}'
            ) AS "${mapQry[n].date}" ON "${mapQry[n].date}"."employeeId" = B.id 
        `
        
        if(n !== mapQry.length - 1) {
            coalesce += ' + '
            qry += ', '
            group += ', '
        }
    }

    const checkGetLastDayBiggerThanToday: boolean = end > moment()

    //const isWeekday = await enumerateDays(moment(startDate), param.endDate ? (checkGetLastDayBiggerThanToday ? moment() : moment(param.endDate)) : moment(), true)
    const isWeekday = await enumerateDays(moment(startDate), end ? moment(end) : moment(), true)
    const weekday = isWeekday.length;
    const total_dayoff = await enumerateDays(moment(startDate), moment(endDate), false, true)

    const list: any = await model.listMonthly(params, coalesce, qry, weekday, total_dayoff, left, group, checkGetLastDayBiggerThanToday);
    const tabling: any = []

    tabling.push({
        key: 'number',
        title: "No.",
        dataIndex: "number",
        sorter: true
    })

    tabling.push({
        key: 'fullname',
        title: "Fullname",
        dataIndex: "fullname",
        sorter: true,
        red: false,
        width: 5,
    })

    if (list.length > 0) {
        const filterData = Object.keys(list[0]).filter((item: any) => item !== 'id')
        const weekeend = [0,6]
        const startDate = moment(param.startDate).startOf('week');
        const findDayOff = await model.totalDayoffMonthly(params.startDate, params.endDate)
        const dayOff = findDayOff[0].date ? findDayOff[0].date : [];

        filterData.map((item: any, indx: any) => {
            if (item != "fullname" && item != "number" && item != "totalAtt" && item != "totalAbs" && item != "duration" && item != "totalDayOff" && item != "totalCuti" && item != "totalSakit" && item != "totalIzin") {
                tabling.push({
                    key: indx,
                    title: titleCase(item),
                    dataIndex: item,
                    red: weekeend.includes(startDate.day()) || dayOff.includes(item) ? true : false
                })
                startDate.add(1,'days')
            }
        })
    }

    tabling.push({
        key: 'duration',
        title: "Total Work Hour",
        dataIndex: "duration",
        sorter: true
    })

    tabling.push({
        title: 'Summary',
        children: [
            {
                key: 'totalAtt',
                title: "H",
                dataIndex: "totalAtt",
                sorter: true   
            },
            {
                key: 'totalDayOff',
                title: "DO",
                dataIndex: "totalDayOff",
                sorter: true
            },
            {
                key: 'totalAbs',
                title: "A",
                dataIndex: "totalAbs",
                sorter: true
            },
            {
                key: 'totalCuti',
                title: "C",
                dataIndex: "totalCuti",
                sorter: true
            },
            {
                key: 'totalSakit',
                title: "S",
                dataIndex: "totalSakit",
                sorter: true
            },
            {
                key: 'totalIzin',
                title: "I",
                dataIndex: "totalIzin",
                sorter: true
            },
        ]
    });

    if (mapQry.length < 1) {
        tabling.push({
            key: '5',
            title: "Columns",
            dataIndex: "columns",
            sorter: true
        })
    }

    return {
        tabling: tabling,
        data: list,
        sum_emp: totalEmp,
        sum_att: percentage(totalEmp, totalDayWork, totalAtt),
        sum_abs: percentage(totalEmp, totalDayWork, totalAbs),
        sum_late: totalDet.sumLate,
        sum_early: totalDet.sumEarly,
        sum_NoCheck: totalDet.sumNoCheck,
        sum_dayoff: totalDayoff,
        sum_leave: percentage(totalEmp, totalDayWork, totalLeave),
        sum_SickLeave: percentage(totalEmp, totalDayWork, totalSickLeave),
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

        const {key, direction, column, week, department, company} = req.query

        let params = {
            key,
            direction,
            column,
            week, 
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