import { exeQuery } from "../../../../lib/db";
import { formModal, IPagination } from "interfaces/approval_timeoff.interface";
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
    const { direction, column } = params
    const directionType =
        direction == "ascend" ? "ASC" : direction == "descend" ? "DESC" : "";
    if (column == "" || directionType == "") {
        // return ` ORDER BY A.is_approved NULLS FIRST, A."approvedById" NULLS FIRST, DATE(B.created_at) DESC`;
        return ` ORDER BY A.id DESC`;
    } else {
        return ` ORDER BY ${column} ${directionType}`;
    }
};

const statusWhere = (params: IPagination) => {
    const { status } = params
    if (status == "null") {
        return ` AND A.is_approved IS NULL`;
    }
    if (status) {
        return ` AND A.is_approved = ${status}`;
    } else {
        return "";
    }
};

const dateWhere = (params: IPagination) => {
    const { startDate, endDate } = params
    if (startDate == "" && endDate == "") {
        return "";
    }
    if (startDate && endDate) {
        return `  AND (DATE(A.start_date) BETWEEN '${startDate}' AND '${endDate}'
        AND DATE(A.end_date) BETWEEN '${startDate}' AND '${endDate}' OR DATE(A.created_at) BETWEEN '${startDate}' AND '${endDate}')`;
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

const accessIdWhere = (session: ISession) => {
    if (session.accessId == 5) {
        return `AND D."deptId" = '${session.deptId}'`;
    } else {
        return "";
    }
};

const approveWhere = (session: ISession) => {
    if (session.accessId == 5 || session.accessId == 9) {
        return `AND B."approvedById" = ${session.emp}`;
    } else {
        return "";
    }
};

export const countList = (params: IParams, session: ISession) => {
    const syntax = `SELECT 
    COUNT(*) over () AS counts
    FROM approval_attendance B
    JOIN request_attendance A ON B."requestId" = A.id
    JOIN mst_request_type C ON A."requestTypeId" = C.id
    JOIN mst_employee D ON A."employeeId" = D.id
    LEFT JOIN approval_attendance E ON B."requestId" = E."requestId"
    LEFT JOIN mst_employee F ON E."approvedById" = F.id
    LEFT JOIN mst_employee G ON A."approvedById" = G.id
    WHERE 1=1 AND A.is_deleted = 0 AND C.tipe != 1 ${approveWhere(session)} ${keyWhere(params)} ${statusWhere(params)} ${dateWhere(params)}
    GROUP BY A.id, B.id, C.id, D.id, G.id`

    return exeQuery(syntax, [])
}

export const list = (params: IPagination, session: ISession) => {
    const syntax = `SELECT B.id, B."requestId", D.fullname, D.saldo_cuti, C.description AS type, A.created_at, CASE WHEN A.start_date IS NULL THEN A.created_at ELSE A.start_date END, A.end_date, A.description, CASE WHEN A.is_approved IS NULL THEN 'NOT YET APPROVED' ELSE CASE WHEN A.is_approved = 1 THEN 'APPROVED' ELSE 'REJECTED' END END AS status, B."approvedById", ARRAY_AGG(F.fullname) AS need_approve, A.is_approved, G.fullname AS last_approve, B.description AS reject, A."requestTypeId", ARRAY_AGG(CASE WHEN E.is_approved = 1 THEN 'APPROVED' ELSE CASE WHEN E.is_approved = 0 THEN 'REJECTED' ELSE '-' END END) AS status_approve
    FROM approval_attendance B
    JOIN request_attendance A ON B."requestId" = A.id
    JOIN mst_request_type C ON A."requestTypeId" = C.id
    JOIN mst_employee D ON A."employeeId" = D.id
    LEFT JOIN approval_attendance E ON B."requestId" = E."requestId"
    LEFT JOIN mst_employee F ON E."approvedById" = F.id
    LEFT JOIN mst_employee G ON A."approvedById" = G.id
    WHERE 1=1 AND A.is_deleted = 0 AND C.tipe != 1 ${approveWhere(session)} ${keyWhere(params)} ${statusWhere(params)} ${dateWhere(params)}
    GROUP BY A.id, B.id, C.id, D.id, G.id
    ${orderBy(params)} ${params.limit ? params.limit : ""}`;
    
    return exeQuery(syntax, [])
}

export const countListAll = (params: IPagination, session: ISession) => {
    const syntax = `SELECT 
    COUNT(*) over () AS counts
    FROM request_attendance A
    JOIN mst_request_type B ON A."requestTypeId" = B.id
    LEFT JOIN approval_attendance C ON A.id = C."requestId"
    LEFT JOIN mst_employee D ON C."approvedById" = D.id
    LEFT JOIN mst_employee E ON A."employeeId" = E.id
    LEFT JOIN mst_employee F ON A."approvedById" = F.id
    WHERE 1=1 AND A.is_deleted = 0 AND B.tipe != 1 ${statusWhere(params)} ${keyWhere(params)} ${dateWhere(params)}
    GROUP BY A.id, B.id, F.id, E.id`

    return exeQuery(syntax, [])
}

export const listAll = (params: IPagination, session: ISession) => {
    const syntax = `SELECT A.id, A.is_approved, E.fullname, UPPER(B.description) AS type, B.created_at, CASE WHEN A.start_date IS NULL THEN A.created_at ELSE A.start_date END, A.end_date, A.description, CASE WHEN A.is_approved IS NULL THEN 'NOT YET APPROVED' ELSE CASE WHEN A.is_approved = 1 THEN 'APPROVED' ELSE 'REJECTED' END END AS status, A."approvedById", ARRAY_AGG(D.fullname) AS need_approve, ARRAY_AGG(CASE WHEN C.is_approved = 1 THEN 'APPROVED' ELSE CASE WHEN C.is_approved = 0 THEN 'REJECTED' ELSE '-' END END) AS status_approve, F.fullname AS last_approve, A."requestTypeId", E.saldo_cuti, ARRAY_AGG(CASE WHEN C.description IS NOT NULL THEN C.description ELSE '' END) AS reject
    FROM request_attendance A
    JOIN mst_request_type B ON A."requestTypeId" = B.id
    LEFT JOIN approval_attendance C ON A.id = C."requestId"
    LEFT JOIN mst_employee D ON C."approvedById" = D.id
    LEFT JOIN mst_employee E ON A."employeeId" = E.id
    LEFT JOIN mst_employee F ON A."approvedById" = F.id
    WHERE 1=1 AND A.is_deleted = 0 AND B.tipe != 1 ${statusWhere(params)} ${keyWhere(params)} ${dateWhere(params)}
    GROUP BY A.id, B.id, F.id, E.id  ${orderBy(params)} ${params.limit ? params.limit : ""}`

    return exeQuery(syntax, [])
}

export const xport = (params: IPagination, session: ISession) => {
    const syntax = `SELECT row_number() OVER(${orderBy(params)}) AS no, E.fullname, UPPER(B.description) AS type, B.created_at, CASE WHEN A.start_date IS NULL THEN A.created_at ELSE A.start_date END, A.end_date, A.description, CASE WHEN A.is_approved IS NULL THEN 'NOT YET APPROVED' ELSE CASE WHEN A.is_approved = 1 THEN 'APPROVED' ELSE 'REJECTED' END END AS status, ARRAY_AGG(D.fullname) AS need_approve, ARRAY_AGG(CASE WHEN C.is_approved = 1 THEN 'APPROVED' ELSE CASE WHEN C.is_approved = 0 THEN 'REJECTED' ELSE '-' END END) AS status_approve, E.saldo_cuti, ARRAY_AGG(CASE WHEN C.description IS NOT NULL THEN C.description ELSE '' END) AS reject
    FROM request_attendance A
    JOIN mst_request_type B ON A."requestTypeId" = B.id
    LEFT JOIN approval_attendance C ON A.id = C."requestId"
    LEFT JOIN mst_employee D ON C."approvedById" = D.id
    LEFT JOIN mst_employee E ON A."employeeId" = E.id
    WHERE 1=1 AND A.is_deleted = 0 AND B.tipe != 1 ${statusWhere(params)} ${dateWhere(params)}
    GROUP BY A.id, B.id, E.id  ${orderBy(params)} ${params.limit ? params.limit : ""}`

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

// export const updateLeaveRemEmp = async (empId: number, sisa: number) => {
//     const stx = `UPDATE mst_employee SET saldo_cuti = $1, updated_at = current_timestamp WHERE id = $2`
//     return exeQuery(stx, [sisa, empId])
// }

export const updateTrsEmpLeave = async (param: any) => {
    const stx = `UPDATE trs_emp_leave SET "reqId" = $1, status = 2, date = $2, "jointLeaveId" = null, "createdById" = $3, "updatedById" = $4, "deletedById" = null, is_deleted = 0, updated_at = current_timestamp WHERE id = $5`
    return exeQuery(stx, [param.reqId, param.date, param.byId, param.byId, param.id])
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

export const findOne = (param: formModal) => {
    const syntax = `SELECT id FROM request_attendance WHERE id = ${param.id} AND is_deleted = 0`;
    return exeQuery(syntax, [])
}

export const deleteData = (param: formModal, session: ISession) => {
    const syntax = `UPDATE request_attendance SET is_deleted = 1, "deletedById" = ${session.id}, updated_at = current_timestamp WHERE id = ${param.id}`;
    return exeQuery(syntax, [])
}

export const ListEmpTrsId = (id: number) => {
    const syntax = `
SELECT
    B.min_id,
    COALESCE(B."employeeId", A.id) as employee_id,
    COALESCE(B.sisa_cuti, 0) AS remaining_days_off
FROM
    mst_employee AS A
    LEFT JOIN (
        SELECT
            MIN(id) as min_id,
            "employeeId",
            COUNT(*) AS sisa_cuti
        FROM
            trs_emp_leave
        WHERE
            status = 1
        GROUP BY
            "employeeId"
    ) AS B ON A.id = B."employeeId"
WHERE
    (A.resign_date = 'NULL' OR resign_date IS NULL)
    AND A.id = $1
ORDER BY
    employee_id ASC;`;
    return exeQuery(syntax, [id])
}

export const updateMstEmp = (param: any) => {
    const syntax = `UPDATE mst_employee SET saldo_cuti = $1 WHERE id = $2`;
    return exeQuery(syntax, [param.saldoCuti, param.id])
}

export const selectUser = (employeeId: number) => {
    const syntax = `SELECT id FROM users WHERE "employeeId" = $1`;
    return exeQuery(syntax, [employeeId])
}