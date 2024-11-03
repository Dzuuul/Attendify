import { exeQuery } from "../../../../lib/db";
import { IForm } from "../../../../interfaces/approval_line.interface";
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

export const list = (params: IParams) => {
    const syntax = `SELECT row_number() OVER (ORDER BY A.id) AS number, A.id, B.description AS division, UPPER(C.fullname) AS supervisor, A.status, A.order_approved AS order, A."divId", A."supervisorId"
    FROM mst_approval_line A
    JOIN mst_division B ON A."divId" = B.id
    JOIN mst_employee C ON A."supervisorId" = C.id
    WHERE A.is_deleted = 0` 
    return exeQuery(syntax, [])
}

export const findOrder = (param: IForm) => {
    const syntax = `SELECT COUNT(id) AS last_row FROM mst_approval_line WHERE "divId" = $1 AND status = 1`;
    return exeQuery(syntax, [param.divId])
}

export const save = (param: IForm, session: ISession) => {
    const syntax = `INSERT INTO mst_approval_line ("divId", "supervisorId", status, order_approved, "createdById") VALUES ($1,$2,$3,$4,$5) RETURNING *`;

    return exeQuery(syntax, [param.divId || null, param.supervisorId, param.status, param.order, session.id])
}

export const update = (param: IForm, session: ISession) => {
    const syntax = `UPDATE mst_approval_line SET "divId" = $1, "supervisorId" = $2, order_approved = $3, status = $4, "updatedById" = $5, updated_at = current_timestamp WHERE id = $6 AND is_deleted = 0`;
    
    return exeQuery(syntax, [param.divId || '', param.supervisorId, param.order, param.status || '', session.id, param.id || '',])
}

export const findOne = (param: IForm) => {
    const syntax = `SELECT id FROM mst_approval_line A WHERE A."divId" = $1 AND A."supervisorId" = $2 AND A.order_approved = $3 AND A.is_deleted = 0`;
    return exeQuery(syntax, [param.divId || '', param.supervisorId || '', param.order])
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

export const findDuplicate = (param: IForm) => {
    const syntax = `SELECT id FROM mst_approval_line A WHERE A.description = $1 AND A.id != $2 AND A.is_deleted = 0`;
    //return exeQuery(syntax, [param.description || '', param.id || ""])
}