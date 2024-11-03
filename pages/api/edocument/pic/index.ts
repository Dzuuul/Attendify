import { NextApiRequest, NextApiResponse } from 'next';
import { getPIC } from '../_model';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        if (req.method !== 'POST') {
            return res.status(403).json({ message: 'Forbidden!' });
        }

        const session: any = req.body.session ? req.body.session : [];

        const data = await getPIC(session);
        return res.json(data);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export default handler;
