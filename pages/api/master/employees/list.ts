import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "@lib/auth";
import { pagination } from "@lib/helper";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import { IForm } from "../../../../interfaces/employees.interface";
import { ISession } from 'interfaces/common.interface';

interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
    department: string
    company: string
    status: string
}

export const getNewEmpId = () => {
    return model.getNewEmpId();
}

export const getLastId = (id: number) => {
    return model.getLastId(id);
}

export const save = async (param: any) => {
    try {
        const checkIDCard: any = await model.findDuplicate(param);
        if (checkIDCard.length > 0) {
            return {
                error: {
                    type: 'warning',
                    message: 'Warning',
                    description: 'ID Card Already Exist'
                }
            }
        }

        const checkEmail: any = await model.findDuplicateEmail(param);
        if (checkEmail.length > 0) {
            return {
                error: {
                    type: 'warning',
                    message: 'Warning',
                    description: 'Email Already Exist'
                }
            }
        }

        const checkPhone: any = await model.findDuplicatePhone(param);
        if (checkPhone.length > 0) {
            return {
                error: {
                    type: 'warning',
                    message: 'Warning',
                    description: 'Phone or Emergency Contact Already Exist'
                }
            }
        }
        
        await model.startTransaction()
        const id: any = await model.getNewEmpId()
        param.fullname = param.fullname.toUpperCase();
        
        const data: any = await model.save(param)
        
        var syntax = ""
        var query = ""

        for (let index = 0; index < param.education.length; index++) {
            const element =  param.education[index];
            
            query += `(${id[0].lastid},'${element.schoolModal}','${element.majorModal}', ${element.fromModal}, ${element.toModal})`
    
            if (index !== param.education.length - 1) {
                query += ', '
            }

            if (index == param.education.length - 1) {
                await model.saveEdu(query)
            }
        }

        for (let index = 0; index < param.family.length; index++) {
            const element =  param.family[index];

            syntax += `(${id[0].lastid},'${element.nameModal}',${element.relation},'${element.idcardModal}','${element.genderModal}','${element.birthdateModal}')`
    
            if (index !== param.family.length - 1) {
                syntax += ', '
            }

            if (index == param.family.length - 1) {
                await model.saveFam(syntax)
            }
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

export const edit = async (param: any) => {
    try {
        //cek duplicate ktp
        const checkDuplicate: any = await model.findDuplicateKtp(param);
        if (checkDuplicate.length > 0) {
            return {
                error: {
                    type: 'warning',
                    message: 'Warning',
                    description: 'ID Card Already Listed From Another Employee'
                }
            }
        }

        await model.startTransaction();
        await model.updateOne(param);
        var syntax = ""
        var query = ""

        for (let index = 0; index < param.education.length; index++) {
            const element = param.education[index];

            if (element.type === "edit" && element.id !== 0) {
                await model.updateEdu(element)
            }

            if (element.type === "delete" && element.id !== 0) {
                await model.deleteEdu(element.id)
            }

            if (element.type === "add" || element.id === 0) {
                query += `(${param.id}, ${element.educationId}, '${element.schoolModal}', '${element.majorModal}', ${element.fromModal}, ${element.toModal}, ${param.userId})`
    
                if (index !== param.education.length - 1) {
                    query += ', '
                }

                if (index == param.education.length - 1) {
                    await model.saveEdu(query)
                }
            }
        }

        for (let index = 0; index < param.family.length; index++) {
            const element = param.family[index];

            if (element.type === "edit" && element.id !== 0) {
                await model.updateFam(element)
            }

            if (element.type === "delete" && element.id !== 0) {
                await model.deleteFam(element.id)
            }

            if (element.type === "add" || element.id === 0) {
                syntax += `(${param.id}, '${element.nameModal}', ${element.relation}, '${element.idcardModal}', '${element.genderModal}', '${element.birthdateModal}', ${param.userId})`
                if (index !== param.family.length - 1) {
                    syntax += ', '
                }

                if (index == param.family.length - 1) {
                    await model.saveFam(syntax)
                }
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

export const deleteEmployee = async (param: IForm) => {
    try {
        //find Data
        const findOne: any = await model.findOne(Number(param.id));
        
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
        await model.deleteEmployee(param.userId, findOne[0].id)
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

export async function getData(param: IPagination, session: ISession) {
    const row = param.row ? Number(param.row) : 10
    const page = param.page ? Number(param.page) : 0
    const key = param.key ? param.key : ""
    const direction = param.direction ? param.direction : ""
    const column = param.column ? param.column : ""
    const department = param.department ? param.department : ""
    const company = param.company ? param.company : ""
    const status = param.status ? param.status : ""

    let params = {
        row,
        limit: 0,
        key,
        direction,
        column,
        department,
        company,
        status
    } as IPagination
    
    const list: any = await model.list(params, session);

    return {
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

        const {row, key, direction, column, page, department, company, status} = req.query

        let params = {
            row,
            key,
            direction,
            column,
            page,
            department,
            company,
            status
        } as IPagination

        if (params.company == "undefined" || params.company == "null") {
            params.company = ""
        }
        if (params.department == "undefined" || params.department == "null") {
            params.department = ""
        }
        if (params.status == "undefined" || params.status == "null") {
            params.status = ""
        }
        const data = await getData(params, session)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

export default protectAPI(handler);
