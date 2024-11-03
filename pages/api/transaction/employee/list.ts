import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "@lib/auth";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import { formModal } from "../../../../interfaces/employee_transaction.interface";
import { ISession } from 'interfaces/common.interface';

interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
}

export const edit = async (param: formModal, session: ISession) => {
    try {
        //cek duplicate
        const checkDuplicate: any = await model.findClockIn(param);
        if (checkDuplicate.length > 0) {
            return {
                error: {
                    type: 'warning',
                    message: 'warning',
                    description: 'Failed to change shift, today this employee has been clocked in!'
                }
            }
        }

        await model.startTransaction()
        await model.update(param, session)
        await model.commitTransaction()
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

export async function getData(param: IPagination, session: ISession) {
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

    const listUser: any = await model.list(params, session);
    
    return {
        data: listUser,
        key: null
    }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        const session = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({message: "Unauthorized!"})
        }

        if (req.method !== 'GET') {
            return res.status(403).json({message: "Forbidden!"})
        }

        const {row, key, direction, column, page} = req.query

        let params = {
            row,
            key,
            direction,
            column,
            page
        } as IPagination

        const data = await getData(params, session)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

export default protectAPI(handler);
