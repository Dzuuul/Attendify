import { exeQuery } from "../../../../lib/db";
import { IForm, IGetRole } from "../../../../interfaces/shift_transaction.interface";
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
        return " ORDER BY B.description ASC";
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

export const masterShift = () => {
    const syntax = `SELECT A.id AS key, A.id AS value, UPPER(A.description) AS label, 'shiftId' AS name
      FROM mst_shift A
      WHERE A.status = '1' AND A.is_deleted = '0'
      ORDER BY UPPER(A.description)`;
    return exeQuery(syntax, []);
  };

export const list = (params: IParams) => {
    const syntax = `SELECT row_number() OVER (ORDER BY B.description) AS number, A.id, B.description, A.clock_in, A.clock_out, A.status, A.work_hour, CONCAT(CASE WHEN A.sunday = 1 THEN 'Sunday' ELSE '' END, CASE WHEN A.monday = 1 THEN ' Monday' ELSE '' END, CASE WHEN A.tuesday = 1 THEN ' Tuesday' ELSE '' END, CASE WHEN A.wednesday = 1 THEN ' Wednesday' ELSE '' END, CASE WHEN A.thursday = 1 THEN ' Thursday' ELSE '' END, CASE WHEN A.friday = 1 THEN ' Friday' ELSE '' END, CASE WHEN A.saturday = 1 THEN ' Saturday' ELSE '' END) AS workday 
        FROM mst_shift_det A
        JOIN mst_shift B ON A."shiftId" = B.id 
        WHERE A.is_enabled = 1 AND A.is_deleted = 0 
        ${keyWhere(params)}
        ${orderBy(params)}`
    ;
    return exeQuery(syntax, [])
}

export const countAll = (params: IParams) => {
    const syntax = `SELECT COUNT(1) AS total_all FROM mst_shift A
        WHERE 1 = 1${keyWhere(params)}`;
    return exeQuery(syntax, [])
}

export const findOne = (id: string | number) => {
    const syntax = `SELECT A.id, A."shiftId", A.clock_in, A.clock_out, A.status, A.sunday, A.monday, A.tuesday, A.wednesday, A.thursday, A.friday, A.saturday, A.valid_from, A.valid_to, A.work_hour
    FROM mst_shift_det A WHERE A.id = $1`;
    return exeQuery(syntax, [id])
}

export const findRole = (param: IGetRole) => {
    const syntax = `SELECT id, description, status FROM access A WHERE A.description = $1`;
    return exeQuery(syntax, [param.description])
}

export const save = (param: IForm, session: ISession) => {
    const syntax = `INSERT INTO mst_shift_det ("shiftId", clock_in, clock_out, sunday, monday, tuesday, wednesday, thursday, friday, saturday, valid_from, valid_to, work_hour, "createdById") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;
    
    return exeQuery(syntax, [param.shift_id, param.clock_in, param.clock_out, param.sunday, param.monday, param.tuesday, param.wednesday, param.thursday, param.friday, param.saturday, param.validFrom, param.validTo, param.work_hour, session.id])
}

export const inactiveLastId = (id: number, session: ISession) => {
    const syntax = `UPDATE mst_shift_det SET status = 0, is_enabled = 0, "updatedById" = $2, updated_at = current_timestamp WHERE id = $1`;
    return exeQuery(syntax, [id, session.id])
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