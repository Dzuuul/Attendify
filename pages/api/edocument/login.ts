import { NextApiRequest, NextApiResponse } from 'next';
import { loginEdoc } from './_model';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        if (req.method !== 'POST') {
            return res.status(403).json({ message: 'Forbidden!' });
        }

        const username: any = req.body.username ? req.body.username : '';

        const data = await loginEdoc(username);
        return res.json(data);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export default handler;
