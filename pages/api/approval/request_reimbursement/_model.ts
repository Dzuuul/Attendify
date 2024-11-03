import { exeQuery } from "../../../../lib/db";
import { ApprovalForm, IPagination } from "../../../../interfaces/approval_reimbursement.interface";
import { ISession } from 'interfaces/common.interface';

interface IntfC {
    id: string;
    title: string;
    content: string;
    picture: string;
}

const accessIdWhere = (session : ISession) => {
    if (session.accessId == 5) {
        return `AND D."deptId" = '${session.deptId}'`;
    } else {
        return "";
    }
};

const dateWhere = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
        return "";
    } else {
        return ` AND DATE(B.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    }
};

const keyWhere = (params: IPagination) => {
    const {key} = params
    if (!key) {
        return "";
    } else {
        return ` AND (D.fullname LIKE '%${key}%' OR D.id_employee LIKE '%${key}%' OR B.title LIKE '%${key}%')`;
    }
};

const orderBy = (params: IPagination) => {
    const {direction, column} = params
    const directionType =
        direction == "ascend" ? "ASC" : direction == "descend" ? "DESC" : "";
    if (!column || !directionType) {
        return " ORDER BY B.created_at DESC";
    } else {
        return ` ORDER BY ${column} ${directionType}`;
    }
};

const verifWhere = (isApproved: any) => {
    if (!isApproved) {
        return "";
    } else {
        switch(isApproved) {
            case '1':
                return ` AND (B.is_approved = 1 AND B.status = 1)`;
            case '2':
                return ` AND (B.is_approved = 1 AND B.status = 2)`;
            case '3':
                return ` AND (B.is_approved = 1 AND B.status = 3)`;
            case '4':
                return ` AND (B.is_approved = 1 AND B.status = 4)`;
            case '5':
                return ` AND (B.status = 5)`;
            case '6':
                return ` AND (B.status IS NULL AND B.is_approved IS NULL)`;
            case '0':
                return ` AND (B.is_approved = 0)`;
        }
    }
}

const approveWhere = (session : ISession) => {
    return `AND A."approvedById" = ${session.emp}`;
};

export const countLists = (params: IPagination, session: ISession) => {
    let countQuery = 
    `SELECT COUNT(*) OVER () AS counts
    FROM approval_reimburse A
    JOIN reimburse B ON A."reimburseId" = B.id
    JOIN mst_reimburse_type C ON B."reimburseTypeId" = C.id
    JOIN mst_employee D ON B."employeeId" = D.id
    LEFT JOIN (SELECT id, "reimburseId", "approvedById", description, is_approved, order_approved FROM approval_reimburse ORDER BY order_approved DESC) E ON A."reimburseId" = E."reimburseId"
    LEFT JOIN mst_employee F ON E."approvedById" = F.id
    LEFT JOIN mst_employee G ON B."approvedById" = G.id
    LEFT JOIN (SELECT description, "reimburseId" FROM approval_reimburse WHERE description IS NOT NULL ORDER BY order_approved DESC) H ON A."reimburseId" = H."reimburseId"
    LEFT JOIN reimburse_media X ON X."reimburseId" = B.id
    LEFT JOIN general_parameter Z ON Z.name = 'imgUrl'
	 WHERE B.is_deleted = 0
    ${approveWhere(session)}
    ${dateWhere(params.startDate, params.endDate)}
    ${verifWhere(params.isApproved)} 
    ${keyWhere(params)}
    GROUP BY A.id, B.id, C.id, D.id, G.id, H.description, X.id, Z.id
    `;
    return exeQuery(countQuery, []);
};


// let listQuery = 
    // `SELECT A.id, B.id AS "reimburseId", A."reimburseId", D.id_employee AS "empId", B.receipt_date, B.title, B.amount, Z.value || X.url AS src, D.fullname, D.saldo_cuti, C.description AS type, B.description, B.status, A."approvedById", ARRAY_AGG(F.fullname) AS need_approve, A.is_approved, G.fullname AS last_approve, A.description AS reject, B."reimburseTypeId", ARRAY_AGG(CASE WHEN E.is_approved = 1 THEN 'APPROVED' ELSE CASE WHEN E.is_approved = 0 THEN 'REJECTED' ELSE '-' END END) AS status_approve
    // FROM approval_reimburse A
    // JOIN reimburse B ON A."reimburseId" = B.id
    // JOIN mst_reimburse_type C ON B."reimburseTypeId" = C.id
    // JOIN mst_employee D ON B."employeeId" = D.id
    // LEFT JOIN approval_reimburse E ON A."reimburseId" = E."reimburseId"
    // LEFT JOIN mst_employee F ON E."approvedById" = F.id
    // LEFT JOIN mst_employee G ON B."approvedById" = G.id
    // LEFT JOIN reimburse_media X ON X."reimburseId" = B.id
    // LEFT JOIN general_parameter Z ON Z.name = 'imgUrl'
    //      WHERE B.is_deleted = 0
    //     ${approveWhere(session)}
    //     ${accessIdWhere(session)}
    //     ${dateWhere(params.startDate, params.endDate)}
    //     ${verifWhere(params.isApproved)} 
    //     ${keyWhere(params)}
    //     GROUP BY A.id, B.id, C.id, D.id, G.id, X.id, Z.id
    //     ${params.limit}`;

export const list = (params: IPagination, session: ISession) => {
    let listQuery = 
    `SELECT B.created_at, A.id, B.id AS "reimburseId", A."reimburseId", D.id_employee AS "empId", B.receipt_date, B.title, B.amount, Z.value || X.url AS src, D.fullname, D.saldo_cuti, C.description AS type, B.description, B.status, A."approvedById", ARRAY_AGG(F.fullname ORDER BY E.order_approved ASC) AS need_approve, A.is_approved, B.is_approved is_approved_r, G.fullname AS last_approve, STRING_AGG(E.description, ', ') AS reject, B."reimburseTypeId", ARRAY_AGG(CASE WHEN E.is_approved = 1 THEN 'APPROVED' ELSE CASE WHEN E.is_approved = 0 THEN 'REJECTED' ELSE '-' END END ORDER BY E.order_approved ASC) AS status_approve
    FROM approval_reimburse A
    JOIN reimburse B ON A."reimburseId" = B.id
    JOIN mst_reimburse_type C ON B."reimburseTypeId" = C.id
    JOIN mst_employee D ON B."employeeId" = D.id
    LEFT JOIN (SELECT id, "reimburseId", "approvedById", description, is_approved, order_approved FROM approval_reimburse ORDER BY order_approved ASC) E ON A."reimburseId" = E."reimburseId"
    LEFT JOIN mst_employee F ON E."approvedById" = F.id
    LEFT JOIN mst_employee G ON B."approvedById" = G.id
    LEFT JOIN (SELECT description, "reimburseId" FROM approval_reimburse WHERE description IS NOT NULL ORDER BY order_approved ASC) H ON A."reimburseId" = H."reimburseId"
    LEFT JOIN reimburse_media X ON X."reimburseId" = B.id
    LEFT JOIN general_parameter Z ON Z.name = 'imgUrl'
         WHERE B.is_deleted = 0
        ${approveWhere(session)}
        ${dateWhere(params.startDate, params.endDate)}
        ${verifWhere(params.isApproved)}
        ${keyWhere(params)}
        GROUP BY A.id, B.id, C.id, D.id, G.id, H.description, X.id, Z.id
        ${orderBy(params)}
        ${params.limit}`;
    return exeQuery(listQuery, []);
};

export const listById = (id: number) => {
    let listQuery = `SELECT row_number() OVER(ORDER BY reimburse.created_at DESC) AS number, reimburse.id, reimburse.title, reimburse.receipt_date, reimburse.amount, reimburse.description, reimburse.status, reimburse.is_approved 
    FROM reimburse WHERE reimburse.is_deleted = 0 AND reimburse."employeeId" = $1`;
    return exeQuery(listQuery, [id]);
};

export const detail = (id: string) => {
    let queryDetail = `SELECT * FROM reimburse WHERE id = ?`;
    return exeQuery(queryDetail, [id]);
};

export const deleteData = (id: string) => {
    let syntax = `UPDATE reimburse SET is_deleted = 1, updated_at = current_timestamp where id = $1`
    return exeQuery(syntax, [id])
}

export const deleteDataApprv = (id: string) => {
    let syntax = `DELETE FROM approval_reimburse WHERE "reimburseId" = $1`
    return exeQuery(syntax, [id])
}

export const deleteDataItems = (id: string) => {
    let syntax = `DELETE FROM reimburse_item WHERE "reimburseId" = $1`
    return exeQuery(syntax, [id])
}

export const deleteDataImgs = (id: string) => {
    let syntax = `DELETE FROM reimburse_media WHERE "reimburseId" = $1`
    return exeQuery(syntax, [id])
}

export const getUserId = (uname: string) => {
    let stx = `SELECT "employeeId" FROM users WHERE username = $1`
    return exeQuery(stx, [uname])
}

export const getTipeRemType = (id: any) => {
    const stx = `SELECT tipe FROM mst_reimburse_type WHERE id = $1`
    return exeQuery(stx, [id])
}

export const getApproverByDivReimAndType = (id: any, type: number) => {
    const stx = `SELECT "supervisorId", order_approved AS urutan FROM mst_approval_reimburse WHERE "divId" = $1 AND "reimburseTypeId" = $2 ORDER BY "urutan"`
    return exeQuery(stx, [id, type])
}

export const requestReimburse = (empId: number, date: any, amount: number, desc: string, remType: any, remTitle: string, address: string, session: ISession) => {
    const stx = `INSERT INTO reimburse ("createdById", "employeeId", receipt_date, amount, description, "reimburseTypeId", title, address) VALUES ($8, $1, $2, $3, $4, $5, $6, $7) RETURNING *`
    return exeQuery(stx, [empId, date, amount, desc, remType, remTitle, address, session.id])
}

export const modifyReimburse = (id: number,  date: any, amount: number, desc: string, remType: any, remTitle: string, address: string) => {
    const stx = `UPDATE reimburse SET receipt_date = $1, amount = $2, description = $3, "reimburseTypeId" = $4, title = $5, address = $6 WHERE id = $7`
    return exeQuery(stx, [date, amount, desc, remType, remTitle, address, id])
}

export const deleteAllAttachmentsByRem = (reqId: number) => {
    const stx = `DELETE FROM reimburse_media WHERE "reimburseId" = $1`
    return exeQuery(stx, [reqId])
}

export const changeReqReimburse = (reqId: number, date: any, amount: number, desc: string) => {
    const stx = `UPDATE reimburse SET receipt_date = $1, amount = $2, "description" = $3 WHERE id = $4 RETURNING *`
    return exeQuery(stx, [date, amount, desc, reqId])
}

export const addAttachment = (empId: number, reimId: any, url: string, session: ISession) => {
    const stx = `INSERT INTO reimburse_media ("createdById", "employeeId", "reimburseId", url) VALUES ($4, $1, $2, $3) RETURNING *`
    return exeQuery(stx, [empId, reimId, url, session.id])
}

export const addReqApproval = (session: ISession, appvId: number, reqId: number, sorter: number) => {
    const stx = `INSERT INTO approval_reimburse ("createdById", "approvedById", "reimburseId", order_approved) VALUES ($1, $2, $3, $4) RETURNING *`
    return exeQuery(stx, [session.id, appvId, reqId, sorter])
}

export const addToRemItems = (itemName: string, quantity: number, price: number, remId: any) => {
    const stx = `INSERT INTO reimburse_item (name, quantity, amount, "reimburseId") VALUES ($1, $2, $3, $4) RETURNING *`
    return exeQuery(stx, [itemName, quantity, price, remId])
}

export const reimburseDetail = (id: number) => {
    const stx = 'SELECT * FROM reimburse WHERE id = $1'

    return exeQuery(stx, [id])
}

export const reimburseApprvID = (id: number) => {
    const stx = 'SELECT id FROM approval_reimburse WHERE "reimburseId" = $1 LIMIT 1'
    return exeQuery(stx, [id])
}

export const reimburseImages = (id: number) => {
    const stx = `SELECT general_parameter.value || url AS src FROM reimburse_media LEFT JOIN general_parameter ON general_parameter.name = 'imgUrl' WHERE "reimburseId" = $1`

    return exeQuery(stx, [id])
}

export const reimburseItems = (id: number) => {
    const stx = 'SELECT name AS "itemName", name, quantity, amount as price, quantity * amount AS "totalPrice", is_checked, note FROM reimburse_item WHERE "reimburseId" = $1'

    return exeQuery(stx, [id])
}

export const modifyRemItems = (isChecked: number, note: string, id: any) => {
    const stx = `UPDATE reimburse_item SET is_checked = $1, note = $2 WHERE id = $3`
    return exeQuery(stx, [isChecked || 0, note || '', id])
}

export const modifyTotalPriceReimburse = (userId: number, amount: number, extNote: string, id: any) => {
    const stx = `UPDATE reimburse SET "updatedById" = $1, amount = $2, paid_notes = $3 WHERE id = $4`
    return exeQuery(stx, [userId, amount, extNote, id])
}

export const getItemId = (itemName: string, quantity: number, price: number, remId: any) => {
    const stx = `SELECT id FROM reimburse_item WHERE "reimburseId" = $1 AND NAME = $2 AND quantity = $3 AND amount = $4`
    return exeQuery(stx, [remId, itemName, quantity, price])
}

export const approve = async (param: ApprovalForm, session: ISession) => {
    const syntax = `UPDATE approval_reimburse SET is_approved = 1, "updatedById" = $2, updated_at = current_timestamp WHERE id = $1`;
    return exeQuery(syntax, [param.id, session.id])
}

export const changeReimStat = async (param: ApprovalForm, session: ISession) => {
    const syntaxReq = `UPDATE reimburse SET status = 5, "updatedById" = $2, updated_at = current_timestamp WHERE id = $1`;
    await exeQuery(syntaxReq, [param.reimburseId, session.id])
}

export const chkReverseApprove = async (param: ApprovalForm, session: ISession) => {
    const syntax = `SELECT * FROM approval_reimburse WHERE is_approved = 1 AND "updatedById" = $2 AND id = $1`;
    return exeQuery(syntax, [param.id, session.id])
}

export const approveLast = async (param: ApprovalForm, session: ISession) => {
    const syntaxReq = `UPDATE reimburse SET is_approved = 1, status = 1, "approvedById" = $2, "updatedById" = $3, updated_at = current_timestamp WHERE id = $1`;
    await exeQuery(syntaxReq, [param.reimburseId, session.emp, session.id])
}

export const chkOrderApprov = async (param: ApprovalForm, session: ISession) => {
    const stx = `SELECT order_approved FROM approval_reimburse WHERE "reimburseId" = $1 AND "approvedById" = $2`
    return exeQuery(stx, [param.reimburseId, session.emp])
}

export const chkApproverBelowMe = async (param: ApprovalForm, order: number) => {
    const stx = `SELECT is_approved FROM approval_reimburse WHERE "reimburseId" = $1 AND order_approved < $2`
    return exeQuery(stx, [param.reimburseId, order])
}

export const chkApproverAboveMe = async (param: ApprovalForm, order: number) => {
    const stx = `SELECT is_approved FROM approval_reimburse WHERE "reimburseId" = $1 AND order_approved > $2`
    return exeQuery(stx, [param.reimburseId, order])
}

export const reject = async (param: ApprovalForm, session: ISession) => {
    const syntax = `UPDATE approval_reimburse SET is_approved = 0, "updatedById" = $2, description = $3, updated_at = current_timestamp WHERE id = $1 RETURNING *`;
    const syntaxReq = `UPDATE reimburse SET is_approved = 0, status = 0, "approvedById" = $2, "updatedById" = $3, updated_at = current_timestamp WHERE id = $1 RETURNING *`;

    await exeQuery(syntaxReq, [param.reimburseId, session.emp, session.id])
    return exeQuery(syntax, [param.id, session.id, param.reject || ''])
}

export const checkReimburseType = async (reqId: number) => {
    const stx = `SELECT tipe FROM mst_reimburse_type WHERE id = $1`
    return exeQuery(stx, [reqId])
}

export const getRequestEmpId = async (param: ApprovalForm) => {
    const stx = `SELECT "employeeId", "reimburseTypeId" FROM reimburse WHERE id = $1`
    return exeQuery(stx, [param.reimburseId])
}

export const chkReimburseStatus = async (param: ApprovalForm) => {
    const syntax = `SELECT status, amount, "employeeId" FROM reimburse WHERE id = $1`;
    return exeQuery(syntax, [param.reimburseId])
}

export const reduceSaldo = async (reimburseId: number, saldo: number) => {
    const syntax = `UPDATE reimburse SET saldo_pengobatan = $2 WHERE id = $1`;
    return exeQuery(syntax, [reimburseId, saldo])
}

export const setReimburseReady = async (status: number, param: ApprovalForm, session: ISession) => {
    const syntax = `UPDATE reimburse SET status = $3, "updatedById" = $2, updated_at = current_timestamp WHERE id = $1`;
    return exeQuery(syntax, [param.reimburseId, session.id, status])
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