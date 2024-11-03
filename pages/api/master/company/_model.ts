import { exeQuery } from "../../../../lib/db";
import { formModal } from "interfaces/company.interface"; 
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
        return " ORDER BY A.description DESC";
    } else {
        return ` ORDER BY ${column} ${directionType}`;
    }
};

const keyWhere = (params: IParams) => {
    const { key } = params
    if (key == "") {
        return "";
    } else {
        return ` AND (UPPER(A.description) LIKE '%${key}%' OR A.max_check LIKE '%${key}%')`;
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
    const syntax = `SELECT A.id, UPPER(A.description) AS description, A.status, A.lat, A.long, A.max_check
    FROM mst_company A
    WHERE A.is_deleted = 0 ${keyWhere(params)} ${orderBy(params)}`
    return exeQuery(syntax, [])
}

export const save = (param: formModal, session: ISession) => {
    const syntax = `INSERT INTO mst_company (description, status, lat, long, max_check, "createdById") VALUES ($1,$2,$3,$4,$5,$6)`;
    return exeQuery(syntax, [param.description || '', param.status || '', param.lat || '', param.long || '', param.max_check || '', session.id])
}

export const update = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_company SET description = $1, status = $2, lat = $3, long = $4, max_check = $5, "updatedById" = $6 WHERE id = $7`;
    return exeQuery(syntax, [param.description, param.status, param.lat, param.long, param.max_check, session.id, param.id || ''])
}

export const deleteCompany = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_company SET is_deleted = 1, "updatedById" = $1 WHERE id = $2`;
    return exeQuery(syntax, [session.id, param.id || ''])

    //const syntax = `DELETE FROM mst_company WHERE id = $1`;
    //return exeQuery(syntax, [param.id || ''])
}

export const findOne = (param: formModal) => {
    const syntax = `SELECT id FROM mst_company A WHERE A.description = $1 AND A.is_deleted = 0`;
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
    const syntax = `SELECT id FROM mst_company A WHERE A.description = $1 AND A.id != $2`;
    return exeQuery(syntax, [param.description, param.id || ''])
}