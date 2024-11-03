import cors from "@lib/cors";
import protectAPI from "@lib/protectApi";
import {NextApiRequest, NextApiResponse} from "next";
import {getLoginSession} from "@lib/auth";
import * as fs from "fs"
import * as model from "./_model";
import * as attModel from "../../attendance/_model"
import { findHeadHRD } from "../../master/_model";

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

    const {file, remType, amount, desc, reqDate, remTitle, address, userId, items} = req.body

    const yuserAidi = await model.getUserId(userId)

    const empId = yuserAidi[0].employeeId

    await model.startTransaction()

    const getRemTypeType = await model.getTipeRemType(remType)

    const divisionId: any = await attModel.getDivisionId(empId)

    const ifHead: any = await attModel.checkHead(empId, divisionId[0].id)

    const addRequest: any = await model.requestReimburse(empId, reqDate, amount, desc, remType, remTitle, address, session)
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
        await model.addAttachment(empId, addRequest[0].id, apiImage, session)
    }

    for(let pijit = 0; pijit < items.length; pijit++) {
      await model.addToRemItems(items[pijit].name, parseInt(items[pijit].quantity), parseInt(items[pijit].price), addRequest[0].id)
    }

    if (ifHead.length < 1) {
      const headHRD: any = await findHeadHRD();
      let tst = await model.addReqApproval(session, headHRD[0].headId, addRequest[0].id, 1)
      await model.commitTransaction()
      return res.send({message: "Success"})
  }
  
  if (ifHead[0].divhead == 1 && ifHead[0].depthead == 0) {
    if (ifHead[0].head) {      
      const getDeptHead = ifHead[0].head  
          let tst = await model.addReqApproval(session, getDeptHead, addRequest[0].id, 1)
          await model.commitTransaction()
          return res.send({message: "Success"})
      }
      if (!ifHead[0].head) {
          const headHRD: any = await findHeadHRD();
          let tst = await model.addReqApproval(session, headHRD[0].headId, addRequest[0].id, 1)
          await model.commitTransaction()
          return res.send({message: "Success"})
      }
  }

  if (ifHead[0].divhead == 0 && ifHead[0].depthead == 0) {
      const getApprover: any = await model.getApproverByDivReimAndType(divisionId[0].id, getRemTypeType[0].tipe)
      for(let x = 0; x < getApprover.length; x++) {
        let tst = await model.addReqApproval(session, getApprover[x].supervisorId, addRequest[0].id, getApprover[x].urutan)
      }
      await model.commitTransaction()
      return res.send({message: "Success"})
  }

    await model.commitTransaction()
    return res.send({message: "Success"})
  } catch (error) {
    await model.rollback()
    res.status(500).send({message: "Failed", data: error})
  }
}
export default protectAPI(handler)