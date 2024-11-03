import { exeQuery } from "../../../lib/db";
import { formModal, IPagination } from "../../../interfaces/reimbursement.interface";
import { ISession } from 'interfaces/common.interface';
import moment from "moment";

interface IntfC {
    id: string;
    title: string;
    content: string;
    picture: string;
}

interface IParams {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
    startDate: string
    endDate: string
    isApproved: string | number
    employeeId: string | number
}

const dateWhere = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
        return "";
    } else {
        return ` AND DATE(reimburse.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    }
};

const keyWhere = (params: IPagination) => {
    const {key} = params
    if (!key) {
        return "";
    } else {
        return ` AND (reimburse.title LIKE "%${key}%" OR mst_employee.fullname LIKE "%${key}%")`;
    }
};

const orderBy = (params: IPagination) => {
    const {direction, column} = params
    const directionType =
        direction == "ascend" ? "ASC" : direction == "descend" ? "DESC" : "";
    if (!column || !directionType) {
        return " ORDER BY reimburse.created_at DESC";
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
                return ` AND (reimburse.is_approved = 1 AND reimburse.status = 1)`;
            case '2':
                return ` AND (reimburse.is_approved = 1 AND reimburse.status = 2)`;
            case '3':
                return ` AND (reimburse.is_approved = 1 AND reimburse.status = 3)`;
            case '4':
                return ` AND (reimburse.is_approved = 1 AND reimburse.status = 4)`;
            case '5':
                return ` AND (reimburse.status = 5)`;
            case '6':
                return ` AND (reimburse.status IS NULL AND reimburse.is_approved IS NULL)`;
            case '0':
                return ` AND (reimburse.is_approved = 0)`;
        }
    }
}

export const countLists = (params: IPagination) => {
    let countQuery = `SELECT COUNT(*) AS counts FROM reimburse
    LEFT JOIN reimburse_media ON reimburse.id = reimburse_media."reimburseId"
    LEFT JOIN general_parameter ON general_parameter.name = 'imgUrl'
    WHERE 1 = 1
    ${dateWhere(params.startDate, params.endDate)}
    ${verifWhere(params.isApproved)} 
    ${keyWhere(params)}
    `;
    return exeQuery(countQuery, []);
};

export const list = (params: IPagination) => {
    let listQuery = `SELECT row_number() OVER(ORDER BY reimburse.created_at DESC) AS number, reimburse.id, reimburse.id AS "reimburseId", mst_employee.fullname, reimburse.title, mst_employee.id_employee AS "empId", reimburse.receipt_date, reimburse.amount, reimburse.description, reimburse.status, reimburse.is_approved 
    FROM reimburse 
	 JOIN mst_employee ON reimburse."employeeId" = mst_employee.id
	 WHERE reimburse.is_deleted = 0
        ${dateWhere(params.startDate, params.endDate)}
        ${verifWhere(params.isApproved)} 
        ${keyWhere(params)}
        ${params.limit}`;
    return exeQuery(listQuery, []);
};

export const countListById = (params: IParams) => {
    let listQuery = `SELECT COUNT(*) OVER () AS counts
    FROM reimburse 
	 JOIN (SELECT id, "reimburseId", "approvedById", description, is_approved, order_approved FROM approval_reimburse ORDER BY order_approved ASC) approval_reimburse ON approval_reimburse."reimburseId" = reimburse.id
	 JOIN mst_employee ON approval_reimburse."approvedById" = mst_employee.id
	 JOIN mst_reimburse_type ON mst_reimburse_type.id = reimburse."reimburseTypeId"
	 LEFT JOIN (SELECT description, "reimburseId" FROM approval_reimburse WHERE description IS NOT NULL ORDER BY order_approved ASC) H ON approval_reimburse."reimburseId" = H."reimburseId"
	 WHERE reimburse.is_deleted = 0 AND reimburse."employeeId" = ${params.employeeId}
    ${dateWhere(params.startDate, params.endDate)}
    ${verifWhere(params.isApproved)}
    ${keyWhere(params)}
    GROUP BY reimburse.id, mst_reimburse_type.id, H.description
    ${orderBy(params)}`
    return exeQuery(listQuery, []);
};

export const listById = (params: IParams) => {
    let listQuery = `SELECT row_number() OVER(ORDER BY reimburse.created_at DESC) AS number, reimburse.created_at, reimburse.id, reimburse.id AS "reimburseId", reimburse.title, reimburse.receipt_date, reimburse.amount, reimburse.description, reimburse.status, reimburse.is_approved,
	ARRAY_AGG(mst_employee.fullname ORDER BY approval_reimburse.order_approved ASC) AS need_approve,
	H.description AS reject,
	reimburse."reimburseTypeId", ARRAY_AGG(CASE WHEN approval_reimburse.is_approved = 1 THEN 'APPROVED' ELSE CASE WHEN approval_reimburse.is_approved = 0 THEN 'REJECTED' ELSE '-' END END ORDER BY approval_reimburse.order_approved ASC) AS status_approve,
	mst_reimburse_type.description AS type, reimburse.paid_notes AS "extNote"
    FROM reimburse 
	 JOIN (SELECT id, "reimburseId", "approvedById", description, is_approved, order_approved FROM approval_reimburse ORDER BY order_approved ASC) approval_reimburse ON approval_reimburse."reimburseId" = reimburse.id
	 JOIN mst_employee ON approval_reimburse."approvedById" = mst_employee.id
	 JOIN mst_reimburse_type ON mst_reimburse_type.id = reimburse."reimburseTypeId"
	 LEFT JOIN (SELECT description, "reimburseId" FROM approval_reimburse WHERE description IS NOT NULL ORDER BY order_approved ASC) H ON approval_reimburse."reimburseId" = H."reimburseId"
	 WHERE reimburse.is_deleted = 0 AND reimburse."employeeId" = ${params.employeeId}
    ${dateWhere(params.startDate, params.endDate)}
    ${verifWhere(params.isApproved)}
    ${keyWhere(params)}
    GROUP BY reimburse.id, mst_reimburse_type.id, H.description
    ${orderBy(params)}
    ${params.limit}`
    return exeQuery(listQuery, []);
};

export const insert = (param: formModal) => {
    return exeQuery("INSERT INTO reimburse (receipt_date, amount, description, status) VALUES($1,$2,$3,$4,$5)", [param.receipt_date, param.amount, param.description, param.dtFile, param.status || ""])
}

export const detail = (id: string) => {
    let queryDetail = `SELECT * FROM reimburse WHERE id = ?`;
    return exeQuery(queryDetail, [id]);
};

export const edit = (param: formModal) => {
    let syntax = `UPDATE reimburse SET receipt_date = $1, amount = $2, filename = $3 where id = $5`
    return exeQuery(syntax, [param.receipt_date, param.amount, param.dtFile, param.status || "", param.id])
}

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

export const getSaldoAndMore = (id: number) => {
    let stx = `SELECT saldo_pengobatan FROM mst_employee WHERE id = $1`
    return exeQuery(stx, [id])
}

export const getOtherRequest = (id: number) => {
    let stx = `SELECT amount FROM reimburse WHERE (is_deleted != 1 AND (is_approved IS NULL OR is_approved != 1)) AND "employeeId" = $1 AND (SELECT TO_CHAR(date(receipt_date), 'YYYY-MM')) = (SELECT TO_CHAR(date(CURRENT_TIMESTAMP), 'YYYY-MM'))`
    return exeQuery(stx, [id])
}

export const getOtherRequestExcThis = (id: number, remId: number) => {
    let stx = `SELECT amount FROM reimburse WHERE (is_deleted != 1 AND (is_approved IS NULL OR is_approved != 1)) AND "employeeId" = $1 AND id != $2 AND (SELECT TO_CHAR(date(receipt_date), 'YYYY-MM')) = (SELECT TO_CHAR(date(CURRENT_TIMESTAMP), 'YYYY-MM'))`
    return exeQuery(stx, [id, remId])
}

export const getApprovNotClaimOtherRequest = (id: number) => {
    let stx = `SELECT amount FROM reimburse WHERE (status != 3 AND is_approved = 1) AND "employeeId" = $1 AND (SELECT TO_CHAR(date(receipt_date), 'YYYY-MM')) = (SELECT TO_CHAR(date(CURRENT_TIMESTAMP), 'YYYY-MM'))`
    return exeQuery(stx, [id])
}

export const getApprovNotClaimOtherRequestExcThis = (id: number, remId: number) => {
    let stx = `SELECT amount FROM reimburse WHERE (status != 3 AND is_approved = 1) AND "employeeId" = $1 AND id != $2 AND (SELECT TO_CHAR(date(receipt_date), 'YYYY-MM')) = (SELECT TO_CHAR(date(CURRENT_TIMESTAMP), 'YYYY-MM'))`
    return exeQuery(stx, [id, remId])
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

export const reimburseNameReu = (id: number) => {
    const stx = 'SELECT mst_employee.fullname FROM reimburse JOIN mst_employee ON reimburse."employeeId" = mst_employee.id WHERE reimburse.id = $1'
    return exeQuery(stx, [id])
}

export const reimburseID = (id: number) => {
    const stx = 'SELECT "reimburseId" FROM approval_reimburse WHERE id = $1'

    return exeQuery(stx, [id])
}

export const reimburseImages = (id: number) => {
    const stx = `SELECT general_parameter.value || url AS src FROM reimburse_media LEFT JOIN general_parameter ON general_parameter.name = 'imgUrl' WHERE "reimburseId" = $1`

    return exeQuery(stx, [id])
}

export const reimburseItems = (id: number) => {
    const stx = 'SELECT id AS key, name AS "itemName", name, quantity, amount as price, quantity * amount AS "totalPrice", is_checked, note FROM reimburse_item WHERE "reimburseId" = $1'

    return exeQuery(stx, [id])
}

export const allowanceReimburse = (id: number) => {
    const stx = 'SELECT saldo_pengobatan FROM mst_employee WHERE id = $1'

    return exeQuery(stx, [id])
}

export const previousReimburse = (empId: number, rg1: string, rg2: string) => {
    const stx = `SELECT SUM(amount) AS counts FROM reimburse WHERE "employeeId" = $1 AND is_deleted = 0 AND is_approved = 1 AND status = 4 AND DATE(receipt_date) >= '${rg1}' AND DATE(receipt_date) <= '${rg2}' GROUP BY id`
    return exeQuery(stx, [empId])
}

export const previousReimburseProcessed = (id: number, empId: number, rg1: string, rg2: string) => {
    const stx = `SELECT SUM(amount) AS counts FROM reimburse 
    LEFT JOIN (SELECT * FROM approval_reimburse WHERE is_approved = 1 LIMIT 1) approval_reimburse ON reimburse.id = approval_reimburse."reimburseId"
    WHERE "employeeId" = $2 AND is_deleted = 0 AND reimburse.id != $1 AND (reimburse.is_approved IS NULL OR (reimburse.is_approved = 1 AND reimburse."status" != 4)) AND DATE(reimburse.receipt_date) >= '${rg1}' AND DATE(reimburse.receipt_date) <= '${rg2}' GROUP BY reimburse.id`
    return exeQuery(stx, [id, empId])
}

export const previousReimburseProcessedAll = (empId: number, rg1: string, rg2: string) => {
    const stx = `SELECT SUM(amount) AS counts FROM reimburse 
    LEFT JOIN (SELECT * FROM approval_reimburse WHERE is_approved = 1 LIMIT 1) approval_reimburse ON reimburse.id = approval_reimburse."reimburseId"
    WHERE "employeeId" = $1 AND is_deleted = 0 AND (reimburse.is_approved IS NULL OR (reimburse.is_approved = 1 AND reimburse."status" != 4)) AND DATE(reimburse.receipt_date) >= '${rg1}' AND DATE(reimburse.receipt_date) <= '${rg2}' GROUP BY reimburse.id`
    return exeQuery(stx, [empId])
}

export const chkAlreadyApprReject = (id: number) => {
    const stx = `SELECT ARRAY_AGG(is_approved) AS status_approve FROM approval_reimburse WHERE "reimburseId" = $1 GROUP BY "reimburseId"`
    return exeQuery(stx, [id])
}

export const reimburseSeparator = () => {
    const stx = `SELECT value FROM general_parameter WHERE name = 'reimSeparator'`
    return exeQuery(stx, [])
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