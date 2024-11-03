import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
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

const percentage = (totalEmp: number, weekday: number, value: number) => {
    const result = Math.round((value / (totalEmp * weekday)) * 100);
    const displayName = `${value} (${result}%)`;
    return displayName
}

export async function getTotalEmp(param: IPagination, session: ISession) {
    const totalEmp = await model.totalEmployee(param, session);
    return totalEmp.length > 0 ? totalEmp[0].row_count : 0
}

export async function getTotalEmpNoHeader(param: IPagination, session: ISession) {
    const totalEmp = await model.totalEmployeeNoHeader(param, session);
    return totalEmp.length > 0 ? totalEmp[0].row_count : 0
}

export async function getTotalAtt(param: IPagination) { 
    const now = moment();
    const startDate = moment(param.startDate);
    let endDate = moment(param.endDate);
    if (endDate.isSameOrAfter(now)) {
        endDate = now;
    }
    
    const mapQry = await enumerateDays(startDate, endDate)
    
    let sum = ""
    let qry = ""
    let dept = `AND B."deptId" = ${param.department}`
    let comp = `AND B."companyId" = ${param.company}`

    for(let n = 0; n < mapQry.length; n++) {
        sum += `COALESCE("${mapQry[n]}".ROW_COUNT,0)`
        qry += `(SELECT COUNT(1) AS ROW_COUNT 
            FROM attendance A
            JOIN mst_employee B ON A."employeeId" = B.id
            JOIN mst_request_type C ON A.check_type = C.id
            WHERE 1=1 AND C.tipe = 1 ${param.department ? dept : ""} ${param.company ? comp : ""}
            AND DATE(A.created_at) = '${mapQry[n]}'
            ) AS "${mapQry[n]}"`
        if(n !== mapQry.length - 1) {
            sum += '+ '
            qry += ', '
        }
    }
    const totalAtt = await model.totalAttendanceMonthly(sum, qry);
    return totalAtt.length > 0 ? totalAtt[0].SUM : 0
}

export async function getTotalAttNoHeader(param: IPagination) { 
    const now = moment();
    const startDate = moment(param.startDate);
    let endDate = moment(param.endDate);
    if (endDate.isSameOrAfter(now)) {
        endDate = now;
    }
    
    const mapQry = await enumerateDays(startDate, endDate)
    
    let sum = ""
    let qry = ""
    let dept = `AND B."deptId" = ${param.department}`
    let comp = `AND B."companyId" = ${param.company}`

    for(let n = 0; n < mapQry.length; n++) {
        sum += `COALESCE("${mapQry[n]}".ROW_COUNT,0)`
        qry += `(SELECT COUNT(1) AS ROW_COUNT 
            FROM attendance A
            JOIN (SELECT * FROM mst_employee WHERE id NOT IN (77, 64, 71, 20, 11, 62, 65, 46, 63, 6) AND status = 1) B ON A."employeeId" = B.id
            JOIN mst_request_type C ON A.check_type = C.id
            WHERE 1=1 AND C.tipe = 1 ${param.department ? dept : ""} ${param.company ? comp : ""}
            AND DATE(A.created_at) = '${mapQry[n]}'
            ) AS "${mapQry[n]}"`
        if(n !== mapQry.length - 1) {
            sum += '+ '
            qry += ', '
        }
    }
    const totalAtt = await model.totalAttendanceMonthly(sum, qry);
    return totalAtt.length > 0 ? totalAtt[0].SUM : 0
}

export async function getTotalAbsent(param: IPagination, session: ISession) {
    const now = moment();
    const startDate = moment(param.startDate);
    let endDate = moment(param.endDate);
    if (endDate.isSameOrAfter(now)) {
        endDate = now;
    }
    
    const mapQry = await enumerateDays(startDate, endDate, true);
    const totalEmp = await getTotalEmp(param, session);
    const totalAtt = await getTotalAtt(param);
    const totalLeave = await getTotalLeave(param); 
    const totalSickLeave = await getTotalSickLeave(param);

    const totalAbs = (mapQry.length * totalEmp) - totalAtt - totalLeave - totalSickLeave;
    return totalAbs
}

export async function getTotalAbsentNoHeader(param: IPagination, session: ISession) {
    const now = moment();
    const startDate = moment(param.startDate);
    let endDate = moment(param.endDate);
    if (endDate.isSameOrAfter(now)) {
        endDate = now;
    }
    
    const mapQry = await enumerateDays(startDate, endDate, true);
    const totalEmp = await getTotalEmpNoHeader(param, session);
    const totalAtt = await getTotalAttNoHeader(param);
    const totalLeave = await getTotalLeaveNoHeader(param); 
    const totalSickLeave = await getTotalSickLeaveNoHeader(param);

    const totalAbs = (mapQry.length * totalEmp) - totalAtt - totalLeave - totalSickLeave;
    return totalAbs
}

async function getTotalDet(param: IPagination) {
    const month = param.month ? param.month : moment().format("YYYY-MM-DD")
    const start = moment(param.startDate);
    const end = moment(param.endDate);

    const mapQry = await enumerateDays(start, end)

    let sumLate = ""
    let sumEarly = ""
    let sumNoCheck = ""
    let qry = ""
    let comp = `AND B."companyId" = ${param.company}`
    let dept = `AND B."deptId" = ${param.department}`

    for(let n = 0; n < mapQry.length; n++) {
        sumLate += `COALESCE("${mapQry[n]}"."late",0)`
        sumEarly += `COALESCE("${mapQry[n]}"."early",0)`
        sumNoCheck += `COALESCE("${mapQry[n]}"."noCheckOut",0)`
        qry += `(SELECT 
            SUM(CASE WHEN (A.check_in)::time > '08:00' THEN 1 ELSE 0 END) AS "late", 
            SUM(CASE WHEN (A.check_out)::time < '17:00' THEN 1 ELSE 0 END) AS "early",
            SUM(CASE WHEN A.check_out is null THEN 1 ELSE 0 END) AS "noCheckOut"
            FROM attendance A
            JOIN mst_employee B on A."employeeId" = B.id
            WHERE B."deptId" < 7 ${param.company ? comp : ""} ${param.department ? dept : ""} AND DATE(A.created_at) = '${mapQry[n]}') AS "${mapQry[n]}"`

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
    const start = moment(param.startDate);
    const end = moment(param.endDate);

    const mapQry = await enumerateDays(start, end, false, true)

    return mapQry
}

export async function getTotalLeave(param: IPagination) { 
    const now = moment();
    const startDate = moment(param.startDate);
    let endDate = moment(param.endDate);
    
    const mapQry = await enumerateDays(startDate, endDate, true)
    
    let sum = ""
    let qry = ""
    let dept = `AND B."deptId" = ${param.department}`
    let comp = `AND B."companyId" = ${param.company}`

    for(let n = 0; n < mapQry.length; n++) {
        sum += `COALESCE("${mapQry[n]}".ROW_COUNT,0)`
        qry += `(SELECT COUNT(1) AS ROW_COUNT 
            FROM attendance A
            JOIN mst_employee B ON A."employeeId" = B.id
            JOIN mst_request_type C ON A.check_type = C.id
            WHERE 1=1 AND (C.tipe = 2 OR C.tipe = 3) AND A.check_type != 9 ${param.department ? dept : ""} ${param.company ? comp : ""}
            AND DATE(A.created_at) = '${mapQry[n]}'
            ) AS "${mapQry[n]}"`
        if(n !== mapQry.length - 1) {
            sum += '+ '
            qry += ', '
        }
    }
    const totalLeave = await model.totalLeaveMonthly(sum, qry);
    return totalLeave.length > 0 ? totalLeave[0].SUM : 0
}

export async function getTotalLeaveNoHeader(param: IPagination) { 
    const now = moment();
    const startDate = moment(param.startDate);
    let endDate = moment(param.endDate);
    
    const mapQry = await enumerateDays(startDate, endDate, true)
    
    let sum = ""
    let qry = ""
    let dept = `AND B."deptId" = ${param.department}`
    let comp = `AND B."companyId" = ${param.company}`

    for(let n = 0; n < mapQry.length; n++) {
        sum += `COALESCE("${mapQry[n]}".ROW_COUNT,0)`
        qry += `(SELECT COUNT(1) AS ROW_COUNT 
            FROM attendance A
            JOIN (SELECT * FROM mst_employee WHERE id NOT IN (77, 64, 71, 20, 11, 62, 65, 46, 63, 6) AND status = 1) B ON A."employeeId" = B.id
            JOIN mst_request_type C ON A.check_type = C.id
            WHERE 1=1 AND (C.tipe = 2 OR C.tipe = 3) AND A.check_type != 9 ${param.department ? dept : ""} ${param.company ? comp : ""}
            AND DATE(A.created_at) = '${mapQry[n]}'
            ) AS "${mapQry[n]}"`
        if(n !== mapQry.length - 1) {
            sum += '+ '
            qry += ', '
        }
    }
    const totalLeave = await model.totalLeaveMonthly(sum, qry);
    return totalLeave.length > 0 ? totalLeave[0].SUM : 0
}

export async function getTotalSickLeave(param: IPagination) { 
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
        sum += `COALESCE("${mapQry[n]}".ROW_COUNT,0)`
        qry += `(SELECT COUNT(1) AS ROW_COUNT 
            FROM attendance A
            JOIN mst_employee B ON A."employeeId" = B.id
            JOIN mst_request_type C ON A.check_type = C.id
            WHERE 1=1 AND (C.tipe = 2 OR C.tipe = 3) AND A.check_type = 9 ${param.department ? dept : ""} ${param.company ? comp : ""}
            AND DATE(A.created_at) = '${mapQry[n]}'
            ) AS "${mapQry[n]}"`
        if(n !== mapQry.length - 1) {
            sum += '+ '
            qry += ', '
        }
    }
    const totalLeave = await model.totalLeaveMonthly(sum, qry);
    return totalLeave.length > 0 ? totalLeave[0].SUM : 0
}

export async function getTotalSickLeaveNoHeader(param: IPagination) { 
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
        sum += `COALESCE("${mapQry[n]}".ROW_COUNT,0)`
        qry += `(SELECT COUNT(1) AS ROW_COUNT 
            FROM attendance A
            JOIN (SELECT * FROM mst_employee WHERE id NOT IN (77, 64, 71, 20, 11, 62, 65, 46, 63, 6) AND status = 1) B ON A."employeeId" = B.id
            JOIN mst_request_type C ON A.check_type = C.id
            WHERE 1=1 AND (C.tipe = 2 OR C.tipe = 3) AND A.check_type = 9 ${param.department ? dept : ""} ${param.company ? comp : ""}
            AND DATE(A.created_at) = '${mapQry[n]}'
            ) AS "${mapQry[n]}"`
        if(n !== mapQry.length - 1) {
            sum += '+ '
            qry += ', '
        }
    }
    const totalLeave = await model.totalLeaveMonthly(sum, qry);
    return totalLeave.length > 0 ? totalLeave[0].SUM : 0
}

export async function getTotalDayWork(param: IPagination) { 
    const start = moment(param.startDate);
    const end = moment(param.endDate);
    
    const mapQry = await enumerateDays(start, end, true);
    return mapQry.length;
}

export async function getData(param: IPagination, session: ISession) {
    const key = param.key ? param.key : ""
    const direction = param.direction ? param.direction : ""
    const column = param.column ? param.column : ""
    const month = param.month ? param.month : moment()
    const startDate = param.startDate ? param.startDate : moment(month).startOf('month')
    const endDate = param.endDate ? param.endDate : moment(month).endOf('month')
    const department = param.department ? param.department : ""
    const company = param.company ? param.company : ""

    let params = {
        month,
        startDate,
        endDate,
        key: key.toUpperCase(),
        direction,
        column,
        department,
        company,
    } as IPagination

    const start = startDate ? moment(startDate) : moment(month).startOf('month')
    const end = endDate ? moment(endDate) : moment(month).endOf('month')
    
    const totalEmp = await getTotalEmp(params, session);
    const totalAtt = await getTotalAtt(params);
    const totalAbs = await getTotalAbsent(params, session);
    const totalDet = await getTotalDet(params);    
    const totalDayoff = await getTotalDayoff(params);
    const totalLeave = await getTotalLeave(params);
    const totalSickLeave = await getTotalSickLeave(params);
    const totalDayWork = await getTotalDayWork(params);
    // 19 Jul 24
    const totalAttendance = totalAtt
    const totalAbsent = totalAbs
    const totalDayWorkofAllEmp = totalEmp * totalDayWork

    const totalAttendancePE = totalAtt / totalEmp
    const totalAbsentPE = totalAbs / totalEmp
    const totalLeavePE = totalLeave / totalEmp
    const totalSickLeavePE = totalSickLeave / totalEmp
    const totalPE = totalAttendancePE + totalAbsentPE + totalLeavePE + totalSickLeavePE

    const totalAttendancePM = totalAttendancePE / totalDayWork
    const totalAbsentPM = totalAbsentPE / totalDayWork
    const totalLeavePM = totalLeavePE / totalDayWork
    const totalSickLeavePM = totalSickLeavePE / totalDayWork
    const totalPM = totalAttendancePM + totalAbsentPM + totalLeavePM + totalSickLeavePM
    // end
    
    params.startDate = moment(start).format("YYYY-MM-DD");
    params.endDate = moment(end).format("YYYY-MM-DD");
    
    const mapQry = await enumerateDays(start, end)
    let coalesce = ""
    let qry = ""
    let left = ""
    let group = ""

    for(let n = 0; n < mapQry.length; n++) {
        coalesce += `COALESCE("${mapQry[n]}"."duration", 0)`
        qry += `SUM(CASE WHEN DATE(A.check_in) = '${mapQry[n]}' THEN (A.check_type) ELSE 0 END) AS "${mapQry[n]}"`
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
            coalesce += ' + '
            qry += ', '
            group += ', '
        }
    }

    const checkGetLastDayBiggerThanToday: boolean = end > moment()

    const isWeekday = await enumerateDays(startDate ? moment(startDate) : moment(month).startOf('month'), param.endDate ? (checkGetLastDayBiggerThanToday ? moment() : moment(param.endDate)) : moment(), true)
    const weekday = isWeekday.length;
    const total_dayoff = await enumerateDays(startDate ? moment(startDate) : moment(month).startOf('month'), end, false, true)

    const list: any = await model.listMonthly(params, coalesce, qry, weekday, total_dayoff, left, group, checkGetLastDayBiggerThanToday);
    const tabling: any = []

    tabling.push({
        key: 'number',
        title: "NO.",
        dataIndex: "number",
        sorter: true
    })
    
    tabling.push({
        key: 'fullname',
        title: "FULLNAME",
        dataIndex: "fullname",
        sorter: true
    })

    if (mapQry.length > 0) {
        const filterData = mapQry.filter((item: any) => item !== 'id')
        const weekeend = [0,6]
        const srtDate = startDate ? moment(startDate) : moment(month).startOf('month');
        const startOf = moment(srtDate).format('YYYY-MM-DD');
        const endOf = moment(end).format('YYYY-MM-DD');
        
        const findDayOff = await model.totalDayoffMonthly(startOf, endOf)
        const dayOff = findDayOff[0].date ? findDayOff[0].date : [];
        
        filterData.map((item: any, indx: any) => { 
                tabling.push({
                    key: indx,
                    title: item,
                    dataIndex: item,
                    red: weekeend.includes(srtDate.day()) || dayOff.includes(item) ? true : false
                })
                srtDate.add(1,'days')
            }
        )
    }

    tabling.push({
        key: 'duration',
        title: "Total Work Hour",
        dataIndex: "duration",
        sorter: true
    })

    tabling.push({
        title: 'TOTAL',
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
    })

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
        sum_total_att: totalAttendance,
        sum_total_abs: totalAbsent,
        sum_total_lea: totalLeave,
        sum_total_silea: totalSickLeave,
        sum_total_dw_ae: totalDayWorkofAllEmp,

        sum_total_att_pe: totalAttendancePE,
        sum_total_abs_pe: totalAbsentPE,
        sum_total_lea_pe: totalLeavePE,
        sum_total_silea_pe: totalSickLeavePE,
        sum_total_dw_pe: totalPE,

        sum_total_att_pm: totalAttendancePM * 100,
        sum_total_abs_pm: totalAbsentPM * 100,
        sum_total_lea_pm: totalLeavePM * 100,
        sum_total_silea_pm: totalSickLeavePM * 100,
        sum_total_dw_pm: totalPM * 100,
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

        const {key, direction, column, month, department, company, startDate, endDate} = req.query

        let params = {
            key,
            direction,
            column,
            month,
            department,
            company,
            startDate,
            endDate
        } as IPagination

        if (params.company == "undefined" || params.company == "null") {
            params.company = ""
        }
        if (params.department == "undefined" || params.department == "null") {
            params.department = ""
        }
        if (params.startDate == "undefined") {
            params.startDate = moment(params.month).startOf('month')
        }
        if (params.endDate == "undefined") {
            params.endDate = moment(params.month).endOf('month')
        }

        const data = await getData(params, session)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

export default protectAPI(handler);
