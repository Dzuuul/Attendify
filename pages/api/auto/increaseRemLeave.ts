import type { NextApiRequest, NextApiResponse } from 'next'
import * as model from "./_model";
import cors from '../../../lib/cors';

export async function getData() {
    try {
        await model.startTransaction()

        //Collect id active employee
        const chkRemLeave = await model.checkRemLeave()

        if(chkRemLeave.length > 0) {
            for(let index = 0; chkRemLeave.length > index; index++) {
                const element = chkRemLeave[index];

                const result = parseInt(element.saldo_cuti) + 12;
                const data: any = await model.updateRemLeave(element.id, result)
            }
        }
        
        await model.commitTransaction()
        return 'ok'
    } catch (err) {
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
        cors(req, res)
        if (req.method !== 'POST') {
            return res.status(403).json({message: "Forbidden!"})
        }
        const data = await getData()
        return res.json(data)
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

export default handler
