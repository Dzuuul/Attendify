import { exeQuery } from "../../../lib/db";
import moment from "moment";
import { ISession } from 'interfaces/common.interface';
import { IPagination, attReq } from "interfaces/attendance.interface";

interface IAtt {
    id: number
    employeeId: number
}

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

export const getAttendance = (id: any) => {
    const syntax = `SELECT A.*, B.clock_in, B.clock_out FROM attendance A
    LEFT JOIN mst_shift_det B ON A."shiftDetId" = B.id
    WHERE A."employeeId" = ${id} AND A.created_at >= '${moment().format('YYYY-MM-DD')}'::date AND A.created_at < ('${moment().format('YYYY-MM-DD')}'::date + '1 day'::interval)`;
    
    //check with working hour
    //const syntax = `SELECT D.clock_out, D.work_hour, A.*
    //FROM attendance A
    //JOIN mst_employee B ON A."employeeId" = B.id
    //LEFT JOIN mst_shift C ON B."shiftId" = C.id
    //LEFT JOIN mst_shift_det D ON A."shiftDetId" = D.id
    //WHERE A."employeeId" = ${id} 
    //AND CASE WHEN D.work_hour = '24' THEN A.created_at = current_timestamp - interval '1 day' OR A.created_at < '${moment().format('YYYY-MM-DD')}'::date ELSE A.created_at >= '${moment().format('YYYY-MM-DD')}'::date AND A.created_at < ('${moment().format('YYYY-MM-DD')}'::date + '1 day'::interval)
    //END`;
    
    return exeQuery(syntax, [])
}

export const chkAttdFilled = (id: any) => {
    const stx = `SELECT * FROM mst_request_type WHERE id = ${id}`
    return exeQuery(stx, [])
} 

export const getLatLongOfComp = (id: number) => {
    const syntax = `SELECT B.lat, B."long", B.max_check FROM mst_employee A JOIN mst_company B ON A."companyId" = B.id WHERE A.id = ${id}`;
    return exeQuery(syntax, [])
}

export const listAttendance = (param: IPagination) => {
    const syntax = `SELECT A."employeeId", 
    TO_CHAR(A.check_in, 'HH24:MI:SS') AS check_in, 
    TO_CHAR(A.check_out, 'HH24:MI:SS') AS check_out, 
    TO_CHAR(A.created_at, 'DD/MM/YYYY') AS date, 
    C.description AS type, A.check_type,
    CASE WHEN A.late_in IS NULL THEN NULL ELSE A.late_in END AS "status",
    CASE WHEN A.desc_in IS NULL THEN D.description ELSE A.desc_in END AS desc_in, B."deptId" AS dept, A.lat_in, A.long_in
    FROM attendance A
    JOIN mst_employee B ON A."employeeId" = B.id 
    JOIN mst_request_type C ON A.check_type = C.id
    LEFT JOIN request_attendance D ON A."requestId" = D.id
    WHERE A."employeeId" = '${param.employeeId}'${dateSummary(param.startDate || "", param.endDate || "")}
    ORDER BY DATE(A.created_at) DESC`;
    return exeQuery(syntax, [])
}

export const shiftEmployee = (param: IPagination) => {
    const syntax = `SELECT B."shiftId", C.description, D.clock_in, D.clock_out
    FROM mst_employee B
    JOIN mst_shift C ON B."shiftId" = C.id 
    JOIN mst_shift_det D ON C.id = D."shiftId"
    WHERE B.id = '${param.employeeId}' AND D.status = 1 AND D.is_enabled = 1`;
    return exeQuery(syntax, [])
}

export const checkIn = (id: number, lat: string, long: string, checkType: number, desc: string, session: ISession, late: number, shiftDetId: number, requestId: number) => {
    const syntax = `INSERT INTO public.attendance ("employeeId", check_status, lat_in, long_in, check_type, desc_in, "createdById", late_in, "shiftDetId", "requestId") VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
    return exeQuery(syntax, [id, lat, long, checkType, desc, session.id, late, shiftDetId, requestId])
}

export const checkOut = (id: number, lat: string, long: string, desc: string, date: string, session: ISession, early: number) => {
    const syntax = `UPDATE PUBLIC.attendance SET check_out = current_timestamp, lat_out = $1, long_out = $2, desc_out = $3, check_status = 2, early_out = $4, "updatedById" = $5, updated_at = current_timestamp WHERE DATE(created_at) = $6::DATE AND "employeeId" = $7`;

    //checkout with working hour
    //const syntax = `UPDATE PUBLIC.attendance SET check_out = current_timestamp, lat_out = $1, long_out = $2, desc_out = $3, check_status = 2, early_out = $4, "updatedById" = $5, updated_at = current_timestamp 
    //WHERE CASE WHEN $6 = '24' THEN DATE(created_at) < $7::DATE ELSE DATE(created_at) = $7::DATE END AND "employeeId" = $8 RETURNING *`;

    return exeQuery(syntax, [lat, long, desc, early, session.id, date, id])
}

export const checkSameDayOnRequestAtt = (empId: number, start: any, end: any) => {
    const stx = `SELECT * FROM request_attendance WHERE "employeeId" = $3 AND ((start_date >= $1 AND start_date <= $2) OR (end_date >= $1 AND end_date <= $2))`
    return exeQuery(stx, [start, end, empId])
}

export const checkSameDayOnRequestAttToday = (empId: number) => {
    const stx = `SELECT "employeeId" FROM request_attendance WHERE "employeeId" = $1 AND ((start_date >= CURRENT_DATE AND start_date <= CURRENT_DATE) OR (end_date >= CURRENT_DATE AND end_date <= CURRENT_DATE))`
    return exeQuery(stx, [empId])
}

export const checkAlreadyFilledAtt = (empId: number, start: any, end: any) => {
    const stx = `SELECT * FROM attendance WHERE "employeeId" = $3 AND ((check_in >= $1 AND check_out <= $2) OR (check_in >= $1 AND check_out <= $2))`
    return exeQuery(stx, [start, end, empId])
}

export const checkShift = (id: any) => {
    const syntax = `SELECT C.id AS "shiftDetId", C.clock_in, C.clock_out, C.sunday, C.monday, C.tuesday, C.wednesday, C.thursday, C.friday, C.saturday, C.valid_from, C.valid_to
    FROM mst_employee A
    JOIN mst_shift B ON A."shiftId" = B.id
    JOIN mst_shift_det C ON B.id = C."shiftId"
    WHERE A.id = ${id} AND C.status = 1 AND C.is_enabled = 1`;
    
    return exeQuery(syntax, [])
}

export const getDivisionId = (id: any) => {
    const stx = `SELECT "divId" AS id FROM mst_employee WHERE id = $1`
    return exeQuery(stx, [id])
}

export const checkHead = (employeeId: number, divId: number) => {
    const syntax = `SELECT CASE WHEN A."headId" = $1 THEN 1 ELSE 0 END AS divHead, CASE WHEN B."headId" = $1 THEN 1 ELSE 0 END AS deptHead, B."headId" AS head
    FROM mst_division A
    JOIN mst_department B ON A."deptId" = B.id
    WHERE A.id = $2`
    return exeQuery(syntax, [employeeId, divId])
}

export const checkIsCuti = (offId: number) => {
    const syntax = `SELECT * FROM mst_request_type WHERE id = $1`
    return exeQuery(syntax, [offId])
}

export const getApproverByDiv = (id: any) => {
    const stx = `SELECT "supervisorId", order_approved AS urutan FROM mst_approval_line WHERE "divId" = $1 ORDER BY "urutan"`
    //const stx = `SELECT "superiorId", 1 AS urut FROM mst_employee WHERE id = $1`
    return exeQuery(stx, [id])
}

export const requestOffTime = (empId: number, start: any, end: any, offType: number, desc: string, session: ISession) => {
    const stx = `INSERT INTO request_attendance ("createdById", "employeeId", start_date, end_date, "requestTypeId", description) VALUES ($6, $1, $2, $3, $4, $5) RETURNING *`
    return exeQuery(stx, [empId, start, end, offType, desc, session.id, ])
}

export const chkReverseMistakeTimeOff = (empId: number, start: any, end: any, offType: number, desc: string, session: ISession) => {
    const stx = `SELECT * FROM request_attendance WHERE "employeeId" = $1 AND start_date = $2 AND end_date = $3 AND "requestTypeId" = $4 AND description = $5 AND "createdById" = $6`
    return exeQuery(stx, [empId, start, end, offType, desc, session.id])
}

export const chkReverseMistakeAttd = (param: attReq, session: ISession) => {
    const stx = `SELECT * FROM request_attendance WHERE "employeeId" = $1 AND start_date = $2 AND start_time = $3 AND end_date = $4 AND end_time = $5 AND "requestTypeId" = $6 AND description = $7 AND "createdById" = $8`
    return exeQuery(stx, [param.employeeId, param.start, param.start_time, param.end, param.end_time, param.type, param.desc, session.id])
}

export const requestAttendance = (param: attReq, session: ISession) => {
    const stx = `INSERT INTO request_attendance ("employeeId", start_date, start_time, end_date, end_time, "requestTypeId", description, "createdById") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`
    return exeQuery(stx, [param.employeeId, param.start, param.start_time, param.end, param.end_time, param.type, param.desc, session.id])
}

export const requestFastLateTime = (empId: number, offType: number, desc: string) => {
    const stx = `INSERT INTO request_attendance ("createdById", "employeeId", "requestTypeId", description) VALUES ($1, $1, $2, $3) RETURNING *`
    return exeQuery(stx, [empId, offType, desc])
}

export const addReqApproval = (session: ISession, appvId: number, reqId: number, sorter: number) => {
    const stx = `INSERT INTO approval_attendance ("createdById", "approvedById", "requestId", order_approved) VALUES ($1, $2, $3, $4) RETURNING *`
    return exeQuery(stx, [session.id, appvId, reqId, sorter])
}

export const chkClockType = (id: number) => {
    const stx = `SELECT * FROM mst_request_type WHERE id = $1`
    return exeQuery(stx, [id])
}

export const checkRemLeave  = (id: number) => {
    const stx = `SELECT saldo_cuti FROM mst_employee WHERE id = $1`
    return exeQuery(stx, [id])
}

export const findTypeAtt = () => {
    const syntax = `SELECT id AS key, id AS value, UPPER(description) AS label, 'type' AS name FROM mst_request_type WHERE tipe = 1 AND need_apprv = 1`
    return exeQuery(syntax, [])
}

export const checkReqAtt = (start: string, end: string, type: number, session: ISession) => {
    const syntax = `SELECT * FROM request_attendance WHERE DATE(start_date) = $1 AND DATE(end_date) = $2 AND "requestTypeId" = $3 AND "employeeId" = $4`
    
    return exeQuery(syntax, [start, end, type, session.emp])
}

export const checkAtt = (start: string, end: string, session: ISession) => {
    const syntax = `SELECT * FROM attendance WHERE DATE(check_in) BETWEEN $1 AND $2 AND "employeeId" = $3`
    
    return exeQuery(syntax, [start, end, session.emp])
}

export const getData = () => {
    const syntax = `
        SELECT id, "employeeId" FROM attendance WHERE "shiftDetId" IS NULL ORDER BY id
    `
    return exeQuery(syntax, [])
}

export const getCheckOut = () => {
    const syntax = `
        SELECT id, "employeeId" FROM attendance WHERE check_out IS NULL ORDER BY id
    `
    return exeQuery(syntax, [])
}

export const updateShift = (params: IAtt) => {
    const syntax = `
        UPDATE attendance SET "shiftDetId" = (
            SELECT B."shiftId"
            FROM mst_employee B
            WHERE B.id = $1
        ), updated_at = current_timestamp, "updatedById" = 1
        WHERE id = $2;
    `
    return exeQuery(syntax, [params.employeeId, params.id])
}

export const updateCheckOut = (params: IAtt) => {
    const syntax = `
        UPDATE attendance SET check_out = 
        (
            SELECT to_timestamp(CONCAT(DATE(A.check_in), ' ', D.clock_out), 'YYYY/MM/DD HH24:MI:SS.US')::timestamptz
            FROM attendance A
            JOIN mst_shift C ON A."shiftDetId" = C.id
            JOIN mst_shift_det D ON C.id = D."shiftId"
            WHERE A.id = $1 AND D.status = 1 AND D.is_enabled = 1
        ), updated_at = current_timestamp, "updatedById" = 1
        WHERE id = $1;
    `
    return exeQuery(syntax, [params.id])
}

export const getRemainLeave = (param: IPagination) => {
    const syntax = `
    SELECT saldo_cuti FROM mst_employee WHERE id = $1`
    return exeQuery(syntax, [param.employeeId])
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