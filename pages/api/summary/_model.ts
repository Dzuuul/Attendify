import { exeQuery } from "../../../lib/db";
import { ISession } from "interfaces/common.interface";

interface IParams {
    day?: string | any
    week?: string | any
    month?: string | any
    department?: string
    company?: string
    startDate?: string | any
    endDate?: string
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
}

const orderBy = (params: IParams) => {
    const {direction, column} = params
    const directionType =
        direction == "ascend" ? "ASC" : direction == "descend" ? "DESC" : "";
    if (column == "" || directionType == "") {
        return ` ORDER BY "fullname" ASC`;
    } else {
        return ` ORDER BY "${column}" ${directionType}`;
    }
};

const keyWhere = (params: IParams) => {
    const { key } = params
    if (key == "") {
        return "";
    } else {
        return ` AND UPPER(B.fullname) LIKE '%${key}%'`;
    }
};

const dateWhere = (startDate : string) => {
    if (startDate == "") {
        return "";
    } else {
        return ` AND DATE(A.created_at) = '${startDate}'`;
    }
};

const deptWhere = (department : string) => {
    if (department == "") {
        return "";
    } else {
        return ` AND B."deptId" = '${department}'`;
    }
};

const companyWhere = (company: string) => {
    if (company == "") {
        return "";
    } else {
        return ` AND B."companyId" = '${company}'`;
    }
};

const dateSummary = (startDate: string, endDate: string) => {
    if (startDate !== "" && endDate !== "") {
        return ` AND DATE(A.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    }
    if (startDate !== "" && endDate === "") {
        return ` AND DATE(A.created_at) = '${startDate}'`;
    }
    if (startDate === "" && endDate === "") {
        return "";
    }
};

const accessIdWhere = (session : ISession) => {
    if (session.accessId == 5) {
        return `AND B."deptId" = '${session.deptId}'`;
    } 
    if (session.accessId == 9) {
        return `AND B."divId" = '${session.divId}'`;
    } else {
        return "";
    }
};

export const list = (params: IParams, session: ISession) => {
    const syntax = `SELECT row_number() OVER (ORDER BY B.fullname) AS "No.", B.id_employee, B.fullname, C.description AS department, check_in, check_out, check_type,
    COALESCE((
        (
            DATE_PART('day', check_out - D."work_hour") * 24 +
            DATE_PART('hour', check_out - D."work_hour")
        ) * 60 +
            DATE_PART('minute', check_out - D."work_hour")
        ) * 60 + DATE_PART('second', check_out - D."work_hour")
    , 0)::bigint AS "duration"
    FROM mst_employee B
    LEFT JOIN (
        SELECT A.id, A."employeeId", A.check_in, A.check_out, B.description AS check_type 
        FROM attendance A 
        JOIN mst_request_type B ON A.check_type = B.id 
        WHERE 1=1 ${dateWhere(params.startDate)}
    ) Z ON B.id = Z."employeeId"
    JOIN mst_department C ON B."deptId" = C.id 
    LEFT JOIN (SELECT id, (check_in + INTERVAL '1 hour') AS "work_hour" FROM attendance) D ON Z.id = D.id
    WHERE 1=1 AND B.status = 1 ${keyWhere(params)} ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} ${accessIdWhere(session)} ${orderBy(params)}`;

    return exeQuery(syntax, [])
}

export const listMonthly = (params: IParams, coalesce: any, qry: any, weekday: number, dayOff: number, left: any, group: any, isBiggerThanToday: boolean) => {
    const syntax = `
    SELECT row_number() OVER (ORDER BY B.fullname) AS number, B.fullname, 
    (D.COUNT) AS "totalAtt", ${dayOff} AS "totalDayOff", 
    (CASE WHEN (${weekday} - COALESCE(I.COUNT, 0) - COALESCE(J.COUNT, 0) - COALESCE(K.COUNT, 0) - COALESCE(L.COUNT, 0) - COALESCE(M.COUNT, 0)) < 0 THEN 0 ELSE (${weekday} - COALESCE(I.COUNT, 0) - COALESCE(J.COUNT, 0) - COALESCE(K.COUNT, 0) - COALESCE(L.COUNT, 0) - COALESCE(M.COUNT, 0)) END) AS "totalAbs",
    COALESCE(E.COUNT, 0) AS "totalCuti", COALESCE(F.COUNT, 0) AS "totalSakit", COALESCE(G.COUNT, 0) AS "totalIzin", ${coalesce} AS "duration", ${qry}
    FROM mst_employee B
    LEFT JOIN attendance A ON B.id = A."employeeId"
    JOIN mst_department C ON B."deptId" = C.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where (mst_request_type.tipe = 1) AND DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' GROUP BY "employeeId") D ON D."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND mst_request_type.is_cuti = 1 GROUP BY "employeeId") E ON E."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND check_type = 9 GROUP BY "employeeId") F ON F."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND check_type = 8 GROUP BY "employeeId") G ON G."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where check_type = 8 AND DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' GROUP BY "employeeId") H ON H."employeeId" = B.id 

    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where (mst_request_type.tipe = 1) AND DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } GROUP BY "employeeId") I ON I."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND mst_request_type.is_cuti = 1 GROUP BY "employeeId") J ON J."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND check_type = 8 GROUP BY "employeeId") M ON M."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND check_type = 9 GROUP BY "employeeId") K ON K."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where check_type = 8 AND DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } GROUP BY "employeeId") L ON L."employeeId" = B.id

    ${left}
    WHERE 1=1 AND B.status = 1 ${keyWhere(params)} ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} 
    GROUP BY B.id, D."employeeId", D.COUNT, E."employeeId", E.COUNT, F."employeeId", F.COUNT, G."employeeId", G.COUNT, H."employeeId", H.COUNT, I.COUNT, J.COUNT, K.COUNT, L.COUNT, M.COUNT, "fullname", ${group} 
    ${orderBy(params)}`;
    
    return exeQuery(syntax, [])
}

export const xportDaily = (params: IParams, check_in: string, check_out: string, hour: string, minute: string, second: string, late_hour: string, late_minute: string, check_type: string, qry: any, left: any, group: any) => {
    const syntax = `
    SELECT B.fullname, ${qry}, ${check_in} AS "check_in", ${check_out} AS "check_out", ${check_type} AS "check_type", ${hour} AS "duration_hour", ${minute} AS "duration_minute", ${second} AS "duration_second", ${late_hour} AS "late_hour", ${late_minute} AS "late_minute"
    FROM mst_employee B
    LEFT JOIN attendance A ON B.id = A."employeeId"
    JOIN mst_department C ON B."deptId" = C.id
    ${left}
    WHERE 1=1 AND B.status = 1 ${keyWhere(params)} ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} 
    GROUP BY B.id, "fullname", ${group} 
    ${orderBy(params)}`;

    return exeQuery(syntax, [])
}

export const xportWeekly = (params: IParams, hour: any, minute: any, second: any, average: any, lateh: string, latem: string, lates: string, qry: any, weekday: number, dayOff: number, left: any, group: any, isBiggerThanToday: boolean) => {
    const syntax = `
    SELECT B.fullname, ${qry}, ${hour} AS "duration_hour", ${minute} AS "duration_minute", ${second} AS "duration_second", ${average} AS "average", ${lateh} AS "late_hour", ${latem} AS "late_minute",
    (D.COUNT) AS "totalAtt", (CASE WHEN (${weekday} - COALESCE(I.COUNT, 0) - COALESCE(J.COUNT, 0) - COALESCE(K.COUNT, 0) - COALESCE(L.COUNT, 0) - COALESCE(M.COUNT, 0)) < 0 THEN 0 ELSE (${weekday} - COALESCE(I.COUNT, 0) - COALESCE(J.COUNT, 0) - COALESCE(K.COUNT, 0) - COALESCE(L.COUNT, 0) - COALESCE(M.COUNT, 0)) END) AS "totalAbs",
    ${dayOff} AS "totalDayOff", COALESCE(E.COUNT, 0) AS "totalCuti", COALESCE(F.COUNT, 0) AS "totalSakit", COALESCE(G.COUNT, 0) AS "totalIzin", '-' AS "perform_working", D.COUNT AS "perform_weekday"
    FROM mst_employee B
    LEFT JOIN attendance A ON B.id = A."employeeId"
    JOIN mst_department C ON B."deptId" = C.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where (mst_request_type.tipe = 1) AND DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' GROUP BY "employeeId") D ON D."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND mst_request_type.is_cuti = 1 GROUP BY "employeeId") E ON E."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND check_type = 9 GROUP BY "employeeId") F ON F."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND check_type = 8 GROUP BY "employeeId") G ON G."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where check_type = 8 AND DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' GROUP BY "employeeId") H ON H."employeeId" = B.id

    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where (mst_request_type.tipe = 1) AND DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } GROUP BY "employeeId") I ON I."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND mst_request_type.is_cuti = 1 GROUP BY "employeeId") J ON J."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND check_type = 8 GROUP BY "employeeId") M ON M."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND check_type = 9 GROUP BY "employeeId") K ON K."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where check_type = 8 AND DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } GROUP BY "employeeId") L ON L."employeeId" = B.id

    ${left}
    WHERE 1=1 AND B.status = 1 ${keyWhere(params)} ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} 
    GROUP BY B.id, D."employeeId", D.COUNT, E."employeeId", E.COUNT, F."employeeId", F.COUNT, G."employeeId", G.COUNT, H.COUNT, I.COUNT, J.COUNT, K.COUNT, L.COUNT, M.COUNT, "fullname", ${group} 
    ${orderBy(params)}`;
    
    return exeQuery(syntax, [])
}

export const xportMonthly = (params: IParams, hour: any, minute: any, second: any, average: any, lateh: string, latem: string, lates: string, overtimeh: string, overtimem: string, qry: any, weekday: number, dayOff: number, left: any, group: any, isBiggerThanToday: boolean) => {
    const syntax = `
    SELECT B.fullname, ${qry}, ${hour} AS "duration_hour", ${minute} AS "duration_minute", ${second} AS "duration_second", ${average} AS "average", ${lateh} AS "late_hour", ${latem} AS "late_minute", ${overtimeh} AS "overtime_hour", ${overtimem} AS "overtime_minute",
    (D.COUNT) AS "totalAtt", (CASE WHEN (${weekday} - COALESCE(I.COUNT, 0) - COALESCE(J.COUNT, 0) - COALESCE(K.COUNT, 0) - COALESCE(L.COUNT, 0) - COALESCE(M.COUNT, 0)) < 0 THEN 0 ELSE (${weekday} - COALESCE(I.COUNT, 0) - COALESCE(J.COUNT, 0) - COALESCE(K.COUNT, 0) - COALESCE(L.COUNT, 0) - COALESCE(M.COUNT, 0)) END) AS "totalAbs",
    ${dayOff} AS "totalDayOff", COALESCE(E.COUNT, 0) AS "totalCuti", COALESCE(F.COUNT, 0) AS "totalSakit", COALESCE(G.COUNT, 0) AS "totalIzin", '-' AS "perform_working", D.COUNT AS "perform_weekday"
    FROM mst_employee B
    LEFT JOIN attendance A ON B.id = A."employeeId"
    JOIN mst_department C ON B."deptId" = C.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where (mst_request_type.tipe = 1) AND DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' GROUP BY "employeeId") D ON D."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND mst_request_type.is_cuti = 1 GROUP BY "employeeId") E ON E."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND check_type = 9 GROUP BY "employeeId") F ON F."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND check_type = 8 GROUP BY "employeeId") G ON G."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where check_type = 8 AND DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' GROUP BY "employeeId") H ON H."employeeId" = B.id

    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where (mst_request_type.tipe = 1) AND DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } GROUP BY "employeeId") I ON I."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND mst_request_type.is_cuti = 1 GROUP BY "employeeId") J ON J."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND check_type = 8 GROUP BY "employeeId") M ON M."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND check_type = 9 GROUP BY "employeeId") K ON K."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where check_type = 8 AND DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } GROUP BY "employeeId") L ON L."employeeId" = B.id

    ${left}
    WHERE 1=1 AND B.status = 1 ${keyWhere(params)} ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} 
    GROUP BY B.id, D."employeeId", D.COUNT, E."employeeId", E.COUNT, F."employeeId", F.COUNT, G."employeeId", G.COUNT, H.COUNT, I.COUNT, J.COUNT, K.COUNT, L.COUNT, M.COUNT, "fullname", ${group} 
    ${orderBy(params)}`;
    
    return exeQuery(syntax, [])
}

export const xport = (params: IParams, coalesce: any, qry: any, weekday: number, dayOff: number, left: any, group: any, isBiggerThanToday: boolean) => {
    const syntax = `
    SELECT B.fullname, ${qry}, ${coalesce} AS "duration", 
    (D.COUNT) AS "totalAtt", (CASE WHEN (${weekday} - COALESCE(I.COUNT, 0) - COALESCE(J.COUNT, 0) - COALESCE(K.COUNT, 0) - COALESCE(L.COUNT, 0) - COALESCE(M.COUNT, 0)) < 0 THEN 0 ELSE (${weekday} - COALESCE(I.COUNT, 0) - COALESCE(J.COUNT, 0) - COALESCE(K.COUNT, 0) - COALESCE(L.COUNT, 0) - COALESCE(M.COUNT, 0)) END) AS "totalAbs",
    ${dayOff} AS "totalDayOff", COALESCE(E.COUNT, 0) AS "totalCuti", COALESCE(F.COUNT, 0) AS "totalSakit", COALESCE(G.COUNT, 0) AS "totalIzin"
    FROM mst_employee B
    LEFT JOIN attendance A ON B.id = A."employeeId"
    JOIN mst_department C ON B."deptId" = C.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where (mst_request_type.tipe = 1) AND DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' GROUP BY "employeeId") D ON D."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND mst_request_type.is_cuti = 1 GROUP BY "employeeId") E ON E."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND check_type = 9 GROUP BY "employeeId") F ON F."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' AND check_type = 8 GROUP BY "employeeId") G ON G."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where check_type = 8 AND DATE(check_in) BETWEEN '${(params.startDate)}' AND '${(params.endDate)}' GROUP BY "employeeId") H ON H."employeeId" = B.id

    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where (mst_request_type.tipe = 1) AND DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } GROUP BY "employeeId") I ON I."employeeId" = B.id 
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND mst_request_type.is_cuti = 1 GROUP BY "employeeId") J ON J."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND check_type = 8 GROUP BY "employeeId") M ON M."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } AND check_type = 9 GROUP BY "employeeId") K ON K."employeeId" = B.id
    LEFT JOIN (SELECT "employeeId", COUNT(1) from attendance where check_type = 8 AND DATE(check_in) BETWEEN '${(params.startDate)}' AND ${isBiggerThanToday ? 'CURRENT_DATE': `'${params.endDate}'` } GROUP BY "employeeId") L ON L."employeeId" = B.id

    ${left}
    WHERE 1=1 AND B.status = 1 ${keyWhere(params)} ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} 
    GROUP BY B.id, D."employeeId", D.COUNT, E."employeeId", E.COUNT, F."employeeId", F.COUNT, G."employeeId", G.COUNT, H.COUNT, I.COUNT, J.COUNT, K.COUNT, L.COUNT, M.COUNT, "fullname", ${group} 
    ${orderBy(params)}`;
    return exeQuery(syntax, [])
}

export const totalEmployee = (params: IParams, session: ISession) => {
    const syntax = `SELECT COUNT(B.id) AS ROW_COUNT FROM mst_employee B WHERE B.status = 1 ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} ${accessIdWhere(session)}`;
    return exeQuery(syntax, [])
}

export const totalEmployeeNoHeader = (params: IParams, session: ISession) => {
    const syntax = `SELECT COUNT(B.id) AS ROW_COUNT FROM mst_employee B WHERE B.status = 1 AND id NOT IN (77, 64, 71, 20, 11, 62, 65, 46, 63, 6) ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} ${accessIdWhere(session)}`;
    return exeQuery(syntax, [])
}

export const totalAttendance = (params: IParams, session: ISession) => {    
    const syntax = `SELECT COUNT(A.id) AS ROW_COUNT
        FROM attendance A 
        JOIN mst_employee B ON B.id = A."employeeId"
        JOIN mst_request_type C ON A.check_type = C.id
        WHERE 1=1 AND C.tipe = 1 ${dateSummary(params.startDate || "", params.endDate || "")} ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} ${accessIdWhere(session)}`;
    return exeQuery(syntax, [])
}

export const totalAttendanceMonthly = (sum: any, qry: any) => {
    const syntax = `SELECT ${sum} AS "SUM" FROM ${qry}`; 
    return exeQuery(syntax, [])
}

export const totalAbsentDaily = (params: IParams, session: ISession) => {
    const syntax = `SELECT COUNT(1) AS ROW_COUNT 
    FROM mst_employee B
    WHERE B.status = 1 
    AND NOT EXISTS
        (
            SELECT 1
            FROM attendance A
            WHERE 1=1 ${dateSummary(params.startDate, params.endDate || "")} AND A."employeeId" = B.id
        )
    ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} ${accessIdWhere(session)}
    `;
    return exeQuery(syntax, [])
}

export const totalAbsent = (sum: any, qry: any) => {
    const syntax = `SELECT ${sum} AS "SUM" FROM ${qry}`;
    return exeQuery(syntax, [])
}

export const totalDetDaily = (params: IParams, session: ISession) => {
    const syntax = `SELECT SUM(CASE WHEN (A.check_in)::time > '08:00' THEN 1 ELSE 0 END) AS "sumLate", SUM(CASE WHEN (A.check_out)::time < '17:00' THEN 1 ELSE 0 END) AS "sumEarly", SUM(CASE WHEN A.check_out is null THEN 1 ELSE 0 END) AS "sumNoCheck"
    FROM attendance A
    JOIN mst_employee B ON A."employeeId" = B.id
    WHERE DATE(A.created_at) = $1 AND  B."deptId" < 7 ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} ${accessIdWhere(session)}`;
     return exeQuery(syntax, [params.startDate])
}

export const totalDet = (sumLate: any, sumEarly: any, sumNoCheck: any, qry: any) => {
    const syntax = `SELECT ${sumLate} AS "sumLate", ${sumEarly} AS "sumEarly", ${sumNoCheck} AS "sumNoCheck" FROM ${qry}`;
    
    return exeQuery(syntax, [])
}

export const totalDayoffWeekly = (startDate: string, endDate: string) => {
    const syntax = `SELECT ARRAY_AGG(to_char(A.date, 'DD')) AS date FROM mst_dayoff A WHERE DATE(A.date) BETWEEN '${startDate}' AND '${endDate}' `;
    return exeQuery(syntax, [])
}

export const totalDayoffMonthly = (startDate: string, endDate: string) => {
    const syntax = `SELECT ARRAY_AGG(to_char(A.date, 'YYYY-MM-DD')) AS date FROM mst_dayoff A WHERE DATE(A.date) BETWEEN '${startDate}' AND '${endDate}' `;
    return exeQuery(syntax, [])
}

export const totalLeave = (params: IParams, session: ISession) => {    
    const syntax = `SELECT COUNT(A.id) AS ROW_COUNT
        FROM attendance A 
        JOIN mst_employee B ON B.id = A."employeeId"
        JOIN mst_request_type C ON A.check_type = C.id
        WHERE 1=1 AND (C.tipe = 2 OR C.tipe = 3) AND A.check_type != 9 ${dateSummary(params.startDate || "", params.endDate || "")} ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} ${accessIdWhere(session)}`;
    return exeQuery(syntax, [])
}

export const totalLeaveMonthly = (sum: any, qry: any) => {
    const syntax = `SELECT ${sum} AS "SUM" FROM ${qry}`; 
    return exeQuery(syntax, [])
}

export const totalSickLeave = (params: IParams, session: ISession) => {    
    const syntax = `SELECT COUNT(A.id) AS ROW_COUNT
        FROM attendance A 
        JOIN mst_employee B ON B.id = A."employeeId"
        JOIN mst_request_type C ON A.check_type = C.id
        WHERE 1=1 AND (C.tipe = 2 OR C.tipe = 3) AND A.check_type = 9 ${dateSummary(params.startDate || "", params.endDate || "")} ${companyWhere(params.company || "")} ${deptWhere(params.department || "")} ${accessIdWhere(session)}`;
    return exeQuery(syntax, [])
}

export const workHourParam = () => {
    const syntax = `SELECT value FROM general_parameter WHERE name = 'working_hour' AND status = 1 AND is_deleted = 0`; 
    return exeQuery(syntax, [])
}

export const startTransaction = () => {
    return exeQuery("START TRANSACTION", [])
}

export const commitTransaction = () => {
    return exeQuery("COMMIT", [])
}

export const rollback = () => {
    return exeQuery("ROLLBACK", [])
}