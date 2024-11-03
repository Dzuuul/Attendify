import {exeQuery} from "../../../lib/db";

export const findHash = (id: any) => {
    const syntax = `SELECT password FROM users A WHERE A."employeeId" = $1`;
    return exeQuery(syntax, [id])
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