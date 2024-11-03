import * as model from "./_model";
import cors from "../../../lib/cors";
import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import { sortMenu } from "../../../lib/helper"
import protectAPI from "../../../lib/protectApi";
import { IInsert } from "../../../interfaces/menu.interface";

export async function getMenu(param: any) {
    const { username } = param
    return model.getMenu(username)
}

export const sortMenus = async (type: string | number) => {
    const allMenu: any = await model.listAll(type);
    var sort = 0
    var tempLevel = 0
    var tempHeader = null
    var menu = []
    var tempMenu: any = {}
    const data = allMenu

    for (let index = 0; index < data.length; index++) {
        const level = data[index].level
        const header = data[index].menu_header

        tempLevel = parseInt(level)
        tempHeader = header
        tempMenu = []

        Object.assign(data[index], {[`key`]: header});

        if (data[index].sub == 0) {
            tempMenu = data[index]
        }

        if (data[index].sub != 0) {
            continue
        }
        
        for (let j = 0; j < data.length; j++) {
            var subMenu = []
            const headDTL = data[j].sub
            if (header == headDTL && headDTL != 0) {
                if (!tempMenu.children) {
                    Object.assign(tempMenu, {[`children`]: []});
                }

                tempMenu[`children`].push({...data[j], key: data[j].menu_header})
            }

            if (j == data.length - 1) {
                menu.push(tempMenu)
            }  
        }
    }

    return {access: menu, rawAccess: allMenu}
}

//export async function menuLeftAccess(param: any) {
//    const { role } = param

//    const getRole: any = await model.findOneRole(role)
//    const data: any = await model.listLeftAccess(getRole[0].id)
//    const result = data

//    if (data[0].m_insert == null) {
//        const data = await sortMenus("");
//        return data
//    }

//    var tempHeader = 0
//    var prevHeader = 0
//    var tempLevel = 0
//    var tempSub = 0
//    var access = []
//    for (let index = 0; index < result.length; index++) {
//        const accessLength = access.length
//        const element = result[index];
//        const level = Number(result[index].level)

//        if (tempHeader != element.menu_header) {
//            prevHeader = tempHeader
//            tempHeader = element.menu_header
//            tempSub = element.sub
//            Object.assign(result[index], {[`key`]: element.menu_header});
//        }

//        if (tempLevel != level) {
//            tempLevel = level
//        }

//        if (element.sub == 0) {
//            access.push(element)
//            continue
//        }

//        if (element.sub == prevHeader) {
//            Object.assign(result[index - 1], {[`children`]: []});
//        }

//        if (element.sub == tempSub){
//            access[accessLength == 0 ? 0 : accessLength - 1].children.push({...element, key: element.menu_header})
//        }
//    }

//    return {access, rawAccess: data}
//}

export const save = async (param: IInsert) => {
    try {
        //cek duplicate
        const checkDuplicate: any = await model.findOne(param);
        if (checkDuplicate.length > 0) {
            return {
                error: {
                    type: 'warning',
                    message: 'warning',
                    description: 'Menu Already Exist'
                }
            }
        }

        const getLatestData: any = await model.findLatestMenu(param.header);
        param.header = param.header ? param.header : '0'
        param.level = param.level ? param.level : '1'
        param.sort = getLatestData[0].sort + 1

        if (param.header) {
            const ids: any = await model.getMenuId({sort: getLatestData[0].sort});
            var syntax = ""
            var tempId = ""
            if (ids.length > 0) {
                const data = ids
                for (let index = 0; index < data.length; index++) {
                    const id = data[index].id
                    const sort = data[index].sort
                    syntax += `WHEN ${id} THEN ${sort + 1} `
                    if (index == 0) {
                        tempId += '('
                    }

                    tempId += id

                    if (index != data.length - 1) {
                        tempId += ', '
                    }

                    if (index == data.length - 1) {
                        tempId += ')'
                        syntax += ` END WHERE id IN ${tempId}`
                        await model.updateManySort(syntax)
                    }
                }
            }
        }

        await model.startTransaction()
        const data = await model.save(param)
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

export const deleteMenu = async (param: IInsert) => {
    try {
        //find Data
        const getDetail: any = await model.findIdMenu(param)
        if (getDetail.length < 1) {
            return {
                error: {
                    type: 'warning',
                    message: 'warning',
                    description: 'Data Not Found'
                }
            }
        }


        await model.startTransaction()
        await model.deleteOne(getDetail[0].id)
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

export const edit = async (param: IInsert) => {
    try {
        await model.startTransaction()
        await model.updateOne(param)
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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await cors(req, res);

        const session = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({message: "Unauthorized!"})
        }

        if (req.method !== 'GET') {
            return res.status(403).json({message: "Forbidden!"})
        }

        const { type, role } = req.query

        // if (type == 1) {
        //     const data = await menuLeftAccess({role})
        //     return res.json(data)
        // }

        if (type == '2') {
            const data = await sortMenus("")
            return res.json(data)
        }

        if (!type) {
            const data = await getMenu({username: session.username})
            const result = await sortMenu(data)
            return res.send({data: result, session: session})
            // return res.json(await cryptoEncrypt(JSON.stringify({menu: data.rows, session: sessionDec})))
        }
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

export async function menuLeftAccessV2(param: any) {
    const { role } = param

    const getRole: any = await model.findOneRole(role)
    const data: any = await model.listLeftAccess(getRole[0].id)
    const result = data

    var tempHeader = 0
    var prevHeader = 0
    var tempLevel = 0
    var tempSub = 0
    var access = []
    for (let index = 0; index < result.length; index++) {
        const accessLength = access.length
        const element = result[index];
        const level = Number(result[index].level)

        if (tempHeader != element.menu_header) {
            prevHeader = tempHeader
            tempHeader = element.menu_header
            tempSub = element.sub
            Object.assign(result[index], {[`key`]: element.menu_header});
        }

        if (tempLevel != level) {
            tempLevel = level
        }

        if (element.sub == 0) {
            access.push(element)
            continue
        }

        if (element.sub == prevHeader) {
            Object.assign(result[index - 1], {[`children`]: []});
        }

        if (element.sub == tempSub){
            access[accessLength == 0 ? 0 : accessLength - 1].children.push({...element, key: element.menu_header})
        }
    }

    return {access, rawAccess: data}
}

export default protectAPI(handler);