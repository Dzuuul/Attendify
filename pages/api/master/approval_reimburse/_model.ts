import { exeQuery } from "../../../../lib/db";
import { IMasterForm } from "../../../../interfaces/approval_reimbursement.interface";
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
        return " ORDER BY A.id DESC";
    } else {
        return ` ORDER BY ${column} ${directionType}`;
    }
};

const keyWhere = (params: IParams) => {
    const { key } = params
    if (key == "") {
        return "";
    } else {
        return ` AND (UPPER(A.email) LIKE '%${key}%' OR UPPER(A.name) LIKE '%${key}%' OR UPPER(B.description) LIKE '%${key}%')`;
    }
};

const dateWhere = (startDate : string, endDate: string) => {
    if (startDate == "" || endDate == "") {
        return "";
    } else {
        return ` AND DATE(A.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    }
};

export const countLists = (params: IParams) => {
    const syntax = `SELECT 
    COUNT(*) OVER () AS counts
    FROM mst_approval_reimburse A
    JOIN mst_division B ON A."divId" = B.id
    JOIN mst_employee C ON A."supervisorId" = C.id
    WHERE A.is_deleted = 0 ORDER BY B.description, A.order_approved ASC`
    return exeQuery(syntax, [])
}

export const list = (params: IParams) => {
    const syntax = `SELECT A.id, A."reimburseTypeId" AS "remType", B.description AS "divisionTxt", UPPER(C.fullname) AS supervisor, A.status, A.order_approved AS order, A."divId", A."divId" AS division, A."supervisorId", A."supervisorId" AS approval
    FROM mst_approval_reimburse A
    JOIN mst_division B ON A."divId" = B.id
    JOIN mst_employee C ON A."supervisorId" = C.id
    WHERE A.is_deleted = 0 ORDER BY B.description, A.order_approved ASC ${params.limit}`
    return exeQuery(syntax, [])
}

export const findOrder = (param: IMasterForm) => {
    const syntax = `SELECT COUNT(id) AS last_row FROM mst_approval_reimburse WHERE "divId" = $1 AND status = 1`;
    return exeQuery(syntax, [param.division])
}

export const save = (param: IMasterForm, session: ISession) => {
    const syntax = `INSERT INTO mst_approval_reimburse ("divId", "supervisorId", status, order_approved, "createdById", "reimburseTypeId") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;

    return exeQuery(syntax, [param.division || null, param.approval, param.status, param.order, session.id, param.remType])
}

export const update = (param: IMasterForm, session: ISession) => {
    const syntax = `UPDATE mst_approval_reimburse SET "divId" = $1, "supervisorId" = $2, order_approved = $3, status = $4, "updatedById" = $5, "reimburseTypeId" = $7, updated_at = current_timestamp WHERE id = $6 AND is_deleted = 0`;
    
    return exeQuery(syntax, [param.division || '', param.approval, param.order, param.status || 0, session.id, param.id || '', param.remType])
}

export const remofe = (param: IMasterForm, session: ISession) => {
    const syntax = `UPDATE mst_approval_reimburse SET is_deleted = 1, "updatedById" = $1 WHERE id = $2 AND is_deleted = 0`;
    
    return exeQuery(syntax, [session.id, param.id || ''])
}

export const findOne = (param: IMasterForm) => {
    const syntax = `SELECT id FROM mst_approval_reimburse A WHERE A."divId" = $1 AND A."supervisorId" = $2 AND A.order_approved = $3 AND status = $4 AND A.is_deleted = 0`;
    return exeQuery(syntax, [param.division || '', param.approval || '', param.order, param.status])
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

export const findDuplicate = (param: IMasterForm) => {
    const syntax = `SELECT id FROM mst_approval_reimburse A WHERE A.description = $1 AND A.id != $2 AND A.is_deleted = 0`;
    //return exeQuery(syntax, [param.description || '', param.id || ""])
}