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

    const {file, remType, amount, desc, reqDate, remTitle, address, userId, items, id} = req.body

    const yuserAidi = await model.getUserId(userId)

    const empId = yuserAidi[0].employeeId

    await model.startTransaction()

    await model.deleteDataItems(id)
    if(file.length > 0) {
      await model.deleteDataImgs(id)
    }

    const addRequest: any = await model.modifyReimburse(parseInt(id), reqDate, amount, desc, remType, remTitle, address)

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