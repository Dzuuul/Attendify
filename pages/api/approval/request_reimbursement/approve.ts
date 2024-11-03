import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import {paginationPSQL} from "@lib/helper";
import { IPagination } from 'interfaces/approval_reimbursement.interface';
import {titleCase} from '../../master';
import { ISession } from 'interfaces/common.interface';
import moment from 'moment';
import { ApprovalForm } from "../../../../interfaces/approval_reimbursement.interface";

// status ==> 1: approved by all approver (but not completed), 0: rejected, 5: processed, 2: reimburse ready, 3: taken, 4: completed 

export const readyReim = async (param: ApprovalForm, session: ISession) => {
    try {
        await model.startTransaction()
        
        const checkReimburseStat = await model.chkReimburseStatus(param)
        
        if(checkReimburseStat[0].status === 0 || checkReimburseStat[0].status === null) {
            return {
                error: {
                    type: 'error',
                    message: 'error',
                    description: 'Failed to Approve. Need to be approved from all approver.'
                }
            }
        }
        if(checkReimburseStat[0].status === 2) {
            return {
                error: {
                    type: 'error',
                    message: 'error',
                    description: 'Failed to Approve. This reimburse already set to ready.'
                }
            }
        }
        if(checkReimburseStat[0].status === 3 || checkReimburseStat[0].status === 4) {
            return {
                error: {
                    type: 'error',
                    message: 'error',
                    description: 'Failed to Approve. This reimburse has been completed.'
                }
            }
        }

        await model.setReimburseReady(2, param, session)


        //  tinggal pasang pusher disini


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

export const completeReim = async (param: ApprovalForm, session: ISession) => {
    try {
        await model.startTransaction()
        
        const checkReimburseStat = await model.chkReimburseStatus(param)
        
        if(checkReimburseStat[0].status === 0 || checkReimburseStat[0].status === null) {
            return {
                error: {
                    type: 'error',
                    message: 'error',
                    description: 'Failed to Approve. Need to be approved from all approver.'
                }
            }
        }
        if(checkReimburseStat[0].status === 4) {
            return {
                error: {
                    type: 'error',
                    message: 'error',
                    description: 'Failed to Approve. This reimburse has been completed.'
                }
            }
        }

        if(checkReimburseStat[0].status === 2) {
            await model.setReimburseReady(3, param, session)
        }

        if (checkReimburseStat[0].status === 3) {
            await model.setReimburseReady(4, param, session)
        }
        //  tinggal pasang pusher disini


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

export const approve = async (rqs: any, session: ISession) => {
    try {
        const decryp: ApprovalForm = JSON.parse(Buffer.from(rqs, 'base64').toString('ascii'))
        
        await model.startTransaction()
        
        // const employee: any = await model.getRequestEmpId(decryp)
        // const requestTypeId = employee[0].reimburseTypeId
        // const chkReqType: any = await model.checkReimburseType(requestTypeId)

        const chckOrder: any = await model.chkOrderApprov(decryp, session)
        let orderQ = chckOrder[0]?.order_approved

        const chkApprvBelowMe: any = await model.chkApproverBelowMe(decryp, orderQ)

        if(chkApprvBelowMe.length > 0) {
            for(let pijet = 0; pijet < chkApprvBelowMe.length; pijet++) {
                if(chkApprvBelowMe[pijet].is_approved === null) {
                    return {
                        error: {
                            type: 'error',
                            message: 'error',
                            description: 'Failed to Approve. Need other supervisor to approve or reject first.'
                        }
                    }
                }
                if(chkApprvBelowMe[pijet].is_approved === 0) {
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
        // // ini approve
        await model.approve(decryp, session)
        await model.changeReimStat(decryp, session)

        // await model.updateStatusOnReim(decryp, session)
        const chkApprvAboveMe: any = await model.chkApproverAboveMe(decryp, orderQ)
        // // approve on request_attendance
        if(chkApprvAboveMe.length < 1) {
        //     //ini kalo gk ada lg yg diatas pangkat si current user
            await model.approveLast(decryp, session)
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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        const session = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({ message: "Unauthorized!" })
        }

        if (req.method !== 'POST') {
            return res.status(403).json({ message: "Forbidden!" })
        }

        const data = req.body.data
        const datas: any = await approve(data, session)

        if (datas.error) {
            res.status(400).json({ status: 400, error: datas.error.description })
        } else {
            return res.json({ status: 200, datas })
        }
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler);