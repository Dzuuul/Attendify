import { NextApiRequest, NextApiResponse } from 'next';
import { getPICDetail } from '../_model';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        if (req.method !== 'POST') {
            return res.status(403).json({ message: 'Forbidden!' });
        }

        const picId: any = req.body.picId ? req.body.picId : [];

        const data = await getPICDetail(picId);
        return res.json(data);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export default handler;
