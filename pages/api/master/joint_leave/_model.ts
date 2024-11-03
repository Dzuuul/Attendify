import { exeQuery } from "../../../../lib/db";
import { TransactionEmployeeLeave, formModal } from "interfaces/joint_leave.interface";
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
    const { direction, column } = params
    const directionType =
        direction == "ascend" ? "ASC" : direction == "descend" ? "DESC" : "";
    if (column == "" || directionType == "") {
        return " ORDER BY A.date DESC";
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
    FROM mst_joint_leave A
    WHERE A.is_deleted = 0`
    return exeQuery(syntax, [])
}

export const list = (params: IParams) => {
    const syntax = `SELECT row_number() OVER (ORDER BY A.id) AS number, A.id, UPPER(A.description) AS description, DATE(A.date), A.status
    FROM mst_joint_leave A
    WHERE A.is_deleted = 0 ${keyWhere(params)} ${orderBy(params)}`
    return exeQuery(syntax, [])
}

export const save = (param: formModal, session: ISession) => {
    const syntax = `INSERT INTO mst_joint_leave (description, date, "createdById", status) VALUES ($1,$2,$3,$4) RETURNING id`;
    return exeQuery(syntax, [param.description || '', param.date || '', session.id, param.status])
}

export const update = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_joint_leave SET description = $1, date = $2, "updatedById" = $3, status = $4, updated_at = NOW() WHERE id = $5 RETURNING "createdById"`;
    return exeQuery(syntax, [param.description, param.date, session.id, param.status, param.id || ''])
}

export const deleteJointLeave = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_joint_leave SET is_deleted = 1, "updatedById" = $1, "deletedById" = $2 WHERE id = $3 RETURNING id`;
    return exeQuery(syntax, [session.id, session.id, param.id || ''])
}

export const findOne = (param: formModal) => {
    const syntax = `SELECT id FROM mst_joint_leave A WHERE A.date = $1 AND A.is_deleted = 0`;
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
    const syntax = `SELECT id FROM mst_joint_leave A WHERE A.description = $1 AND A.id != $2 AND is_deleted = 0`;
    return exeQuery(syntax, [param.description, param.id || ''])
}

export const ListAvailableEmployees = () => {
    const syntax = `
SELECT
    B.min_id,
    COALESCE(B."employeeId", A.id) as employee_id,
    COALESCE(B.sisa_cuti, 0) AS remaining_days_off
FROM
    mst_employee AS A
    LEFT JOIN (
        SELECT
            MIN(id) as min_id,
            "employeeId",
            COUNT(*) AS sisa_cuti
        FROM
            trs_emp_leave
        WHERE
            status = 1
        GROUP BY
            "employeeId"
    ) AS B ON A.id = B."employeeId"
WHERE
    A.resign_date = 'NULL'
    OR resign_date IS NULL
ORDER BY
    employee_id ASC`;
    return exeQuery(syntax, [])
}

export const updateTrsEmpLeave = (param: any) => {
    const syntax = `UPDATE trs_emp_leave SET "jointLeaveId" = $1, date = $2,${createdOrUpdated(param)} status = $3, "deletedById" = null, is_deleted = 0, updated_at = NOW() WHERE id = $4`;
    return exeQuery(syntax, [param.jointLeaveId, param.date, param.status, param.id || ''])
}

export const selectId = (param: any) => {
    const syntax = `SELECT "jointLeaveId" FROM trs_emp_leave WHERE "jointLeaveId" = $1`;
    return exeQuery(syntax, [param.id])
}

const createdOrUpdated = (param: any) => {
    const { createdById, updatedById, getCreatedById } = param
    if (!createdById) {
        return ` "createdById" = ${getCreatedById}, "updatedById" = ${updatedById},`;
    } else {
        return ` "createdById" = ${createdById}, "updatedById" = null,`;
    }
};

export const modifyUpdateTrsEmpLeave = (param: any) => {
    const syntax = `UPDATE trs_emp_leave SET date = $1, "createdById" = $2, "updatedById" = $3, status = $4, updated_at = NOW() WHERE "jointLeaveId" = $5`;
    return exeQuery(syntax, [param.date, param.getCreatedById, param.updatedById, param.status, param.jointLeaveId])
}

export const deleteUpdateTrsEmpLeave = (param: any) => {
    const syntax = `UPDATE trs_emp_leave SET is_deleted = 1, "deletedById" = $1, "updatedById" = $2, status = 1, date = null, updated_at = NOW() WHERE "jointLeaveId" = $3`;
    return exeQuery(syntax, [param.id, param.id, param.jointLeaveId])
}

export const updateMstEmp = (param: any) => {
    const syntax = `UPDATE mst_employee SET saldo_cuti = $1 WHERE id = $2`;
    return exeQuery(syntax, [param.saldoCuti, param.id])
}