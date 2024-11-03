import { exeQuery } from "../../../../lib/db";
import { formModal } from "interfaces/dayoff.interface"; 
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
        return " ORDER BY A.date ASC";
    } else {
        return ` ORDER BY ${column} ${directionType}`;
    }
};

const keyWhere = (params: IParams) => {
    const { key } = params
    if (key == "") {
        return "";
    } else {
        return ` AND (UPPER(A.description) LIKE '%${key}%')`;
    }
};

export const listAll = () => {
    const syntax = `SELECT row_number() OVER (ORDER BY A.id) AS key, A.id, UPPER(A.description) AS description, DATE(A.date)
    FROM mst_dayoff A
    WHERE A.is_deleted = 0`
    return exeQuery(syntax, [])
}

export const list = (params: IParams) => {
    const syntax = `SELECT row_number() OVER (ORDER BY A.id) AS number, A.id, UPPER(A.description) AS description, DATE(A.date)
    FROM mst_dayoff A
    WHERE A.is_deleted = 0 ${keyWhere(params)} ${orderBy(params)}`
    return exeQuery(syntax, [])
}

export const save = (param: formModal, session: ISession) => {
    const syntax = `INSERT INTO mst_dayoff (description, date, "createdById") VALUES ($1,$2,$3)`;
    return exeQuery(syntax, [param.description || '', param.date || '', session.id])
}

export const update = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_dayoff SET description = $1, date = $2, "updatedById" = $3 WHERE id = $4`;
    return exeQuery(syntax, [param.description, param.date, session.id, param.id || ''])
}

export const deleteDayoff = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_dayoff SET is_deleted = 1, "updatedById" = $1 WHERE id = $2`;
    return exeQuery(syntax, [session.id, param.id || ''])

    //const syntax = `DELETE FROM mst_dayoff WHERE id = $1`;
    //return exeQuery(syntax, [param.id || ''])
}

export const findOne = (param: formModal) => {
    const syntax = `SELECT id FROM mst_dayoff A WHERE A.date = $1 AND A.is_deleted = 0`;
    return exeQuery(syntax, [param.date || ''])
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
    const syntax = `SELECT id FROM mst_dayoff A WHERE A.description = $1 AND A.id != $2`;
    return exeQuery(syntax, [param.description, param.id || ''])
}