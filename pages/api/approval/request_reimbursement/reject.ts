import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import { ISession } from 'interfaces/common.interface';
import { ApprovalForm } from "../../../../interfaces/approval_reimbursement.interface";

export const reject = async (rqs: any, session: ISession) => {
    try {
        const decryp: ApprovalForm = JSON.parse(Buffer.from(rqs, 'base64').toString('ascii'))
        
        await model.startTransaction()
        
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
                            description: 'Failed to Reject. Need other supervisor to approve or reject first.'
                        }
                    }
                }
                if(chkApprvBelowMe[pijet].is_approved === 0) {
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
        await model.reject(decryp, session)

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
        const datas: any = await reject(data, session)

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