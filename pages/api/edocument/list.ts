import * as model from './_model';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ISession } from 'interfaces/common.interface';

async function loginEdoc(username: string) {
    const result: any = await model.loginEdoc(username);
    return result;
}

async function getMenu(username: string) {
    const result: any = await model.getMenu(username);
    return result;
}

async function getPageCheck(username: string, path: string) {
    const result: any = await model.getPageCheck(username, path);
    return result;
}

async function getPICMissi(session: ISession) {
    const result: any = await model.getPIC(session);
    return result;
}

async function getPICDetail(picId: number) {
    const result: any = await model.getPICDetail(picId);
    return result.length > 0 ? result[0] : [];
}

async function getApprvProject() {
    const result: any = await model.getApprvProject();
    return result;
}

async function findApprv(id: number) {
    const result: any = await model.findApprv(id);
    return result;
}

async function getContactByRole(roleId: number) {
    const result: any = await model.getContactByRole(roleId);
    return result;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        if (req.method !== 'POST') {
            return res.status(403).json({ message: 'Forbidden!' });
        }

        const type = req.body.type;
        const username: any = req.body.username ? req.body.username : '';
        const path: any = req.body.path ? req.body.path : '';
        const session: any = req.body.session ? req.body.session : [];
        const id: any = req.body.id ? req.body.id : [];

        const data =
            type == 'login'
                ? await loginEdoc(username)
                : type == 'menu'
                ? await getMenu(username)
                : type == 'page_check'
                ? await getPageCheck(username, path)
                : type == 'get_pic'
                ? await getPICMissi(session)
                : type == 'get_pic_detail'
                ? await getPICDetail(id)
                : type == 'get_apprv_project'
                ? await getApprvProject()
                : type == 'find_approval'
                ? await findApprv(id)
                : type == 'get_contact_by_role'
                ? await getContactByRole(id)
                : [];

        return res.json(data);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export default handler;
