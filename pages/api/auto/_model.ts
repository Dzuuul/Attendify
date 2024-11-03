import { exeQuery } from "../../../lib/db";
import { formModal } from "interfaces/approval_attendance.interface"; 
import { ISession } from 'interfaces/common.interface';

interface IParams {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
}

export const checkAttdNoOut = async () => {
    const stx = `SELECT id FROM attendance WHERE check_in IS NOT NULL AND check_out IS NULL AND "shiftDetId" IS NOT null`
    return exeQuery(stx, [])
}

export const forceCheckOut = async (attd: number) => {
    const stx = `UPDATE attendance AS a SET check_out = (DATE(a.check_in) || ' ' || b.clock_out)::TIMESTAMP FROM mst_shift_det AS b WHERE a."shiftDetId" = b.id AND a.id = $1`
    return exeQuery(stx, [attd])
}

export const checkRequestType = async (reqId: number) => {
    const stx = `SELECT tipe FROM mst_request_type WHERE id = $1`
    return exeQuery(stx, [reqId])
}

export const checkRemLeave = async () => {
    const stx = `SELECT id, saldo_cuti FROM mst_employee WHERE is_deleted = 0 AND status = 1`
    return exeQuery(stx, [])
}

export const updateRemLeave = async (id: number, saldo_cuti: number) => {
    const stx = `UPDATE mst_employee SET saldo_cuti = ${saldo_cuti}, updated_at = current_timestamp, "updatedById" = 1 WHERE id = ${id}`;
    return exeQuery(stx, [])
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