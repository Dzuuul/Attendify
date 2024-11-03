import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "@lib/auth";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import { formModal } from "../../../interfaces/profile.interface";
import { ISession } from 'interfaces/common.interface';
import { hashPassword } from "../../../lib/helper";

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
        await model.startTransaction()
        param.new_pass = await hashPassword(param.new_pass)
        const data = await model.save(param, session)
        await model.commitTransaction()
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

export const edit = async (param: any) => {
    try {
        await model.startTransaction();
        await model.updateOne(param);
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

export async function findOne(id: number) {
    return model.findOne(id)
}

export async function findEdu(id: number) {
    return model.findEdu(id)
}

export async function findFam(id: number) {
    return model.findFam(id)
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

        const data = await getData(params)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

export default protectAPI(handler);
