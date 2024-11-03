import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "@lib/auth";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import { formModal } from "../../../../interfaces/joblevel.interface";
import { ISession } from 'interfaces/common.interface';

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
                    description: 'Description Already Exist'
                }
            }
        }

        await model.startTransaction()        
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

export const deleteJoblevel = async (param: formModal, session: ISession) => {
    try {
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
        await model.deleteJoblevel(param, session)
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
