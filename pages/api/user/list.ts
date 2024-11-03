import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import { pagination, hashPassword } from "../../../lib/helper";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import { formModal } from "../../../interfaces/user.interface";
import { ISession } from 'interfaces/common.interface';

interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
}

export const save = async (param: formModal) => {
    try {
        let checkAccess: any = [];
        let params: any = [];
        let data: any = [];

        const role: any = await model.findRole(param);
        if (role.length < 1) {
            return {
                error: {
                    type: 'warning',
                    message: 'warning',
                    description: 'Invalid Role'
                }
            }
        }

        //cek duplicate
        const checkDuplicate: any = await model.findOne(param);
        if (checkDuplicate.length > 0) {
            params = {id : checkDuplicate[0].id, apps: param.apps, role: role[0].id}
            checkAccess = await model.findAccess(params);
            if (checkAccess.length > 0) {
                return {
                    error: {
                        type: 'warning',
                        message: 'warning',
                        description: 'Username Already Exist'
                    }
                }
            }
        }

        await model.startTransaction()

        if (checkDuplicate.length < 1 && checkAccess.length < 1) {
            param.role = role[0].id
            param.password = await hashPassword(param.password)
            const employee: any = await model.findEmployee(param);
    
            if (employee.length < 1) {
                return {
                    error: {
                        type: 'warning',
                        message: 'warning',
                        description: 'Invalid ID Employee'
                    }
                }
            }

            data = await model.saveEmployee(param, employee[0].id)
            if (data.length > 0) {
                param.id = data[0].id;
                const update: any = await model.insertAccess(param)
            }
        }
        
        if (checkDuplicate.length > 0 && checkAccess.length < 1) {
            data = await model.insertAccess(params)
        }
        
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

export const edit = async (param: formModal) => {
    try {
        //cek duplicate
        const checkDuplicate: any = await model.findDuplicate(param);
        if (checkDuplicate.length > 0) {
            return {
                error: {
                    type: 'warning',
                    message: 'warning',
                    description: 'Username Already Exist'
                }
            }
        }

        const role: any = await model.findRole(param);
        if (role.length < 1) {
            return {
                error: {
                    type: 'warning',
                    message: 'warning',
                    description: 'Invalid Role'
                }
            }
        }

        param.role = role[0].id
        if (param.password) {
            param.password = await hashPassword(param.password)
        }

        await model.startTransaction()
        await model.update(param)
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

export const deleteUser = async (param: formModal) => {
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

        // find Total Access Data
        const findAccess: any = await model.findAccess(param);
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
        await model.deleteAccess(param)
        if (findAccess.length < 2) {
            await model.deleteUser(param)
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

export async function getListEmp() {
    const listEmp: any = await model.listEmp();
    return listEmp
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

    // const total: any = await model.countAll(params);

    // const paginations = await pagination(page, row, total[0].total_all);
    // params.limit = paginations.query

    const listUser: any = await model.list(params, session);

    return {
        // dataPerPage: paginations.dataPerPage,
        // currentPage: paginations.currentPage,
        // totalData: paginations.totalData,
        // totalPage: paginations.totalPage,
        data: listUser,
        key: key
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
