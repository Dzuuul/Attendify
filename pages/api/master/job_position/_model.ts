import { exeQuery } from "../../../../lib/db";
import { formModal } from "interfaces/job_position.interface"; 
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
    const syntax = `SELECT A.id, A.description, A.status
    FROM mst_job_position A
    WHERE A.is_deleted = 0`
    return exeQuery(syntax, [])
}

export const save = (param: formModal, session: ISession) => {
    const syntax = `INSERT INTO mst_job_position (description, status, "createdById") VALUES ($1,$2,$3)`;
    return exeQuery(syntax, [param.description || '', param.status || '', session.id])
}

export const update = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_job_position SET description = $1, status = $2, "updatedById" = $3 WHERE id = $4`;
    return exeQuery(syntax, [param.description, param.status, session.id, param.id || ''])
}

export const deleteJobPosition = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_job_position SET is_deleted = 1, "updatedById" = $1 WHERE id = $2`;
    return exeQuery(syntax, [session.id, param.id || ''])

    //const syntax = `DELETE FROM mst_job_position WHERE id = $1`;
    //return exeQuery(syntax, [param.id || ''])
}

export const findOne = (param: formModal) => {
    const syntax = `SELECT id FROM mst_job_position A WHERE A.description = $1 AND A.is_deleted = 0`;
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
    const syntax = `SELECT id FROM mst_job_position A WHERE A.description = $1 AND A.id != $2`;
    return exeQuery(syntax, [param.description, param.id || ''])
}