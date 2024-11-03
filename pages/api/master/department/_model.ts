import { exeQuery } from "../../../../lib/db";
import { IForm } from "../../../../interfaces/department.interface";
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
    const syntax = `SELECT row_number() OVER (ORDER BY A.id) AS number, A.id, A.description, A.status, A."headId", UPPER(B.fullname) AS head
    FROM mst_department A
    LEFT JOIN mst_employee B ON A."headId" = B.id
    WHERE A.is_deleted = 0` 
    // ${keyWhere(params)}
    // ${orderBy(params)}
    // ${params.limit}`;
    return exeQuery(syntax, [])
}

export const countAll = (params: IParams) => {
    const syntax = `SELECT COUNT(1) AS total_all FROM users A, access_apps B, access C WHERE A.id = B."usersId" AND B."accessId" = C.id AND B."appsId" = 1`;
    return exeQuery(syntax, [])
}

export const save = (param: IForm, session: ISession) => {
    const syntax = `INSERT INTO mst_department (description, status, "createdById", "headId") VALUES ($1,$2,$3,$4)`;

    return exeQuery(syntax, [param.description || '', param.status, session.id, param.head || ''])
}

export const update = (param: IForm, session: ISession) => {
    const syntax = `UPDATE mst_department SET description = $1, status = $2, "updatedById" = $4, "headId" = $5, updated_at = current_timestamp WHERE id = $3 AND is_deleted = 0`;
    
    return exeQuery(syntax, [param.description || '', param.status || '', param.id || '', session.id, param.head || ''])
}

export const deleteDept = (param: IForm, session: ISession) => {
    const syntax = `UPDATE mst_department SET is_deleted = 1, "deletedById" = $2, updated_at = current_timestamp WHERE description = $1`;
    //const syntax = `DELETE FROM mst_department WHERE description = $1`;
    return exeQuery(syntax, [param.description || '', session.id])
}

export const findOne = (param: IForm) => {
    const syntax = `SELECT id FROM mst_department A WHERE A.description = $1 AND A.is_deleted = 0`;
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

export const findDuplicate = (param: IForm) => {
    const syntax = `SELECT id FROM mst_department A WHERE A.description = $1 AND A.id != $2 AND A.is_deleted = 0`;
    return exeQuery(syntax, [param.description || '', param.id || ""])
}