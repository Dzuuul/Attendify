import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../../lib/auth";
import { pagination } from "../../../../lib/helper";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import { IForm, IGetRole } from "../../../../interfaces/shift_transaction.interface";
import { ISession } from 'interfaces/common.interface';

interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
}

export const save = async (param: IForm, session: ISession) => {
    try {
        if (param.workday.length < 1) {
            return {
                error: {
                    type: 'error',
                    message: 'error',
                    description: 'Workday cannot be empty!'
                }
            }
        }

        param.clock_in = param.clock_in ? param.clock_in : "";
        param.clock_out = param.clock_out ? param.clock_out : "";
        param.validFrom = param.validFrom ? param.validFrom : null;
        param.validTo = param.validTo ? param.validTo : null;
        param.work_hour = param.work_hour ? param.work_hour : "";
        param.sunday = 0, param.monday = 0, param.tuesday = 0, param.wednesday = 0, param.thursday = 0, param.friday = 0, param.saturday = 0;
        
        for (let index = 0; index < param.workday.length; index++) {
            const element = param.workday[index];
            if (element == "sunday") {
                param.sunday = 1;
            }
            if (element == "monday") {
                param.monday = 1;
            }
            if (element == "tuesday") {
                param.tuesday = 1;
            }
            if (element == "wednesday") {
                param.wednesday = 1;
            }
            if (element == "thursday") {
                param.thursday = 1;
            }
            if (element == "friday") {
                param.friday = 1;
            }
            if (element == "saturday") {
                param.saturday = 1;
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

export const edit = async (param: any, session: ISession) => {
    try {
        if (param.workday.length < 1) {
            return {
                error: {
                    type: 'error',
                    message: 'error',
                    description: 'Workday cannot be empty!'
                }
            }
        }

        //check last id and make it inactive
        const setInactive: any = await model.inactiveLastId(param.id, session);
        if (setInactive.length > 0) {
            return {
                error: {
                    type: 'warning',
                    message: 'warning',
                    description: 'ERROR'
                }
            }
        }
        
        const data = await save(param, session)
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

export async function findOne(id: string | number) {
    return model.findOne(id)
}

export async function findRole(param: IGetRole) {
    return model.findRole(param)
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

    const total: any = await model.countAll(params);

    const paginations = await pagination(page, row, total[0].total_all);
    params.limit = paginations.query

    const list: any = await model.list(params);

    return {
        dataPerPage: paginations.dataPerPage,
        currentPage: paginations.currentPage,
        totalData: paginations.totalData,
        totalPage: paginations.totalPage,
        data: list,
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
