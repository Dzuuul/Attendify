import { exeQuery } from "../../../../lib/db";
import { formModal } from "interfaces/shift.interface"; 
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
        return " ORDER BY UPPER(A.description) ASC";
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

export const list = (params: IParams) => {
    const syntax = `SELECT row_number() OVER (ORDER BY A.id) AS number, A.id, UPPER(A.description) AS description, A.status, A.normal_shift
    FROM mst_shift A
    WHERE A.is_deleted = 0 ${keyWhere(params)} ${orderBy(params)}`
    
    return exeQuery(syntax, [])
}

export const save = (param: formModal, session: ISession) => {
    const syntax = `INSERT INTO mst_shift (description, status, normal_shift, "createdById") VALUES ($1,$2,$3,$4)`;
    return exeQuery(syntax, [param.description || '', param.status, param.normal_shift, session.id])
}

export const update = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_shift SET description = $1, status = $2, normal_shift = $3, "updatedById" = $4 WHERE id = $5 RETURNING *`;
    return exeQuery(syntax, [param.description, param.status, param.normal_shift, session.id, param.id || ''])
}

export const findOne = (param: formModal) => {
    const syntax = `SELECT id FROM mst_shift A WHERE A.description = $1 AND A.is_deleted = 0`;
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
    const syntax = `SELECT id FROM mst_shift A WHERE UPPER(A.description) = $1 AND A.id != $2`;
    return exeQuery(syntax, [param.description, param.id || ''])
}

export const findShiftDet = (param: formModal) => {
    const syntax = `SELECT B.id FROM mst_shift_det B WHERE B."shiftId" = $1 AND B.is_enabled = 1`;
    return exeQuery(syntax, [param.id || ''])
}

export const updateShiftDet = (id: number, status: number, session: ISession) => {
    const syntax = `UPDATE mst_shift_det SET status = $2, "updatedById" = $3, updated_at = current_timestamp WHERE id = $1`;
    return exeQuery(syntax, [id, status, session.id])
}