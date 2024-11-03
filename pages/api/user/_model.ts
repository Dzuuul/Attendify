import { exeQuery } from "../../../lib/db";
import { formModal } from "../../../interfaces/user.interface";
import { ISession } from "interfaces/common.interface";

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
        return " ORDER BY A.fullname ASC";
    } else {
        return ` ORDER BY ${column} ${directionType}`;
    }
};

const keyWhere = (params: IParams) => {
    const { key } = params
    if (key == "") {
        return "";
    } else {
        return ` AND (UPPER(A.fullname) LIKE '%${key}%' OR UPPER(B.description) LIKE '%${key}%')`;
    }
};

const dateWhere = (startDate : string, endDate: string) => {
    if (startDate == "" || endDate == "") {
        return "";
    } else {
        return ` AND DATE(A.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    }
};

const accessIdWhere = (session : ISession) => {
    if (session.accessId != 1) {
        if (session.accessId == 8) {
            return ` AND B."appsId" = 2`;
        }
        return ` AND B."appsId" = ${session.appsId}`;
    }
    if (session.accessId == 1) {
        return "";
    }
};

const appsIdWhere = (param: any) => {
    if (param.appsId) {
        return ` AND X."appsId" = ${param.appsId}`;
    }
    return "";
};

export const list = (params: IParams, session: ISession) => {
    const syntax = `SELECT A.id AS "usersId", C.id AS "accessAppsId", A.username, A.fullname AS name, B.description AS role, A.created_at, C."appsId"
        FROM users A
        JOIN access_apps C ON C."usersId" = A.id
        JOIN access B ON B.id = C."accessId"
        WHERE 1 = 1 AND A.is_enabled = 1 AND C.status = 1 AND C.is_deleted = 0 ${accessIdWhere(session)} ${keyWhere(params)} ${orderBy(params)}`
    return exeQuery(syntax, [])
}

export const countAll = (params: IParams) => {
    const syntax = `SELECT COUNT(1) AS total_all FROM users A, access B WHERE A."accessId" = B.id`;
    return exeQuery(syntax, [])
}

export const save = (param: formModal) => {
    const syntax = `INSERT INTO users (username, password, fullname, "accessId", is_enabled) VALUES ($1,$2,$3,$4,$5)`;
    return exeQuery(syntax, [param.username || '', param.password || '', param.name || '', param.role || '', '1'])
}

export const saveEmployee = (param: formModal, id: number) => {
    const syntax = `INSERT INTO users (username, password, fullname, "accessId", is_enabled, "employeeId") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    return exeQuery(syntax, [param.username || '', param.password || '', param.name || '', param.role || '', '1', id])
}

export const insertAccess = (param: any) => {
    const syntax = `INSERT INTO access_apps ("createdById", "usersId", "appsId", "accessId", "status", "is_deleted") VALUES (1, $1, $3, $2, 1, 0) RETURNING *`;
    return exeQuery(syntax, [param.id, param.role, param.apps])
}

export const update = (param: formModal) => {
    if (!param.password) {
        const syntax = `UPDATE users SET username = $1, fullname = $2, "accessId" = $3 WHERE username = $4`;
        return exeQuery(syntax, [param.username || '', param.name || '', param.role || '', param.id || ''])
    }

    const syntax = `UPDATE users SET username = $1, password = $2, fullname = $3, "accessId" = $4 WHERE username = $5`;
    return exeQuery(syntax, [param.username || '', param.password || '', param.name || '', param.role || '', param.id || ''])
}

export const deleteUser = (param: formModal) => {
    const syntax = `UPDATE users SET is_enabled = 0 WHERE username = $1`;
    return exeQuery(syntax, [param.username || ''])
}

export const deleteAccess = (param: any) => {
    const syntax = `UPDATE access_apps SET status = 0, is_deleted = 1 WHERE id = $1`;
    return exeQuery(syntax, [param.accessAppsId])
}

export const findRole = (param: formModal) => {
    const syntax = `SELECT id FROM access A WHERE A.description = $1`;
    return exeQuery(syntax, [param.role || ''])
}

export const findOne = (param: formModal) => {
    const syntax = `SELECT id FROM users A WHERE A.username = $1 AND A.is_enabled = 1`;
    return exeQuery(syntax, [param.username || ''])
}

export const findAccess = (param: any) => {
    const syntax = `SELECT id FROM access_apps X WHERE X."usersId" = $1 ${appsIdWhere(param)}`;
    return exeQuery(syntax, [param.usersId || ''])
}

export const findEmployee = (param: formModal) => {
    const syntax = `SELECT C.id FROM mst_employee C WHERE C.id_employee = $1`;
    return exeQuery(syntax, [param.username])
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
    const syntax = `SELECT id FROM users A WHERE A.username = $1 AND A.username != $2`;
    return exeQuery(syntax, [param.username || '', param.id || ""])
}

export const listEmp = () => {
    const syntax = `SELECT id AS key, id_employee AS value, CONCAT(id_employee, ' - ', fullname) AS label, fullname, 'username' AS name
    FROM mst_employee C
    WHERE not exists(SELECT * from users A where A."employeeId" = C.id)`
    return exeQuery(syntax, [])
}