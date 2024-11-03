import { exeQuery } from "../../../../lib/db";
import { formModal } from "interfaces/request_type.interface"; 
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
    const syntax = `SELECT row_number() OVER(${orderBy(params)}) AS number, A.id, UPPER(A.description) AS description, A.tipe, A.need_apprv, A.desc_index, A.day_limit, A.status
    FROM mst_request_type A
    WHERE A.is_deleted = 0 ${keyWhere(params)} ${orderBy(params)}`
    
    return exeQuery(syntax, [])
}

export const save = (param: formModal, session: ISession) => {
    const syntax = `INSERT INTO mst_request_type (description, tipe, need_apprv, day_limit, desc_index, status, "createdById") VALUES ($1,$2,$3,$4,$5,$6,$7)`;
    return exeQuery(syntax, [param.description || '', param.tipe, param.need_apprv, param.day_limit, param.desc_index, param.status || '', session.id])
}

export const update = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_request_type SET description = $1, tipe = $2, need_apprv = $3, day_limit = $4, desc_index = $5, status = $6, "updatedById" = $7, updated_at = current_timestamp WHERE id = $8`;
    return exeQuery(syntax, [param.description, param.tipe, param.need_apprv, param.day_limit, param.desc_index, param.status, session.id, param.id || ''])
}

export const findOne = (param: formModal) => {
    const syntax = `SELECT id FROM mst_request_type A WHERE A.description = $1 AND A.is_deleted = 0`;
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
    const syntax = `SELECT id FROM mst_request_type A WHERE UPPER(A.description) = $1 AND A.id != $2`;
    return exeQuery(syntax, [param.description, param.id || ''])
}

export const findShiftDet = (param: formModal) => {
    const syntax = `SELECT B.id FROM mst_request_type_det B WHERE B."shiftId" = $1 AND B.is_enabled = 1`;
    return exeQuery(syntax, [param.id || ''])
}

export const updateShiftDet = (id: number, status: string, session: ISession) => {
    const syntax = `UPDATE mst_request_type_det SET status = $2, "updatedById" = $3, updated_at = current_timestamp WHERE id = $1`;
    return exeQuery(syntax, [id, status, session.id])
}