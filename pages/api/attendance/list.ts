import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import { pagination } from "../../../lib/helper";
import * as model from "./_model";
import { findHeadHRD } from "../master/_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import { ISession } from 'interfaces/common.interface';
import moment from 'moment';
import { IPagination, attReq } from "../../../interfaces/attendance.interface";
import { calcWrkD } from 'pages/approval/timeoff';
import { getData as getHolidays } from '../master/dayoff/all'

interface attdc {
    employeeId: number
    lat: string
    long: string
    clockType?: number
    desc: string
}

interface attdOff {
    employeeId: number
    offType: any
    start: string
    end: string
    desc: string
}

// office lat long
// -6.206466, 106.804465

export async function getTypeAtt() {
    return await model.findTypeAtt();
}

const toRad = (Value: number) => {
    return Value * Math.PI / 180;
}

const checkRadius = (lat: number, lon: number, latKantor: number, lonKantor: number, max: number) => {
    let R = 6371; // km ==> it's the earth radius.
    let dLat = toRad(latKantor - lat);
    let dLon = toRad(lonKantor - lon);
    let latx = toRad(lat);
    let laty = toRad(lat);

    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(latx) * Math.cos(laty);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;
    let range: number = Number(d.toFixed(3))
    range = range * 1000
    if (range <= max) {
        return true
    } else {
        return false
    }
}

async function getDay(data: any) {
    const day = moment().format("dddd");

    if (day == "Sunday") {
        return data.sunday
    }
    if (day == "Monday") {
        return data.monday
    }
    if (day == "Tuesday") {
        return data.tuesday
    }
    if (day == "Wednesday") {
        return data.wednesday
    }
    if (day == "Thursday") {
        return data.thursday
    }
    if (day == "Friday") {
        return data.friday
    }
    if (day == "Saturday") {
        return data.saturday
    }
}

export const checkIn = async (param: attdc, session: ISession) => {
    try {
        const empId: number = param.employeeId ? param.employeeId : 0
        const lat: string = param.lat ? param.lat : ''
        const long: string = param.long ? param.long : ''
        const clockType: number = param.clockType ? param.clockType : 1
        const desc: string = param.desc ? param.desc : ''

        await model.startTransaction()
        const getClockType: any = await model.chkClockType(clockType)
        const needApprv = getClockType[0].need_apprv
 
        const latLong: any = await model.getLatLongOfComp(empId)
        const chkRad: any = await checkRadius(Number(lat), Number(long), latLong[0].lat, latLong[0].long, latLong[0].max_check)
        let requestId = 0

        const daysTaken: any = await model.checkSameDayOnRequestAttToday(empId)
        if(daysTaken.length > 0) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'You cant check-in because you already requested for other attendance type today.'
                }
            }
        }

        if(clockType === 1 && chkRad === false) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'You are out of range for Check in/out.'
                }
            }
        } else {
            const getDataAtt: any = await model.getAttendance(empId)
            if (getDataAtt.length > 0) {
                return {
                    error: {
                        type: 'error',
                        message: 'Error',
                        description: 'Already Checked In.'
                    }
                }
            }

            if (empId === null || empId === 0) {
                return {
                    error: {
                        type: 'warning',
                        message: 'Warning',
                        description: 'You are Not Employee'
                    }
                }
            }

            if(needApprv == 1) {
                const divisionId: any = await model.getDivisionId(empId)
                const getApprover: any = await model.getApproverByDiv(divisionId[0].id)
                const addRequest: any = await model.requestFastLateTime(empId, clockType, desc)
                requestId = addRequest[0].id
                for(let x = 0; x < getApprover.length; x++) {
                    let tst = await model.addReqApproval(session, getApprover[x].supervisorId, addRequest[0].id, getApprover[x].urutan)
                }
            }

            const checkShift: any = await model.checkShift(empId);
            const nowTime : any = moment().format('HH:mm');
            let late : number = 0;

            if (checkShift.length < 1) {
                return {
                    error: {
                        type: 'warning',
                        message: 'Warning',
                        description: 'Something wrong about your shift, please contact your Supervisor.'
                    }
                }
            }

            const data = checkShift[0];
            //for shift has validity period
            if (data.valid_from && data.valid_to) {
                if (moment().isSameOrAfter(moment(data.valid_from)) && moment().isSameOrBefore(moment(data.valid_to))) {
                    const validateDay: any = await getDay(data)
                    if (validateDay == 1) {
                        if (nowTime <= data.clock_in) {
                            late = 0;
                        }
                        if (nowTime > data.clock_in) {
                            late = 1;
                        }
                        await model.checkIn(param.employeeId, lat, long, clockType, desc, session, late, data.shiftDetId, requestId)
                        await model.commitTransaction()
                        return param
                    }
                    if (validateDay == 0) {
                        return {
                            error: {
                                type: 'warning',
                                message: 'Warning',
                                description: 'Today is your day off, happy holiday.'
                            }
                        } 
                    }
                } else {
                    return {
                        error: {
                            type: 'warning',
                            message: 'Warning',
                            description: 'Your shift has expired, please contact your Department Head.'
                        }
                    } 
                }
            }

            //for shift now and on
            if (data.valid_from && !data.valid_to) {
                if (moment().isSameOrAfter(moment(data.valid_from))) {
                    const validateDay: any = await getDay(data)
                    if (validateDay == 1) {
                        if (nowTime <= data.clock_in) {
                            late = 0;
                        }
                        if (nowTime > data.clock_in) {
                            late = 1;
                        }
                        await model.checkIn(param.employeeId, lat, long, clockType, desc, session, late, data.shiftDetId, requestId)
                        await model.commitTransaction()
                        return param
                    }
                    if (validateDay == 0) {
                        return {
                            error: {
                                type: 'warning',
                                message: 'Warning',
                                description: 'Today is your day off, happy holiday.'
                            }
                        } 
                    }
                } else {
                    return {
                        error: {
                            type: 'error',
                            message: 'error',
                            description: 'ERROR'
                        }
                    } 
                }
            }

            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'Something`s wrong in our system. Sorry for the inconvenience.'
                }
            }
        }
    } catch (error) {
        await model.rollback()
        return {
            error: {
                type: 'error',
                message: 'Error',
                description: 'Something`s wrong in our system. Sorry for the inconvenience.'
            }
        }
    }
}

export const checkOut = async (param: attdc, session: ISession) => {
    try {
        const empId: number = param.employeeId ? param.employeeId : 0;
        const lat: string = param.lat ? param.lat : '';
        const long: string = param.long ? param.long : '';
        const desc: string = param.desc ? param.desc : '';
        
        await model.startTransaction()
        const latLong: any = await model.getLatLongOfComp(empId)
        const chkRad: any = await checkRadius(Number(lat), Number(long), latLong[0].lat, latLong[0].long, latLong[0].max_check)
        
        const getDataAtt: any = await model.getAttendance(empId)
        
        const chkAttdF: any = await model.chkAttdFilled(getDataAtt[0].check_type)
        
        if (!getDataAtt[0]) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'Not Yet Checked In.'
                }
            }
        }

        if (getDataAtt[0].check_type === 1 && chkRad === false) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'You are out of range for Check in/out.'
                }
            }
        }

        if (chkAttdF[0].tipe !== 1) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: `It's already filled with another attendance type.`
                }
            }
        }
        
        let early: number = 0;
        const now = moment().format('HH:mm');
        if (now <= getDataAtt[0].clock_out) {
            early = 1;
        }
        if (now > getDataAtt[0].clock_out) {
            early = 0;
        }
        
        await model.checkOut(param.employeeId, lat, long, desc, moment().format("YYYY-MM-DD"), session, early)
        await model.commitTransaction()
        return 'ok'

        //check early out by working hour
        //const check_in = moment(getDataAtt[0].check_in)
        //const duration = moment.duration(moment().diff(check_in));
        //const hours = duration.asHours();
        //let early: number = 0;
        //if (hours <= getDataAtt[0].work_hour) {
        //    early = 1;
        //}
        //if (hours > getDataAtt[0].work_hour) {
        //    early = 0;
        //}

        //checkout with working hour
        //const data = await model.checkOut(param.employeeId, lat, long, desc, moment().format("YYYY-MM-DD"), session, early, getDataAtt[0].work_hour)
    } catch (error) {
        await model.rollback()
        return {
            error: {
                type: 'error',
                message: 'Error',
                description: 'Something`s wrong in our system. Sorry for the inconvenience.'
            }
        }
    }
}

export const reqTimeOff = async (param: attdOff, session: ISession) => {    
    try {
        const empId: number = param.employeeId ? param.employeeId : 0;
        const offType: any = param.offType ? param.offType : '';
        const start: string = param.start ? moment(param.start).format("YYYY-MM-DD") : '';
        const end: string = param.end ? moment(param.end).format("YYYY-MM-DD") : '';
        const desc: string = param.desc ? param.desc : '';

        if(!offType || !start || !end || !desc) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'Fill all fields for requesting time-off.'
                }
            }   
        }

        const chkReverse: any = await model.chkReverseMistakeTimeOff(empId, start, end, offType, desc, session)
        if(chkReverse.length > 0) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'Duplicate Entry. Avoid going backward on browser.'
                }
            }
        }

        const daysTaken: any = await model.checkSameDayOnRequestAtt(empId, start, end)
        if(daysTaken.length > 0) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'Days selected already requested. Get another day.'
                }
            }
        }

        const daysFilled: any = await model.checkAlreadyFilledAtt(empId, start, end)
        if(daysFilled.length > 0) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'Days inputted already filled on Attendance. Get another day.'
                }
            }
        }

        await model.startTransaction()
        //const getApprover: any = await model.getApproverByPos(empId)
        //let tst = await model.addReqApproval(empId, getApprover[0].superiorId, addRequest[0].id, getApprover[0].urutan)
        
        //APPROVE WITH MASTER APPROVAL LINE
        const divisionId: any = await model.getDivisionId(empId)
        
        //check if employee id was head department
        const ifHead: any = await model.checkHead(empId, divisionId[0].id)
        const chkRemLeave: any = await model.checkRemLeave(empId)

        const srt = moment(param.start)
        const nd = moment(param.end)

        const holidays = await getHolidays()

        const arrHol = holidays.data.map((i: any, idx: number) => 
        moment(i.date).format('YYYY-MM-DD')
        )

        const hmDaysReq = calcWrkD(srt, nd, arrHol)

        const chkIsCuti = await model.checkIsCuti(offType)
        if((chkIsCuti[0].is_cuti === 1 && chkIsCuti[0].day_limit) && (hmDaysReq > chkIsCuti[0].day_limit)) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'Too much days requested for leave. Check your remaining leave.'
                }
            }
        }

        if(chkIsCuti[0].is_cuti === 1 && !chkIsCuti[0].day_limit) {
            if(chkRemLeave[0].saldo_cuti < hmDaysReq) {
                return {
                    error: {
                        type: 'error',
                        message: 'Error',
                        description: 'Too much days requested for leave. Check your remaining leave.'
                    }
                }
            }
        }
        
        if (ifHead.length < 1) {
            const addRequest: any = await model.requestOffTime(empId, start, end, offType, desc, session)
            const headHRD: any = await findHeadHRD();
            let tst = await model.addReqApproval(session, headHRD[0].headId, addRequest[0].id, 1)
            await model.commitTransaction()
            return 'ok'
        }
        
        if (ifHead[0].divhead == 1 && ifHead[0].depthead == 0) {
            if (ifHead[0].head) {
                const getDeptHead = ifHead[0].head
                const addRequest: any = await model.requestOffTime(empId, start, end, offType, desc, session)
                let tst = await model.addReqApproval(session, getDeptHead, addRequest[0].id, 1)
                await model.commitTransaction()
                return 'ok'
            }
            if (!ifHead[0].head) {
                const addRequest: any = await model.requestOffTime(empId, start, end, offType, desc, session)
                const headHRD: any = await findHeadHRD();
                let tst = await model.addReqApproval(session, headHRD[0].headId, addRequest[0].id, 1)
                await model.commitTransaction()
                return 'ok'
            }
        }

        if (ifHead[0].divhead == 0 && ifHead[0].depthead == 0) {
            const addRequest: any = await model.requestOffTime(empId, start, end, offType, desc, session)
            const getApprover: any = await model.getApproverByDiv(divisionId[0].id)
            if(getApprover.length < 1) {
                return {
                    error: {
                        type: 'error',
                        message: 'Error',
                        description: 'Error. Ask your HR for adding approval line for your division.'
                    }
                }
            } else {
                for(let x = 0; x < getApprover.length; x++) {
                    let tst = await model.addReqApproval(session, getApprover[x].supervisorId, addRequest[0].id, getApprover[x].urutan)
                }
                await model.commitTransaction()
                return 'ok'    
            }
        }
    } catch (error) {
        await model.rollback()
        return {
            error: {
                type: 'error',
                message: 'Error',
                description: 'Something`s wrong in our system. Sorry for the inconvenience.'
            }
        }
    }
}

export const reqAttendance = async (params: attReq, session: ISession) => {  
    try {
        const employeeId: number = params.employeeId ? params.employeeId : 0;
        const type: any = params.type ? params.type : '';
        const start: string = params.start ? moment(params.start).format("YYYY-MM-DD") : '';
        const start_time: string = params.start_time ? moment(params.start_time).format("HH:mm") : '';
        const end: string = params.end ? moment(params.end).format("YYYY-MM-DD") : '';
        const end_time: string = params.end_time ? moment(params.end_time).format("HH:mm") : '';
        const desc: string = params.desc ? params.desc : '';

        const param = {
            employeeId,
            type,
            start,
            start_time,
            end,
            end_time,
            desc
        }

        const chkReverse: any = await model.chkReverseMistakeAttd(param, session)
        if(chkReverse.length > 0) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'Duplicate Entry. Avoid going backward on browser.'
                }
            }
        }

        const daysTaken: any = await model.checkSameDayOnRequestAtt(employeeId, start, end)
        if(daysTaken.length > 0) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'Days selected already requested. Get another day.'
                }
            }
        }

        const daysFilled: any = await model.checkAlreadyFilledAtt(employeeId, start, end)
        if(daysFilled.length > 0) {
            return {
                error: {
                    type: 'error',
                    message: 'Error',
                    description: 'Days inputted already filled on Attendance. Get another day.'
                }
            }
        }

        await model.startTransaction()
        const divisionId: any = await model.getDivisionId(employeeId)
        
        //check if employee id was head department
        const ifHead: any = await model.checkHead(employeeId, divisionId[0].id)    
        if (ifHead.length < 1) {
            const addRequest: any = await model.requestAttendance(param, session);
            const headHRD: any = await findHeadHRD();
            let tst = await model.addReqApproval(session, headHRD[0].headId, addRequest[0].id, 1)
            await model.commitTransaction()
            return 'ok'
        }
        
        if (ifHead[0].divhead == 1 && ifHead[0].depthead == 0) {
            if (ifHead[0].head) {
                const getDeptHead = ifHead[0].head
                const addRequest: any = await model.requestAttendance(param, session)
                let tst = await model.addReqApproval(session, getDeptHead, addRequest[0].id, 1)
                await model.commitTransaction()
                return 'ok'
            }
            if (!ifHead[0].head) {
                const addRequest: any = await model.requestAttendance(param, session)
                const headHRD: any = await findHeadHRD();
                let tst = await model.addReqApproval(session, headHRD[0].headId, addRequest[0].id, 1)
                await model.commitTransaction()
                return 'ok'
            }
        }

        if (ifHead[0].divhead == 0 && ifHead[0].depthead == 0) {
            const addRequest: any = await model.requestAttendance(param, session)
            const getApprover: any = await model.getApproverByDiv(divisionId[0].id)
            if(getApprover.length < 1) {
                return {
                    error: {
                        type: 'error',
                        message: 'Error',
                        description: 'Error. Ask your HR for adding approval line for your division.'
                    }
                }
            } else {
                for(let x = 0; x < getApprover.length; x++) {
                    let tst = await model.addReqApproval(session, getApprover[x].supervisorId, addRequest[0].id, getApprover[x].urutan)
                }
                await model.commitTransaction()
                return 'ok'
            }
        }
    } catch (error) {
        await model.rollback()
        return {
            error: {
                type: 'error',
                message: 'Error',
                description: 'Something`s wrong in our system. Sorry for the inconvenience.'
            }
        }
    }
}

export async function getData(employeeId: any) {
    const id = employeeId ? employeeId : 0
    if (id === 0 || id == null) {
        return {}
    }

    const datas: any = await model.getAttendance(id);
    return datas[0]
}

export async function listAttendance(param: IPagination) {
    param.startDate = param.startDate ? param.startDate : moment().startOf('month').format('YYYY-MM-DD')
    param.endDate = param.endDate ? param.endDate : moment().endOf('month').format('YYYY-MM-DD')
    param.employeeId = param.employeeId ? param.employeeId : ""
    if (param.employeeId == "" || param.employeeId == null) {
        return []
    }

    const datas: any = await model.listAttendance(param);
    return datas
}

export async function shiftEmployee(param: IPagination) {
    const datas: any = await model.shiftEmployee(param);
    return datas
}

export async function getRemainingLeave(param: IPagination) {
    const datas: any = await model.getRemainLeave(param);
    return datas[0].saldo_cuti
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

        const { employeeId } = req.query

        const data = await getData(employeeId)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler);


// export const reqTimeOff = async (param: attdOff, session: ISession) => {    
//     try {
//         const empId: number = param.employeeId ? param.employeeId : 0;
//         const offType: any = param.offType ? param.offType : '';
//         const start: string = param.start ? moment(param.start).format("YYYY-MM-DD") : '';
//         const end: string = param.end ? moment(param.end).format("YYYY-MM-DD") : '';
//         const desc: string = param.desc ? param.desc : '';

//         if(!offType || !start || !end || !desc) {
//             return {
//                 error: {
//                     type: 'error',
//                     message: 'Error',
//                     description: 'Fill all fields for requesting time-off.'
//                 }
//             }   
//         }
//         await model.startTransaction()
//         const positionId: any = await model.getPositionId(empId)
//         const getApprover: any = await model.getApproverByPos(positionId[0].id)
//         const addRequest: any = await model.requestOffTime(empId, start, end, offType, desc)

//         for(let x = 0; x < getApprover.length; x++) {
//             let tst = await model.addReqApproval(empId, getApprover[x].supervisorId, addRequest[0].id, getApprover[x].urutan)
//         }
        
//         await model.commitTransaction()
//         return 'ok'   
//     } catch (error) {
//         await model.rollback()
//         return {
//             error: {
//                 type: 'error',
//                 message: 'Error',
//                 description: 'Something`s wrong in our system. Sorry for the inconvenience.'
//             }
//         }
//     }
// }