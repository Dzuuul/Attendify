import { exeQuery } from "../../../../lib/db";
import { formModal } from "interfaces/employee_transaction.interface"; 
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
        return " ORDER BY A.id_employee ASC";
    } else {
        return ` ORDER BY ${column} ${directionType}`;
    }
};

const keyWhere = (params: IParams) => {
    const { key } = params
    if (key == "") {
        return "";
    } else {
        return ` AND (UPPER(A.fullname) LIKE '%${key}%')`;
    }
};

const accessIdWhere = (session : ISession) => {
    if (session.accessId == 5) {
        return `AND A."deptId" = '${session.deptId}'`;
    } 
    if (session.accessId == 10) {
        return `AND A."divId" = '8'`;
    } else {
        return "";
    }
};

export const list = (params: IParams, session: ISession) => {
    const syntax = `SELECT row_number() OVER (ORDER BY A.id) AS number, A.id, A.id_employee, A.fullname, B.description AS shift, A.updated_at, A."shiftId"
    FROM mst_employee A
    JOIN mst_shift B ON A."shiftId" = B.id
    WHERE A.is_deleted = 0 ${accessIdWhere(session)} ${keyWhere(params)} ${orderBy(params)}`
    
    return exeQuery(syntax, [])
}

export const update = (param: formModal, session: ISession) => {
    const syntax = `UPDATE mst_employee SET "shiftId" = $1, "updatedById" = $2 WHERE id = $3`;
    return exeQuery(syntax, [param.shiftId, session.id, param.id || ''])
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

export const findClockIn = (param: formModal) => {
    const syntax = `SELECT 1 FROM attendance A WHERE A."employeeId" = $1 AND DATE(A.created_at) = CURRENT_DATE`;
    return exeQuery(syntax, [param.id || ''])
}