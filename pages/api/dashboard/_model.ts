import { exeQuery } from "../../../lib/db";
import { IForm } from "../../../interfaces/employees.interface";

interface IParams {
    day?: string | any
    week?: string | any
    month?: string | any
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
        return ` ORDER BY ${column} ${directionType}`;
    }
};

const keyWhere = (params: IParams) => {
    const { key } = params
    if (key == "") {
        return "";
    } else {
        return ` AND UPPER(A.fullname) LIKE '%${key}%'`;
    }
};

const dateWhere = (startDate : string) => {
    if (startDate == "") {
        return "";
    } else {
        return ` AND DATE(created_at) = '${startDate}'`;
    }
};

const dateSummary = (startDate: string, endDate: string) => {
    if (startDate !== "" && endDate !== "") {
        return ` AND DATE(A.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    }
    if (startDate !== "" && endDate === "") {
        return ` AND DATE(created_at) = '${startDate}'`;
    }
    if (startDate === "" && endDate === "") {
        return "";
    }
};

export const list = (params: IParams) => {
    const syntax = `SELECT A.id_employee, A.fullname, C.description AS department, check_in, check_out, check_type, 
    ((DATE_PART('day', check_out - check_in) * 24 + 
                DATE_PART('hour', check_out - check_in)) * 60 +
                DATE_PART('minute', check_out - check_in)) * 60 +
                DATE_PART('second', check_out - check_in) AS duration
    FROM mst_employee A
    LEFT JOIN (SELECT * FROM attendance WHERE 1=1 ${dateWhere(params.day)}) B ON A.id = B."employeeId"
    JOIN mst_department C ON A."deptId" = C.id WHERE 1=1 ${keyWhere(params)} ${orderBy(params)}`;
    return exeQuery(syntax, [])
}

export const listMonthly = (params: IParams, qry: any) => {
    const syntax = `
    SELECT A.fullname, 
    ${qry}
    FROM mst_employee A
    LEFT JOIN attendance B ON A.id = B."employeeId"
        JOIN mst_department C ON A."deptId" = C.id WHERE 1=1    
    ${keyWhere(params)} GROUP BY "employeeId", "fullname" ${orderBy(params)}`;
    return exeQuery(syntax, [])
}

export const totalEmployee = () => {
    const syntax = `SELECT COUNT(id) AS ROW_COUNT FROM mst_employee WHERE resign_date is null`;
    return exeQuery(syntax, [])
}

export const totalAttendance = (startDate: string, endDate: string) => {
    const syntax = `SELECT COUNT(A.id) AS ROW_COUNT FROM attendance A WHERE 1=1 ${dateSummary(startDate, endDate)}`;   
    return exeQuery(syntax, [])
}

export const totalAbsentDaily = (startDate: string, endDate: string) => {
    const syntax = `SELECT COUNT(A.id) AS ROW_COUNT 
    FROM mst_employee A
    WHERE resign_date IS NULL 
    AND NOT EXISTS
        (
            SELECT B.id
            FROM attendance B
            WHERE 1=1 ${dateSummary(startDate, endDate)} AND B."employeeId" = A.id
        )
    `;
    return exeQuery(syntax, [])
}

export const totalAbsent = (sum: any, qry: any) => {
    const syntax = `SELECT ${sum} AS "SUM" FROM ${qry}`;
    return exeQuery(syntax, [])
}

export const totalDetDaily = (day: string) => {
    const syntax = `SELECT SUM(CASE WHEN (A.check_in)::time > '08:00' THEN 1 ELSE 0 END) AS "lateIn", SUM(CASE WHEN (A.check_out)::time < '17:00' THEN 1 ELSE 0 END) AS "earlyOut", SUM(CASE WHEN A.check_out is null THEN 1 ELSE 0 END) AS "noCheckOut"
    FROM attendance A
    WHERE DATE(A.created_at) = $1`;
    return exeQuery(syntax, [day])
}

export const totalDet = (sumLate: any, sumEarly: any, sumNoCheck: any, qry: any) => {
    const syntax = `SELECT ${sumLate} AS "sumLate", ${sumEarly} AS "sumEarly", ${sumNoCheck} AS "sumNoCheck" FROM ${qry}`;
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