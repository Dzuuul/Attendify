import type { NextApiRequest, NextApiResponse } from 'next'
import * as model from "./_model";
import { ISession } from 'interfaces/common.interface';
import { addReqApproval, checkHead, checkOut, checkRemLeave, getApproverByDiv, getAttendance, getDivisionId } from 'pages/api/attendance/_model';
import { findHeadHRD } from 'pages/api/master/_model';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        if (req.method !== 'GET') {
            return res.status(403).json({ message: "Forbidden!" })
        }
        const checkBlank = await model.checkBlankApprovalLine()
        let sesione = {
            id: 108
        } as unknown as ISession

        if (checkBlank.length > 0) {
            for (let x = 0; x < checkBlank.length; x++) {
                console.log(checkBlank[x].requestId)
                let divisionId: any = await getDivisionId(checkBlank[x].employeeId)
                let ifHead: any = await checkHead(checkBlank[x].employeeId, divisionId[0].id)
                if (ifHead.length < 1) {
                    console.log("no head")
                    let headHRD: any = await findHeadHRD();
                    let tst = await addReqApproval(sesione, headHRD[0].headId, checkBlank[x].requestId, 1)
                }

                if (ifHead[0].divhead == 1 && ifHead[0].depthead == 0) {
                    console.log("is div head")
                    if (ifHead[0].head) {
                        const getDeptHead = ifHead[0].head
                        let tst = await addReqApproval(sesione, getDeptHead, checkBlank[x].requestId, 1)
                    }
                    if (!ifHead[0].head) {
                        const headHRD: any = await findHeadHRD();
                        let tst = await addReqApproval(sesione, headHRD[0].headId, checkBlank[x].requestId, 1)
                    }
                }

                if (ifHead[0].divhead == 0 && ifHead[0].depthead == 0) {
                    console.log("is staff")
                    const getApprover: any = await getApproverByDiv(divisionId[0].id)
                    if (getApprover.length < 1) {
                        console.log(`Error. Ask your HR for adding approval line for your division. DIVISION ID: ${divisionId[0].id}`)
                        return res.status(500).json({ message: `Error. Ask your HR for adding approval line for your division. DIVISION ID: ${divisionId[0].id}`})
                    } else {
                        for (let y = 0; y < getApprover.length; y++) {
                            let tst = await addReqApproval(sesione, getApprover[y].supervisorId, checkBlank[x].requestId, getApprover[y].urutan)
                        }
                    }
                }
            }
            console.log("BREAKER---------------------------------------------------------")
            return res.json({ status: 200, message: "Succeed" })
        } else {
            console.log("BREAKER---------------------------------------------------------")
            return res.json({ status: 200, message: "No blank approver" })
        }
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default handler
