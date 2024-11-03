import cors from "@lib/cors";
import protectAPI from "@lib/protectApi";
import { NextApiRequest, NextApiResponse } from "next";
import { getLoginSession } from "@lib/auth";
import * as model from "./_model";
import { getUserId } from "pages/api/approval/request_reimbursement/_model";
import { ISession } from "interfaces/common.interface";


const resCheck = async (req: any, session: ISession) => {
  try {
    const decryp = JSON.parse(Buffer.from(req, 'base64').toString('ascii'))

    const { reimburseId, userId, items, nominal, extNote } = decryp

    const yuserAidi = await getUserId(userId)

    const empId = yuserAidi[0].employeeId
    
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
    
    let totalApproved: number = 0

    for (let pijit = 0; pijit < items.length; pijit++) {
      if (items[pijit].is_checked === 1) {
        let totaler = items[pijit].quantity * items[pijit].price
        totalApproved = totalApproved + totaler
      }
      const getItemId = await model.getItemId(items[pijit].name, parseInt(items[pijit].quantity), parseInt(items[pijit].price), reimburseId)
      await model.modifyRemItems(items[pijit].is_checked, items[pijit].note, parseInt(getItemId[0].id))
    }

    await model.modifyTotalPriceReimburse(empId, nominal, extNote, reimburseId)

    await model.approve(decryp, session)
    await model.changeReimStat(decryp, session)
    
    await model.commitTransaction()
    return "ok"
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
      await cors(req, res)

      const session = await getLoginSession(req)
      if (!session) {
          return res.status(401).json({ message: "Unauthorized!" })
      }

      if (req.method !== 'POST') {
          return res.status(403).json({ message: "Forbidden!" })
      }

      const data = req.body.data
      const datas: any = await resCheck(data, session)

      if (datas.error) {
        res.status(400).json({ status: 400, error: datas.error.description})
    } else {
        return res.json({ status: 200, datas })
    }
  } catch (err: any) {
      res.status(500).json({ message: err.message })
  }
}

export default protectAPI(handler)