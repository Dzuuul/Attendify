import { exeQuery } from "../../../../lib/db";
import { IForm } from "../../../../interfaces/approval_joint_leave.interface";
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
    const syntax = `SELECT row_number() OVER (ORDER BY A.id) AS number, A.id, UPPER(D.username) AS username, UPPER(C.fullname) AS approval, A.status, A.order_approved AS order, A."userId", A."approvalId"
    FROM mst_approval_joint_leave A
    LEFT JOIN mst_employee C ON A."approvalId" = C.id
    JOIN users D ON A."userId" = D.id
    WHERE A.is_deleted = 0` 
    return exeQuery(syntax, [])
}

export const findOrder = (param: IForm) => {
    const syntax = `SELECT COUNT(id) AS last_row FROM mst_approval_joint_leave WHERE "userId" = $1 AND status = 1`;
    return exeQuery(syntax, [param.userId])
}

export const save = (param: IForm, session: ISession) => {
    const syntax = `INSERT INTO mst_approval_joint_leave ("userId", "approvalId", status, order_approved, "createdById") VALUES ($1,$2,$3,$4,$5) RETURNING *`;

    return exeQuery(syntax, [param.userId || null, param.approvalId, param.status, param.order, session.id])
}

export const update = (param: IForm, session: ISession) => {
    const syntax = `UPDATE mst_approval_joint_leave SET "userId" = $1, "approvalId" = $2, order_approved = $3, status = $4, "updatedById" = $5, updated_at = current_timestamp WHERE id = $6 AND is_deleted = 0`;
    
    return exeQuery(syntax, [param.userId || '', param.approvalId, param.order, param.status, session.id, param.id || '',])
}

export const findOne = (param: IForm) => {
    const syntax = `SELECT id FROM mst_approval_joint_leave A WHERE A."userId" = $1 AND A."approvalId" = $2 AND A.order_approved = $3 AND A.status = $4 AND A.is_deleted = 0`;
    return exeQuery(syntax, [param.userId || '', param.approvalId || '', param.order, param.status])
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
    const syntax = `SELECT id FROM mst_approval_joint_leave A WHERE A.description = $1 AND A.id != $2 AND A.is_deleted = 0`;
    //return exeQuery(syntax, [param.description || '', param.id || ""])
}