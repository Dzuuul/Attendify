import { NextApiRequest, NextApiResponse } from 'next';
import { getPageCheck } from './_model';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        if (req.method !== 'POST') {
            return res.status(403).json({ message: 'Forbidden!' });
        }
        const username: any = req.body.username ? req.body.username : '';
        const path: any = req.body.path ? req.body.path : '';

        const data = await getPageCheck(username, path);
        return res.json(data);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export default handler;
