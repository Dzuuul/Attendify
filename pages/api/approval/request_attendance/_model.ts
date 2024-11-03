import { exeQuery } from "../../../../lib/db";
import { formModal } from "interfaces/approval_attendance.interface"; 
import { ISession } from 'interfaces/common.interface';

interface IParams {
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
        return " ORDER BY DATE(A.created_at) DESC";
    } else {
        return ` ORDER BY ${column} ${directionType}`;
    }
};

const keyWhere = (params: IParams) => {
    const { key } = params
    if (key == "") {
        return "";
    } else {
        return ` AND (UPPER(D.fullname) LIKE '%${key}%')`;
    }
};

const accessIdWhere = (session : ISession) => {
    if (session.accessId == 5) {
        return `AND D."deptId" = '${session.deptId}'`;
    } else {
        return "";
    }
};

const approveWhere = (session : ISession) => {
    if (session.accessId == 5 || session.accessId == 9) {
        return `AND A."approvedById" = ${session.emp}`;
    } else {
        return "";
    }
};

export const countList = (params: IParams, session: ISession) => {
    const syntax = `SELECT
    COUNT(*) over () AS counts
    FROM approval_attendance A
    JOIN request_attendance B ON A."requestId" = B.id
    JOIN mst_request_type C ON B."requestTypeId" = C.id
    JOIN mst_employee D ON B."employeeId" = D.id
    LEFT JOIN approval_attendance E ON A."requestId" = E."requestId"
    LEFT JOIN mst_employee F ON E."approvedById" = F.id
    LEFT JOIN mst_employee G ON B."approvedById" = G.id
    LEFT JOIN (SELECT description, "requestId" FROM approval_attendance WHERE description IS NOT NULL ORDER BY order_approved DESC) H ON A."requestId" = H."requestId"
    WHERE 1=1 AND C.tipe = 1 ${approveWhere(session)} ${keyWhere(params)}
    GROUP BY A.id, B.id, C.id, D.id, G.id, H.description
    ${orderBy(params)}`

    return exeQuery(syntax, [])
}

export const list = (params: IParams, session: ISession) => {
    const syntax = `SELECT A.id, A."requestId", D.fullname, D.saldo_cuti, C.description AS type, CASE WHEN B.start_date IS NULL THEN B.created_at ELSE B.start_date END, B.end_date, B.description, CASE WHEN A.is_approved IS NULL THEN 'NOT YET APPROVED' ELSE CASE WHEN A.is_approved = 1 THEN 'APPROVED' ELSE 'REJECTED' END END AS status, A."approvedById", ARRAY_AGG(F.fullname) AS need_approve, A.is_approved, G.fullname AS last_approve, H.description AS reject, B."requestTypeId", ARRAY_AGG(CASE WHEN E.is_approved = 1 THEN 'APPROVED' ELSE CASE WHEN E.is_approved = 0 THEN 'REJECTED' ELSE '-' END END) AS status_approve, B.start_time, B.end_time
    FROM approval_attendance A
    JOIN request_attendance B ON A."requestId" = B.id
    JOIN mst_request_type C ON B."requestTypeId" = C.id
    JOIN mst_employee D ON B."employeeId" = D.id
    LEFT JOIN approval_attendance E ON A."requestId" = E."requestId"
    LEFT JOIN mst_employee F ON E."approvedById" = F.id
    LEFT JOIN mst_employee G ON B."approvedById" = G.id
    LEFT JOIN (SELECT description, "requestId" FROM approval_attendance WHERE description IS NOT NULL ORDER BY order_approved DESC) H ON A."requestId" = H."requestId"
    WHERE 1=1 AND C.tipe = 1 ${approveWhere(session)} ${keyWhere(params)}
    GROUP BY A.id, B.id, C.id, D.id, G.id, H.description
    ${orderBy(params)} ${params.limit}`
    
    return exeQuery(syntax, [])
}

export const countListAll = (param: IParams, session: ISession) => {
    const syntax = `SELECT 
    COUNT(*) over () AS counts
    FROM request_attendance A
    JOIN mst_request_type B ON A."requestTypeId" = B.id
    LEFT JOIN approval_attendance C ON A.id = C."requestId"
    LEFT JOIN mst_employee D ON C."approvedById" = D.id
    LEFT JOIN mst_employee E ON A."employeeId" = E.id
    LEFT JOIN mst_employee F ON A."approvedById" = F.id
    LEFT JOIN (SELECT description, "requestId" FROM approval_attendance WHERE description IS NOT NULL ORDER BY order_approved DESC) H ON A.id = H."requestId"
    WHERE 1=1 AND B.tipe = 1 ${keyWhere(param)}
    GROUP BY A.id, B.id, F.id, E.id, H.description ${orderBy(param)}`
    
    return exeQuery(syntax, [])
}

export const listAll = (param: IParams, session: ISession) => {
    const syntax = `SELECT A.id, A.is_approved, E.fullname, UPPER(B.description) AS type, CASE WHEN A.start_date IS NULL THEN A.created_at ELSE A.start_date END, A.end_date, A.description, CASE WHEN A.is_approved IS NULL THEN 'NOT YET APPROVED' ELSE CASE WHEN A.is_approved = 1 THEN 'APPROVED' ELSE 'REJECTED' END END AS status, A."approvedById", ARRAY_AGG(D.fullname) AS need_approve, ARRAY_AGG(CASE WHEN C.is_approved = 1 THEN 'APPROVED' ELSE CASE WHEN C.is_approved = 0 THEN 'REJECTED' ELSE '-' END END) AS status_approve, F.fullname AS last_approve, A."requestTypeId", A.start_time, A.end_time, H.description AS reject
    FROM request_attendance A
    JOIN mst_request_type B ON A."requestTypeId" = B.id
    LEFT JOIN approval_attendance C ON A.id = C."requestId"
    LEFT JOIN mst_employee D ON C."approvedById" = D.id
    LEFT JOIN mst_employee E ON A."employeeId" = E.id
    LEFT JOIN mst_employee F ON A."approvedById" = F.id
    LEFT JOIN (SELECT description, "requestId" FROM approval_attendance WHERE description IS NOT NULL ORDER BY order_approved DESC) H ON A.id = H."requestId"
    WHERE 1=1 AND B.tipe = 1 ${keyWhere(param)}
    GROUP BY A.id, B.id, F.id, E.id, H.description ${orderBy(param)} ${param.limit}`

    return exeQuery(syntax, [])
}

export const approve = async (param: formModal, session: ISession) => {
    const syntax = `UPDATE approval_attendance SET is_approved = 1, "updatedById" = $2, updated_at = current_timestamp WHERE id = $1`;

    return exeQuery(syntax, [param.id, session.id])
}

export const approveOverride = async (param: formModal, session: ISession) => {
    const syntax = `UPDATE approval_attendance SET is_approved = 1, "updatedById" = $2, updated_at = current_timestamp WHERE "requestId" = $1`;

    return exeQuery(syntax, [param.id, session.id])
}

export const chkReverseApprove = async (param: formModal, session: ISession) => {
    const syntax = `SELECT * FROM approval_attendance WHERE is_approved = 1 AND "updatedById" = $2 AND id = $1`;
    return exeQuery(syntax, [param.id, session.id])
}

export const chkReverseApproveOverride = async (param: formModal, session: ISession) => {
    const syntax = `SELECT * FROM request_attendance WHERE is_approved = 1 AND "updatedById" = $2 AND id = $1`;
    return exeQuery(syntax, [param.id, session.id])
}

export const approveLast = async (param: formModal, session: ISession, days: number) => {
    const syntaxReq = `UPDATE request_attendance SET is_approved = 1, "approvedById" = $2, "updatedById" = $3, total_days = $4, updated_at = current_timestamp WHERE id = $1`;
    await exeQuery(syntaxReq, [param.requestId, session.emp, session.id, days])
}

export const approveLastOverride = async (param: formModal, session: ISession, days: number) => {
    const syntaxReq = `UPDATE request_attendance SET is_approved = 1, "updatedById" = $2, total_days = $3, updated_at = current_timestamp WHERE id = $1`;
    await exeQuery(syntaxReq, [param.id, session.id, days])
}

export const chkOrderApprov = async (param: formModal, session: ISession) => {
    const stx = `SELECT order_approved FROM approval_attendance WHERE "requestId" = $1 AND "approvedById" = $2`
    return exeQuery(stx, [param.requestId, session.emp])
}

export const chkApproverBelowMe = async (param: formModal, order: number) => {
    const stx = `SELECT is_approved FROM approval_attendance WHERE "requestId" = $1 AND order_approved < $2`
    return exeQuery(stx, [param.requestId, order])
}

export const chkApproverAboveMe = async (param: formModal, order: number) => {
    const stx = `SELECT is_approved FROM approval_attendance WHERE "requestId" = $1 AND order_approved > $2`
    return exeQuery(stx, [param.requestId, order])
}

export const getDatesofRequest = async (param: formModal) => {
    const stx = `SELECT start_date, end_date FROM request_attendance WHERE id = $1`
    return exeQuery(stx, [param.requestId])
}

export const getDatesofRequestOverride = async (param: formModal) => {
    const stx = `SELECT start_date, end_date FROM request_attendance WHERE id = $1`
    return exeQuery(stx, [param.id])
}

export const getRequestEmpId = async (param: formModal) => {
    const stx = `SELECT "employeeId" FROM request_attendance WHERE id = $1`
    return exeQuery(stx, [param.requestId])
}

export const getRequestEmpIdOverride = async (param: formModal) => {
    const stx = `SELECT "employeeId" FROM request_attendance WHERE id = $1`
    return exeQuery(stx, [param.id])
}

export const addRowForAttendance = async (param: formModal, session: ISession, dateInsert: any, empId: any) => {
    const stx = `INSERT INTO attendance ("employeeId", created_at, check_in, check_out, "createdById", "approvedById", "requestId", is_approved, check_type) VALUES ($1, $2, $2, $2, $3, $4, $5, $6, $7)`
    return exeQuery(stx, [empId, dateInsert, session.id, session.emp, param.requestId, 1, param.requestTypeId])
}

export const addRowForAttendanceOverride = async (param: formModal, session: ISession, dateInsert: any, empId: any) => {
    const stx = `INSERT INTO attendance ("employeeId", created_at, check_in, check_out, "createdById", "approvedById", "requestId", is_approved, check_type) VALUES ($1, $2, $2, $2, $3, $4, $5, $6, $7)`
    return exeQuery(stx, [empId, dateInsert, session.id, session.emp, param.id, 1, param.requestTypeId])
}

export const addAttendance = async (empId: number, start: any, end: any, user_id: any, user_emp: number, requestId: any, requestTypeId: number, description: string) => {
    const stx = `INSERT INTO attendance ("employeeId", created_at, check_in, check_out, "createdById", "approvedById", "requestId", is_approved, check_type, desc_in) VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9)`
    return exeQuery(stx, [empId, start, end, user_id, user_emp, requestId, 1, requestTypeId, description])
}

export const updateLeaveRemEmp = async (empId: number, sisa: number) => {
    const stx = `UPDATE mst_employee SET saldo_cuti = $1 WHERE id = $2`
    return exeQuery(stx, [sisa, empId])
}

export const reject = async (param: formModal, session: ISession) => {
    const syntax = `UPDATE approval_attendance SET is_approved = 0, "updatedById" = $2, description = $3, updated_at = current_timestamp WHERE id = $1 RETURNING *`;
    const syntaxReq = `UPDATE request_attendance SET is_approved = 0, "approvedById" = $2, "updatedById" = $3, updated_at = current_timestamp WHERE id = $1 RETURNING *`;

    await exeQuery(syntaxReq, [param.requestId, session.emp, session.id])
    return exeQuery(syntax, [param.id, session.id, param.reject || null])
}

export const checkRequestType = async (reqId: number) => {
    const stx = `SELECT tipe FROM mst_request_type WHERE id = $1`
    return exeQuery(stx, [reqId])
}

export const checkBlankApprovalLine = async () => {
    return exeQuery(`SELECT A.id AS "requestId", A."employeeId" FROM request_attendance A LEFT JOIN approval_attendance B ON A.id = B."requestId" WHERE B.id IS NULL ORDER BY "requestId" ASC`, [])
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

export const findClockIn = (param: formModal) => {
    const syntax = `SELECT 1 FROM attendance A WHERE A."employeeId" = $1 AND DATE(A.created_at) = CURRENT_DATE`;
    return exeQuery(syntax, [param.id || ''])
}