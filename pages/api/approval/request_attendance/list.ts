import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "@lib/auth";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import { formModal } from "../../../../interfaces/approval_attendance.interface";
import { ISession } from 'interfaces/common.interface';
import moment from 'moment';
import { checkOut, checkRemLeave, getAttendance } from 'pages/api/attendance/_model';
import { paginationPSQL } from '@lib/helper';

interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
}

const getDBD = (startDate: any, endDate: any) => {
    const now = startDate.clone(), dates = [];

    while (now.isSameOrBefore(endDate)) {
        dates.push(now.format('YYYY-MM-DD HH:mm:ss'));
        now.add(1, 'days');
    }
    return dates;
}

const getDBDTime = (startDate: any, endDate: any, start_time: any, end_time: any) => {
    const dates = [];

    const start = (moment(startDate).format('YYYY-MM-DD') + ' ' + start_time);
    const end = (moment(endDate).format('YYYY-MM-DD') + ' ' + end_time);
    dates.push(start);
    dates.push(end);
    return dates;
}

export const approve = async (param: formModal, session: ISession) => {
    try {
        if(session.accessId == 3) {
            const chkReverse: any = await model.chkReverseApproveOverride(param, session)
            if(chkReverse.length > 0) {
                return {
                    error: {
                        type: 'error',
                        message: 'Error',
                        description: 'Duplicate Entry. Avoid going backward on browser.'
                    }
                }
            }
            await model.startTransaction()
            const employee: any = await model.getRequestEmpIdOverride(param)
            const empReqId = employee[0].employeeId
    
            const datesofReq: any = await model.getDatesofRequestOverride(param)
            let startD = moment(datesofReq[0].start_date), endD = moment(datesofReq[0].end_date)
            let dateList = getDBD(startD, endD)
            if (param.requestTypeId == 17) {
                dateList = getDBDTime(startD, endD, param.start_time, param.end_time)
            }
            
            const data = await model.approveOverride(param, session)
            
            // approve on request_attendance
            await model.approveLastOverride(param, session, dateList.length)
            //do it, add rows to Attendance table
            if (param.requestTypeId != 17) {
                for(let j = 0; j < dateList.length; j++) {
                    await model.addRowForAttendanceOverride(param, session, dateList[j], empReqId)
                }
            }
            if (param.requestTypeId == 17) {
                await model.addAttendance(empReqId, dateList[0], dateList[1], session.id, session.emp, param.id, param.requestTypeId, param.description ? param.description : "")
            }
            if(param.requestTypeId == 4) {
                const getDataAtt: any = await getAttendance(empReqId)
                await checkOut(empReqId, '0', '0', param.description as string, moment().format("YYYY-MM-DD"), session, 1)
            }
    
            await model.commitTransaction()
            return 'ok'
        } else {
            const chkReverse: any = await model.chkReverseApprove(param, session)
            if(chkReverse.length > 0) {
                return {
                    error: {
                        type: 'error',
                        message: 'Error',
                        description: 'Duplicate Entry. Avoid going backward on browser.'
                    }
                }
            }
            await model.startTransaction()
            const employee: any = await model.getRequestEmpId(param)
            const empReqId = employee[0].employeeId
    
            const chckOrder: any = await model.chkOrderApprov(param, session)
            let orderQ = chckOrder[0]?.order_approved
            const datesofReq: any = await model.getDatesofRequest(param)
            let startD = moment(datesofReq[0].start_date), endD = moment(datesofReq[0].end_date)
            let dateList = getDBD(startD, endD)
            if (param.requestTypeId == 17) {
                dateList = getDBDTime(startD, endD, param.start_time, param.end_time)
            }
            
            const chkApprvBelowMe: any = await model.chkApproverBelowMe(param, orderQ)
            if(chkApprvBelowMe.length > 0) {
                for(let check = 0; check < chkApprvBelowMe.length; check++) {
                    if(chkApprvBelowMe[check].is_approved === null) {
                        return {
                            error: {
                                type: 'error',
                                message: 'error',
                                description: 'Failed to Approve. Need other supervisor to approve or reject first.'
                            }
                        }
                    }
                    if(chkApprvBelowMe[check].is_approved === 0) {
                        return {
                            error: {
                                type: 'error',
                                message: 'error',
                                description: 'Failed to Approve. This request has been reject by another supervisor.'
                            }
                        }
                    }
                }
            }
            const data = await model.approve(param, session)
            
            const chkApprvAboveMe: any = await model.chkApproverAboveMe(param, orderQ)
            // approve on request_attendance
            if(chkApprvAboveMe.length < 1) {
                await model.approveLast(param, session, dateList.length)
                //do it, add rows to Attendance table
                if (param.requestTypeId != 17) {
                    for(let j = 0; j < dateList.length; j++) {
                        await model.addRowForAttendance(param, session, dateList[j], empReqId)
                    }
                }
                if (param.requestTypeId == 17) {
                    await model.addAttendance(empReqId, dateList[0], dateList[1], session.id, session.emp, param.requestId, param.requestTypeId, param.description ? param.description : "")
                }
                if(param.requestTypeId == 4) {
                    const getDataAtt: any = await getAttendance(empReqId)
                    await checkOut(empReqId, '0', '0', param.description as string, moment().format("YYYY-MM-DD"), session, 1)
                }
            }
    
            await model.commitTransaction()
            return 'ok'
        }
        
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

export const reject = async (param: formModal, session: ISession) => {
    try {
        await model.startTransaction()
        const chckOrder: any = await model.chkOrderApprov(param, session)
        let orderQ = chckOrder[0]?.order_approved
        const chkApprvBelowMe: any = await model.chkApproverBelowMe(param, orderQ)

        if(chkApprvBelowMe.length > 0) {
            for(let j = 0; j < chkApprvBelowMe.length; j++) {
                if(chkApprvBelowMe[j].is_approved === null) {
                    return {
                        error: {
                            type: 'error',
                            message: 'error',
                            description: 'Failed to Reject. Need other supervisor to approve or reject first.'
                        }
                    }
                }
                if(chkApprvBelowMe[j].is_approved === 0) {
                    return {
                        error: {
                            type: 'error',
                            message: 'error',
                            description: 'Failed to Reject. This request has been reject by another supervisor.'
                        }
                    }
                }
            }
        }
        
        await model.reject(param, session)
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

    let total: any = []
    let listUser: any = [];
    let paginations
    if (session.accessId == 5 || session.accessId == 9) {
        total = await model.countList(params, session);
        paginations = await paginationPSQL(page, row, total[0].counts);
        params.limit = paginations.query
        listUser = await model.list(params, session);
    } else {
        total = await model.countListAll(params, session);
        paginations = await paginationPSQL(page, row, total[0].counts);
        params.limit = paginations.query
        listUser = await model.listAll(params, session);
    }
    
    return {
        dataPerPage: paginations.dataPerPage,
        currentPage: paginations.currentPage,
        totalData: paginations.totalData,
        totalPage: paginations.totalPage,
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
