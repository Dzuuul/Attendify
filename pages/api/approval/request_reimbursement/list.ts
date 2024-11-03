import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import {paginationPSQL} from "@lib/helper";
import { IPagination } from 'interfaces/approval_reimbursement.interface';
import {titleCase} from '../../master';
import { ISession } from 'interfaces/common.interface';
import moment from 'moment';
import { IForm } from "../../../../interfaces/approval_reimbursement.interface";

export async function getReimburseDetail(id: number) {
    try {
        const details = await model.reimburseDetail(id)
        const items = await model.reimburseItems(id)
        const imgs = await model.reimburseImages(id)

        let datas =  {
            data: details,
            items,
            imgs
        }
        return datas
     } catch (err) {
        return {
            error: {
                type: 'error',
                message: 'error',
                description: 'ERROR'
            }
        }
    }
}

export async function getReimburseID(id: number) {
    const ids = await model.reimburseApprvID(id)
    return ids
}

export async function getData(param: IPagination, session: ISession) {
    const row = param.row ? Number(param.row) : 10
    const page = param.page ? Number(param.page) : 0
    const key = param.key ? param.key : ""
    const direction = param.direction ? param.direction : ""
    const column = param.column ? param.column : ""
    const startDate = param.startDate ? param.startDate : ""
    const endDate = param.endDate ? param.endDate : ""
    const isApproved = param.isApproved ? param.isApproved : ""

    let params = {
        isApproved,
        startDate,
        endDate,
        row,
        limit: 0,
        key,
        direction,
        column,
    } as IPagination

    const total: any = await model.countLists(params, session);

    const paginations = await paginationPSQL(page, row, total[0]? total[0].counts : 0);
    params.limit = paginations.query

    let list = await model.list(params, session);

    const tabling: any = [{
        key: 'no',
        title: 'No',
        dataIndex: 'no',
        sorter: false,
    }]

    list.length > 0 ? Object.keys(list[0]).filter((item: any) => item !== 'id').map((item: any, indx: any) =>
        tabling.push({
            key: indx,
            title: titleCase(item),
            dataIndex: item,
            sorter: true
        })
    ) : tabling.push({
        key: '5',
        title: "Columns",
        dataIndex: "columns",
        sorter: true
    })

    return {
        tabling: tabling,
        dataPerPage: paginations.dataPerPage,
        currentPage: paginations.currentPage,
        totalData: paginations.totalData,
        totalPage: paginations.totalPage,
        data: list,
        key: null
    }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        const session: any = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({ message: "Unauthorized!" })
        }

        if (req.method !== 'GET') {
            return res.status(403).json({ message: "Forbidden!" })
        }

        const {row, key, direction, column, page, startDate, endDate, isApproved} = req.query

        let params = {
            row,
            key,
            direction,
            column,
            page,
            startDate,
            endDate,
            isApproved,
        } as IPagination

        const data = await getData(params, session)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler)