import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import { findEmployee } from "../../api/master/index";
import { checkRemLeave } from 'pages/api/attendance/_model';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        let cat: any = req.query.category ? req.query.category : ''
        const session = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({message: "Unauthorized!"})
        }

        if (req.method !== 'GET') {
            return res.status(403).json({message: "Forbidden!"})
        } else if(!req.query) {
            return res.status(403).json({message: "Unknown Type!"})
        }
        
        const type = req.query.type;
        const param: any = req.query.param ? req.query.param : [];

        const data = 
            type === 'find_emps' ? await findEmployee(JSON.parse(param)) :
            type === 'find_remLeave' ? await checkRemLeave(JSON.parse(param)) :
            []
        ;

        return res.json(data);      
    } catch (err: any) {
        res.status(500).json({message: err.message})
    }
}

export default protectAPI(handler);

