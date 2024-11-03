import { exeQuery } from "../../../lib/db";
import { IForm } from "../../../interfaces/role.interface";

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
    const syntax = `SELECT description, status FROM access A WHERE 1 = 1 AND A.is_deleted = 0 ${keyWhere(params)}
    ${orderBy(params)}`;
    //${params.limit};
    return exeQuery(syntax, [])
}

export const countAll = (params: IParams) => {
    const syntax = `SELECT COUNT(1) AS total_all FROM access A
        WHERE 1 = 1${keyWhere(params)}`;
    return exeQuery(syntax, [])
}

export const findOne = (param: IForm) => {
    const syntax = `SELECT id, description, status FROM access A WHERE A.description = $1`;
    return exeQuery(syntax, [param.description])
}

export const save = (param: IForm, userId: number) => {
    const syntax = `INSERT INTO access (description, status, "createdById") VALUES ($1, $2, $3) RETURNING *`;
    return exeQuery(syntax, [param.description, param.status, userId])
}

export const saveAccess = (stx: string) => {
    const syntax = `INSERT INTO access_det (m_insert, m_update, m_delete, m_view, "accessId", "menuId", "createdById") 
    VALUES ${stx}`;

    return exeQuery(syntax, [])
}

export const deleteRole = async (id: string, userId: number) => {
    const syntax = `UPDATE access SET is_deleted = 1, "deletedById" = $1, updated_at = current_timestamp WHERE id = $2`;
    const syntaxDet = `UPDATE access_det SET is_deleted = 1, "deletedById" = $1, updated_at = current_timestamp WHERE "accessId" = $2`

    await exeQuery(syntaxDet, [userId, id])
    return exeQuery(syntax, [userId, id])
}

export const updateOne = (param: any) => {
    const syntax = `UPDATE access SET description = $1, status = $2, "updatedById" = $3, updated_at = current_timestamp WHERE description = $4`;
    return exeQuery(syntax, [param.description, param.status, param.userId, param.id])
}

export const updateAccess = (stx: string) => {
    const syntax = `INSERT INTO access_det (id, m_insert, m_update, m_delete, m_view, "accessId", "menuId", "createdById") VALUES ${stx} ON CONFLICT (id) DO UPDATE SET m_insert = excluded.m_insert, m_update = excluded.m_update, m_delete = excluded.m_delete,m_view = excluded.m_view, "accessId" = excluded."accessId", "menuId" = excluded."menuId", "updatedById" = excluded."createdById"`;

    return exeQuery(syntax, [])
}

export const getNewAccessId = () => {
    const syntax = `SELECT MAX(id) AS nextval FROM access_det`
    return exeQuery(syntax, [])
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

export const findUsersWithRole = (id: number) => {
    const syntax = `SELECT COUNT(accessid) FROM users A WHERE A."accessId" = ${id}`;
    return exeQuery(syntax, [])
}