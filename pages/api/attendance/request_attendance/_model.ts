import { exeQuery } from "../../../../lib/db";
import moment from "moment";
import { ISession } from 'interfaces/common.interface';
import { IPagination } from "interfaces/request_attendance.interface";

const keyWhere = (key: string) => {
    if (key == "") {
        return "";
    } else {
        return ` AND (UPPER(B.description) LIKE '%${key}%' OR UPPER(A.description) LIKE '%${key}%')`;
    }
};

const dateSummary = (startDate: string, endDate: string) => {
    if (startDate !== "" && endDate !== "") {
        return ` AND DATE(A.start_date) BETWEEN '${startDate}' AND '${endDate}' AND DATE(A.end_date) BETWEEN '${startDate}' AND '${endDate}'`;
    }
    if (startDate !== "" && endDate === "") {
        return ` AND DATE(A.start_date) = '${startDate}'`;
    }
    if (startDate === "" && endDate === "") {
        return "";
    }
};

const orderBy = (params: IPagination) => {
    const {direction, column} = params
    const directionType =
        direction == "ascend" ? "ASC" : direction == "descend" ? "DESC" : "";
    if (column == "" || directionType == "") {
        return ` ORDER BY DATE(A.created_at) DESC `;
    } else {
        return ` ORDER BY ${column} ${directionType}`;
    }
};


export const getAttendance = (id: any) => {
    const syntax = `SELECT A.*, B.clock_in, B.clock_out FROM attendance A
    LEFT JOIN mst_shift_det B ON A."shiftDetId" = B.id
    WHERE A."employeeId" = ${id} AND A.created_at >= '${moment().format('YYYY-MM-DD')}'::date AND A.created_at < ('${moment().format('YYYY-MM-DD')}'::date + '1 day'::interval)`;
    
    return exeQuery(syntax, [])
}

export const getLatLongOfComp = (id: number) => {
    const syntax = `SELECT B.lat, B."long", B.max_check FROM mst_employee A JOIN mst_company B ON A."companyId" = B.id WHERE A.id = ${id}`;
    return exeQuery(syntax, [])
}

export const list = (param: IPagination) => {
    const syntax = `SELECT row_number() OVER(ORDER BY DATE(A.created_at) DESC) AS number, UPPER(B.description) AS type, CASE WHEN A.start_date IS NULL THEN A.created_at ELSE A.start_date END, A.end_date, A.description, CASE WHEN A.is_approved IS NULL THEN 'NOT YET APPROVED' ELSE CASE WHEN A.is_approved = 1 THEN 'APPROVED' ELSE 'REJECTED' END END AS status, A."approvedById", ARRAY_AGG(D.fullname) AS need_approve, A."requestTypeId", ARRAY_AGG(CASE WHEN A.is_approved = 1 THEN 'APPROVED' ELSE CASE WHEN A.is_approved = 0 THEN 'REJECTED' ELSE '-' END END) AS status_approve, A.start_time, A.end_time, H.description AS reject
    FROM request_attendance A
    JOIN mst_request_type B ON A."requestTypeId" = B.id
    LEFT JOIN approval_attendance C ON A.id = C."requestId"
    LEFT JOIN mst_employee D ON C."approvedById" = D.id
    LEFT JOIN mst_employee F ON A."approvedById" = F.id
    LEFT JOIN (SELECT description, "requestId" FROM approval_attendance WHERE description IS NOT NULL ORDER BY order_approved DESC) H ON C."requestId" = H."requestId"
    WHERE B.tipe = 1 AND B.need_apprv = 1 AND A."employeeId" = ${param.employeeId} ${dateSummary(param.startDate || "", param.endDate || "")}${keyWhere(param.key)}
    GROUP BY A.id, B.id, F.id, H.description ${orderBy(param)}`
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

export const checkIn = (id: number, lat: string, long: string, checkType: number, desc: string, session: ISession, late: number, shiftDetId: number) => {
    const syntax = `INSERT INTO public.attendance ("employeeId", check_status, lat_in, long_in, check_type, desc_in, "createdById", late_in, "shiftDetId") VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
    return exeQuery(syntax, [id, lat, long, checkType, desc, session.id, late, shiftDetId])
}

export const checkOut = (id: number, lat: string, long: string, desc: string, date: string, session: ISession, early: number) => {
    const syntax = `UPDATE PUBLIC.attendance SET check_out = current_timestamp, lat_out = $1, long_out = $2, desc_out = $3, check_status = 2, early_out = $4, "updatedById" = $5, updated_at = current_timestamp WHERE DATE(created_at) = $6::DATE AND "employeeId" = $7`;

    //checkout with working hour
    //const syntax = `UPDATE PUBLIC.attendance SET check_out = current_timestamp, lat_out = $1, long_out = $2, desc_out = $3, check_status = 2, early_out = $4, "updatedById" = $5, updated_at = current_timestamp 
    //WHERE CASE WHEN $6 = '24' THEN DATE(created_at) < $7::DATE ELSE DATE(created_at) = $7::DATE END AND "employeeId" = $8 RETURNING *`;

    return exeQuery(syntax, [lat, long, desc, early, session.id, date, id])
}

export const checkShift = (id: any) => {
    const syntax = `SELECT C.id AS "shiftDetId", C.clock_in, C.clock_out, C.sunday, C.monday, C.tuesday, C.wednesday, C.thursday, C.friday, C.saturday, C.valid_from, C.valid_to
    FROM mst_employee A
    JOIN mst_shift B ON A."shiftId" = B.id
    JOIN mst_shift_det C ON B.id = C."shiftId"
    WHERE A.id = ${id} AND C.status = 1 AND C.is_enabled = 1`;
    
    return exeQuery(syntax, [])
}

export const getPositionId = (id: any) => {
    const stx = `SELECT "positionId" AS id FROM mst_employee WHERE id = $1`
    return exeQuery(stx, [id])
}

export const getApproverByPos = (id: any) => {
    //const stx = `SELECT "supervisorId", order_approved AS urutan FROM mst_approval_line WHERE "positionId" = $1 ORDER BY "urutan"`
    const stx = `SELECT "superiorId", "urutan" = 1 FROM mst_employee WHERE id = $1`
    return exeQuery(stx, [id])
}

export const requestOffTime = (empId: number, start: any, end: any, offType: number, desc: string) => {
    const stx = `INSERT INTO request_attendance ("createdById", "employeeId", start_date, end_date, "requestTypeId", description) VALUES ($1, $1, $2, $3, $4, $5) RETURNING *`
    return exeQuery(stx, [empId, start, end, offType, desc])
}

export const addReqApproval = (empId: number, appvId: number, reqId: number, sorter: number) => {
    const stx = `INSERT INTO approval_attendance ("createdById", "approvedById", "requestId", order_approved) VALUES ($1, $2, $3, $4) RETURNING *`
    return exeQuery(stx, [empId, appvId, reqId, sorter])
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