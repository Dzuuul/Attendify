import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "@lib/auth";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import { formModal, IPagination } from "../../../../interfaces/approval_timeoff.interface";
import { ISession } from 'interfaces/common.interface';
import moment from 'moment';
import { checkRemLeave } from 'pages/api/attendance/_model';
import { getData as getHolidays } from '../../master/dayoff/all'
import { calcWrkD } from 'pages/approval/timeoff';
import { paginationPSQL } from '@lib/helper';

const getDBDTimeOff = (startDate: any, endDate: any) => {
    let day = moment(startDate)
    let dates = []

    while (day.isSameOrBefore(endDate, 'day')) {
        if (day.day() != 0 && day.day() != 6) {
            dates.push(day.format('YYYY-MM-DD HH:mm:ss'))
        };
        day.add(1, 'days');
    }
    return dates;
}

export const approve = async (param: formModal, session: ISession) => {
    try {
        if (session.accessId == 3) {
            const chkReverse: any = await model.chkReverseApproveOverride(param, session)
            if (chkReverse.length > 0) {
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

            const user = await model.selectUser(empReqId)
            const chkReqType: any = await model.checkRequestType(param.requestTypeId)

            const datesofReq: any = await model.getDatesofRequestOverride(param)
            let startD = moment(datesofReq[0].start_date), endD = moment(datesofReq[0].end_date)
            let dateList = getDBDTimeOff(startD, endD)

            const holidays = await getHolidays()

            const arrHol = holidays.data.map((i: any, idx: number) =>
                moment(i.date).format('YYYY-MM-DD')
            )

            let totalLeaveReq = calcWrkD(startD, endD, arrHol)
            const chkRemLeave: any = await checkRemLeave(empReqId)
            let remLeaveAfterApprv = chkRemLeave[0].saldo_cuti - totalLeaveReq

            await model.approveOverride(param, session)

            // approve on request_attendance
            //ini kalo gk ada lg yg diatas pangkat si current user
            // reduce leave limit if type not 3
            if (chkReqType[0].tipe !== 3) {
                // await model.updateLeaveRemEmp(empReqId, remLeaveAfterApprv)
                let dataTrs = {
                    id: 0,
                    byId: user[0].id,
                    reqId: param.id,
                    date: '',
                }

                let dataEmp = {
                    saldoCuti: remLeaveAfterApprv,
                    id: empReqId,
                }

                let currentDate = new Date(param.start_date)
                const endDate = new Date(param.end_date)

                while (currentDate <= endDate) {
                    dataTrs.date = moment(currentDate).format('YYYY-MM-DD')
                    const listDayOff = await model.ListEmpTrsId(empReqId)
                    dataTrs.id = listDayOff[0].min_id
                    currentDate.setDate(currentDate.getDate() + 1)
                    await model.updateTrsEmpLeave(dataTrs)
                }

                await model.updateMstEmp(dataEmp)
            }
            await model.approveLastOverride(param, session, dateList.length)
            //do it, add rows to Attendance table
            for (let j = 0; j < dateList.length; j++) {
                await model.addRowForAttendanceOverride(param, session, dateList[j], empReqId)
            }
            await model.commitTransaction()
            return 'ok'
        } else {
            console.log(param)
            const chkReverse: any = await model.chkReverseApprove(param, session)
            if (chkReverse.length > 0) {
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

            const user = await model.selectUser(empReqId)
            const chkReqType: any = await model.checkRequestType(param.requestTypeId)
            const chckOrder: any = await model.chkOrderApprov(param, session)
            let orderQ = chckOrder[0]?.order_approved

            const datesofReq: any = await model.getDatesofRequest(param)
            let startD = moment(datesofReq[0].start_date), endD = moment(datesofReq[0].end_date)
            let dateList = getDBDTimeOff(startD, endD)

            const holidays = await getHolidays()

            const arrHol = holidays.data.map((i: any, idx: number) =>
                moment(i.date).format('YYYY-MM-DD')
            )

            let totalLeaveReq = calcWrkD(startD, endD, arrHol)
            const chkRemLeave: any = await checkRemLeave(empReqId)
            let remLeaveAfterApprv = chkRemLeave[0].saldo_cuti - totalLeaveReq
            const chkApprvBelowMe: any = await model.chkApproverBelowMe(param, orderQ)

            if (chkApprvBelowMe.length > 0) {
                for (let pijet = 0; pijet < chkApprvBelowMe.length; pijet++) {
                    if (chkApprvBelowMe[pijet].is_approved === null) {
                        return {
                            error: {
                                type: 'error',
                                message: 'error',
                                description: 'Failed to Approve. Need other supervisor to approve or reject first.'
                            }
                        }
                    }
                    if (chkApprvBelowMe[pijet].is_approved === 0) {
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
            // ini approve
            await model.approve(param, session)

            const chkApprvAboveMe: any = await model.chkApproverAboveMe(param, orderQ)
            // approve on request_attendance
            if (chkApprvAboveMe.length < 1) {
                //ini kalo gk ada lg yg diatas pangkat si current user
                // reduce leave limit if type not 3
                if (chkReqType[0].tipe !== 3) {
                    // await model.updateLeaveRemEmp(empReqId, remLeaveAfterApprv)

                    let dataTrs = {
                        id: 0,
                        byId: user[0].id,
                        reqId: param.requestId,
                        date: '',
                    }

                    let dataEmp = {
                        saldoCuti: remLeaveAfterApprv,
                        id: empReqId,
                    }

                    let currentDate = new Date(param.start_date)
                    const endDate = new Date(param.end_date)

                    while (currentDate <= endDate) {
                        dataTrs.date = moment(currentDate).format('YYYY-MM-DD')
                        const listDayOff = await model.ListEmpTrsId(empReqId)
                        dataTrs.id = listDayOff[0].min_id
                        currentDate.setDate(currentDate.getDate() + 1)
                        await model.updateTrsEmpLeave(dataTrs)
                    }

                    await model.updateMstEmp(dataEmp)
                }
                await model.approveLast(param, session, dateList.length)
                //do it, add rows to Attendance table
                for (let j = 0; j < dateList.length; j++) {
                    await model.addRowForAttendance(param, session, dateList[j], empReqId)
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

        if (chkApprvBelowMe.length > 0) {
            for (let j = 0; j < chkApprvBelowMe.length; j++) {
                if (chkApprvBelowMe[j].is_approved === null) {
                    return {
                        error: {
                            type: 'error',
                            message: 'error',
                            description: 'Failed to Reject. Need other supervisor to approve or reject first.'
                        }
                    }
                }
                if (chkApprvBelowMe[j].is_approved === 0) {
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

export const deleteData = async (param: formModal, session: ISession) => {
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
        await model.deleteData(param, session)
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
    const row = param.row != 'undefined' ? Number(param.row) : 10
    const page = param.page != 'undefined' ? Number(param.page) : 0
    const key = param.key ? param.key : ""
    const direction = param.direction ? param.direction : ""
    const column = param.column ? param.column : ""
    const start = moment().startOf('month');
    const end = moment().endOf('month');
    const startDate = param.startDate ? moment(param.startDate).format("YYYY-MM-DD") : moment(start).format("YYYY-MM-DD");
    const endDate = param.endDate ? moment(param.endDate).format("YYYY-MM-DD") : moment(end).format("YYYY-MM-DD");
    const status = param.status ? param.status : "";

    let params = {
        row,
        limit: 0,
        key,
        direction,
        column,
        startDate,
        endDate,
        status
    } as IPagination

    let total: any = []
    let listUser: any = [];
    let paginations
    if (session.accessId == 5 || session.accessId == 9) {
        total = await model.countList(params, session);
        paginations = await paginationPSQL(page, row, total[0]?.counts || 0);
        params.limit = paginations.query
        listUser = await model.list(params, session);
    } else {
        total = await model.countListAll(params, session);
        paginations = await paginationPSQL(page, row, total[0]?.counts);
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
            return res.status(401).json({ message: "Unauthorized!" })
        }

        if (req.method !== 'GET') {
            return res.status(403).json({ message: "Forbidden!" })
        }

        const { row, key, direction, column, page, startDate, endDate, status } = req.query

        let params = {
            row,
            key,
            direction,
            column,
            page,
            startDate,
            endDate,
            status
        } as IPagination

        const data = await getData(params, session)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler);
