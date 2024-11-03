import type { NextApiRequest, NextApiResponse } from 'next'

const protectAPI = (handler: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            if(new URL(req.headers.referer ? req.headers.referer : "").origin !== process.env.NEXTAUTH_URL) {
                return res.status(403).json({success: false, message: `Forbidden`})
            }
            return handler(req, res)   
        } catch (error) {
            return res.status(403).json({success: false, message: `Forbidden`})
        }
    }
}

export default protectAPI;