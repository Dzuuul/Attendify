import { getLoginSession } from "@lib/auth";
import { ISession } from 'interfaces/common.interface';
import moment from 'moment';
import type { NextApiRequest, NextApiResponse } from 'next';
import { formModal } from "../../../../interfaces/joint_leave.interface";
import Cors from "../../../../lib/cors";
import protectAPI from "../../../../lib/protectApi";
import * as model from "./_model";

interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
}

export const save = async (param: formModal, session: ISession) => {
    try {
        //cek duplicate
        const checkDuplicate: any = await model.findOne(param);
        if (checkDuplicate.length > 0) {
            return {
                error: {
                    type: 'warning',
                    message: 'warning',
                    description: 'Date Already Exist'
                }
            }
        }

        const listDayOff = param.trsData

        await model.startTransaction()
        const data = await model.save(param, session)

        const jointLeaveId = data[0].id
        let min_id;

        let dataTrs = {
            jointLeaveId: jointLeaveId,
            createdById: session.id,
            date: param.status != 0 ? param.date : null,
            status: param.status != 0 ? 2 : 1,
            id: min_id
        }

        for (let i = 0; i < listDayOff.length; i++) {
            const element = listDayOff[i].min_id;
            dataTrs.id = element
            await model.updateTrsEmpLeave(dataTrs)
        }

        await model.commitTransaction()
        await updateCuti()
        return data
    } catch (error) {
        await model.rollback()
        return {
            error: {
                type: 'error',
                message: 'error',
                description: 'ERROR'
            }
        }
    }
}

export const edit = async (param: formModal, session: ISession) => {
    try {
        //cek duplicate
        const checkDuplicate: any = await model.findDuplicate(param);
        if (checkDuplicate.length > 0) {
            return {
                error: {
                    type: 'warning',
                    message: 'warning',
                    description: 'Description Already Exist'
                }
            }
        }

        const listDayOff = param.trsData

        const selectId = await model.selectId(param)
        let min_id = 0;

        await model.startTransaction()
        const update = await model.update(param, session)

        let dataTrs = {
            jointLeaveId: param.id,
            updatedById: session.id,
            date: param.status != 0 ? param.date : null,
            status: param.status != 0 ? 2 : 1,
            getCreatedById: update[0].createdById,
            id: min_id
        }

        // bikin kondisi disini ketika aray kosong
        if (selectId.length != 0) {
            await model.modifyUpdateTrsEmpLeave(dataTrs)
        } else {
            for (let i = 0; i < listDayOff.length; i++) {
                const element = listDayOff[i].min_id;
                dataTrs.id = element
                await model.updateTrsEmpLeave(dataTrs)
            }
        }

        await model.commitTransaction()
        await updateCuti()
        return 'ok'
    } catch (error) {
        await model.rollback()
        return {
            error: {
                type: 'error',
                message: 'error',
                description: 'ERROR'
            }
        }
    }
}

export const deleteDayoff = async (param: formModal, session: ISession) => {
    try {
        param.date = param.date ? moment(param.date).format("YYYY-MM-DD") : ""
        const findOne: any = await model.findOne(param);

        if (findOne.length < 1) {
            return {
                error: {
                    type: 'warning',
                    message: 'warning',
                    description: 'Data Not Found'
                }
            }
        }

        await model.startTransaction()
        const setDelete = await model.deleteJointLeave(param, session)

        let dataTrs = {
            jointLeaveId: setDelete[0].id,
            id: session.id,
        }
        await model.deleteUpdateTrsEmpLeave(dataTrs)

        await model.commitTransaction()
        await updateCuti()
        return 'ok'
    } catch (error) {
        await model.rollback()
        return {
            error: {
                type: 'error',
                message: 'error',
                description: 'ERROR'
            }
        }
    }
}

export async function getData(param: IPagination) {
    const row = param.row ? Number(param.row) : 10
    const page = param.page ? Number(param.page) : 0
    const key = param.key ? param.key : ""
    const direction = param.direction ? param.direction : ""
    const column = param.column ? param.column : ""

    let params = {
        row,
        limit: 0,
        key,
        direction,
        column
    } as IPagination

    const listUser: any = await model.list(params);

    return {
        data: listUser,
        key: null
    }
}

const updateCuti = async () => {
    const listDayOff2 = await model.ListAvailableEmployees()

    await model.startTransaction()

    for (let i = 0; i < listDayOff2.length; i++) {
        const empId = listDayOff2[i].employee_id
        const sisaCuti = listDayOff2[i].remaining_days_off
        let dataEmp = {
            id: empId,
            saldoCuti: sisaCuti,
        }
        await model.updateMstEmp(dataEmp)
    }

    await model.commitTransaction()
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        const session = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({ message: "Unauthorized!" })
        }

        if (req.method !== 'GET') {
            return res.status(403).json({ message: "Forbidden!" })
        }

        const { row, key, direction, column, page } = req.query

        let params = {
            row,
            key,
            direction,
            column,
            page
        } as IPagination

        const data = await getData(params)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler);
