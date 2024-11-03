import type { NextApiRequest, NextApiResponse } from 'next'
import * as model from "./_model";
import cors from '../../../lib/cors';

export async function getData() {
    try {
        await model.startTransaction()

        const chkBolongBolong = await model.checkAttdNoOut()

        if(chkBolongBolong.length > 0) {
            for(let x = 0; chkBolongBolong.length > x; x++) {
                await model.forceCheckOut(chkBolongBolong[x].id)
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
        if (req.method !== 'GET') {
            return res.status(403).json({message: "Forbidden!"})
        }
        const data = await getData()
        return res.json(data)
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

export default handler
