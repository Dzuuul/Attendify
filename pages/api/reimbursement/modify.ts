import cors from "@lib/cors";
import protectAPI from "@lib/protectApi";
import {NextApiRequest, NextApiResponse} from "next";
import {getLoginSession} from "@lib/auth";
import * as fs from "fs"
import * as model from "./_model";
import * as attModel from "../attendance/_model"
import { findHeadHRD } from "../master/_model";
import moment from "moment";

const appRoot = require("app-root-path");
// import {getUser, insertAttachment} from "./_model"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Set desired value here
    }
  }
}
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await cors(req, res)

    const session: any = await getLoginSession(req)
    if (!session) {
      return res.status(401).json({message: "Unauthorized!"})
    }

    if (req.method !== 'POST') {
      return res.status(403).json({message: "Forbidden!"})
    }

    const {file, remType, desc, reqDate, remTitle, address, userId, items, id} = req.body

    const yuserAidi = await model.getUserId(userId)

    const empId = yuserAidi[0].employeeId

    // const farDate = new Date(`${moment().startOf('month').subtract(1, 'months').format("YYYY-MM-DD")} 00:00:00`)
    
    // const checkApprovedButUnclaimedRequest: any = await model.getApprovNotClaimOtherRequestExcThis(empId, parseInt(id))

    // const checkSaldoReim: any = await model.getSaldoAndMore(empId)
    
    // let totalABNTReq = 0
    // for(let x = 0; x < checkApprovedButUnclaimedRequest.length; x++) {
    //   totalABNTReq += checkApprovedButUnclaimedRequest[x].amount
    // }

    // if(checkSaldoReim[0].saldo_pengobatan < amount) {
    //   return res.send({error: "error", message: `Reimburse amount requested too much. Reimburse remaining: Rp. ${checkSaldoReim[0].saldo_pengobatan}`})
    // }
    
    // if((checkSaldoReim[0].saldo_pengobatan - totalABNTReq) < amount) {
    //   return res.send({error: "error", message: `Reimburse amount requested too much. Complete another request first. Reimburse remaining: Rp.${checkSaldoReim[0].saldo_pengobatan - totalABNTReq}`})
    // }

    // const checkOtherRequest: any = await model.getOtherRequestExcThis(empId, parseInt(id))

    // let totalReq = 0
    // for(let x = 0; x < checkOtherRequest.length; x++) {
    //   totalReq += checkOtherRequest[x].amount
    // }

    // if((checkSaldoReim[0].saldo_pengobatan - totalReq) < amount) {
    //   return res.send({error: "error", message: `Reimburse amount requested too much. Complete another request first. Reimburse remaining: Rp.${checkSaldoReim[0].saldo_pengobatan}. Reimburse on progress total: Rp.${totalReq}`})
    // }

    const chkAlrApprovedOrReject = await model.chkAlreadyApprReject(parseInt(id))

    const chkArray = chkAlrApprovedOrReject[0].status_approve
    if(chkArray.includes(1) || chkArray.includes(2)) {
      return res.send({error: "error", message: `Failed to modify. Already approved by one of the approver.`})
    }

    // if(moment(farDate) > moment(reqDate)) {
    //   return res.send({error: "error", message: `Cannot submit reimburse with receipt date less than ${moment(farDate).format("DD MMMM YYYY")}.`})
    // }
    
    await model.startTransaction()

    await model.deleteDataItems(id)
    if(file.length > 0) {
      await model.deleteDataImgs(id)
    }

    let amounte: number = 0
    for(let pijit = 0; pijit < items.length; pijit++) {
      amounte += items[pijit].totalPrice
    }

    await model.modifyReimburse(parseInt(id), reqDate, amounte, desc, remType, remTitle, address)

    for(let pijet = 0; pijet < file.length; pijet++) {
        const base64File = file[pijet]?.split(",")?.[1]
        const bufferFile = Buffer.from(base64File, "base64")
        const filename = `${new Date().getTime()}.jpg`
        const locPath = `${appRoot}/../public`
        const apiImage = `/api/images/${filename}`
        if (!fs.existsSync(locPath)) {
          fs.mkdirSync(locPath, {recursive: true})
        }
        fs.writeFileSync(`${locPath}/${filename}`, bufferFile)
        await model.addAttachment(empId, parseInt(id), apiImage, session)
    }

    for(let pijit = 0; pijit < items.length; pijit++) {
      await model.addToRemItems(items[pijit].name, parseInt(items[pijit].quantity), parseInt(items[pijit].price), id)
    }

    await model.commitTransaction()
    return res.send({message: "Success"})
  } catch (error) {
    await model.rollback()
    res.status(500).send({message: "Failed", data: error})
  }
}
export default protectAPI(handler)