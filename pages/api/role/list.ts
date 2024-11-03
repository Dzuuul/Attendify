import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import { pagination } from "../../../lib/helper";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import { IForm } from "../../../interfaces/role.interface";

interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
}

export const save = async (param: any) => {
    try {
        const {access} = param

        await model.startTransaction()
        const data: any = await model.save(param, param.userId)
        var accessId = data[0].id
        var syntax = ""
        const dataFiltered = await access.filter((item: any) => item.type == true);

        for (let index = 0; index < dataFiltered.length; index++) {
            const element = dataFiltered[index];

            syntax += `(${element.m_insert},${element.m_update},${element.m_delete},${element.m_view},${accessId},${element.menu_header},${param.userId})`
    
            if (index !== dataFiltered.length - 1) {
                syntax += ', '
            }

            if (index == dataFiltered.length - 1) {
                await model.saveAccess(syntax)
                await model.commitTransaction()
            }
        }

        if (dataFiltered.length < 1) {
            await model.commitTransaction()
        }

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

export const edit = async (param: any) => {
    try {
        if (param.description != param.id) {
            //cek duplicate
            const checkDuplicate: any = await model.findOne(param);
            if (checkDuplicate.length > 0) {
                return {
                    error: {
                        type: 'warning',
                        message: 'warning',
                        description: 'Role Already Exist'
                    }
                }
            }
        }
        
        const {access} = param
        await model.startTransaction();
        await model.updateOne(param);
        const data: any = await model.findOne(param)
        let accessId = data[0].id
        let syntax = ""
        let nextAccessDetId = ""
        const dataFiltered = await access.filter((item: any) => item.type != undefined);

        for (let index = 0; index < dataFiltered.length; index++) {
            const element = dataFiltered[index];
            let accessDetId = element.access_det_id

            if (!element.access_det_id) {
                if (!nextAccessDetId) {
                    const getDetId: any = await model.getNewAccessId();
                    accessDetId = getDetId[0].nextval + 1
                    nextAccessDetId = accessDetId
                }

                if (nextAccessDetId) {
                    accessDetId = nextAccessDetId + 1
                    nextAccessDetId = accessDetId
                }
            }

            syntax += `(${accessDetId},${element.m_insert},${element.m_update},${element.m_delete},${element.m_view},${accessId},${element.menu_header},${param.userId})`
    
            if (index !== dataFiltered.length - 1) {
                syntax += ', '
            }

            if (index == dataFiltered.length - 1) {
                await model.updateAccess(syntax)
            }
        }
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

export const deleteRole = async (param: any) => {
    try {
        //find Data
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
        await model.deleteRole(findOne[0].id, param.userId)
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

export async function findOne(param: IForm) {
    return model.findOne(param)
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
