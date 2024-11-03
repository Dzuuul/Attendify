import { exeQuery } from "../../../../lib/db";
import { formModal } from "../../../../interfaces/division.interface";
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
    const syntax = `SELECT A.id, A.description, UPPER(B.description) AS dept, A.status, A."deptId" AS department, C.fullname AS head, A."headId"
    FROM mst_division A
    LEFT JOIN mst_department B on A."deptId" = B.id 
    LEFT JOIN mst_employee C on A."headId" = C.id 
    WHERE A.is_deleted = 0`
    return exeQuery(syntax, [])
}

export const save = (param: formModal, session: ISession) => {
    const syntax = `INSERT INTO mst_division ("deptId", description, status, "headId", "createdById") VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    return exeQuery(syntax, [param.department || '', param.description || '', param.status || '', param.head || null, session.id])
}

export const update = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_division SET description = $1, "deptId" = $2, status = $3, "headId" = $5, "updatedById" = $6, updated_at = current_timestamp WHERE id = $4 RETURNING *`;
    return exeQuery(syntax, [param.description, param.department || '', param.status || '', param.id || '', param.head || null, session.id])
}

export const deleteDivision = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_division SET is_deleted = 1, "deletedById" = $2, updated_at = current_timestamp WHERE id = $1`;
    return exeQuery(syntax, [param.id || '', session.id])

    //const syntax = `DELETE FROM mst_division WHERE id = $1`;
    //return exeQuery(syntax, [param.id])
}

export const findDept = (param: formModal) => {
    const syntax = `SELECT id FROM department B WHERE B.id = $1`;
    return exeQuery(syntax, [param.department || ''])
}

export const findOne = (param: formModal) => {
    const syntax = `SELECT id FROM mst_division A WHERE A.description = $1 AND A.is_deleted = 0`;
    return exeQuery(syntax, [param.description || ''])
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

export const findDuplicate = (param: formModal) => {
    const syntax = `SELECT id FROM mst_division A WHERE A.description = $1 AND A.id != $2`;
    return exeQuery(syntax, [param.description, param.id || ''])
}