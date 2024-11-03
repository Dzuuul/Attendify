import type { NextApiRequest, NextApiResponse } from 'next'
import { getLoginSession } from "../../../lib/auth";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import {paginationPSQL} from "@lib/helper";
import { IPagination } from 'interfaces/reimbursement.interface';
import {titleCase} from '../master';
import moment from 'moment';
// import { extendMoment } from 'moment-range';

// const moment = extendMoment(Moment);

export async function getReimburseDetail(id: number) {
    try {
        const reimSep = await model.reimburseSeparator()
        const reSep = reimSep.length < 1 ? 10 : reimSep[0].value
        const getReimburseID = await model.reimburseID(id)
        const details = await model.reimburseDetail(getReimburseID[0].reimburseId)
        const items = await model.reimburseItems(getReimburseID[0].reimburseId)

        const reqName = await model.reimburseNameReu(getReimburseID[0].reimburseId)

        // check reimburse timeline, ambil bulan lalu atau kagak
        const allowance = await model.allowanceReimburse(details[0].employeeId)

        const rg1 = new Date(`${moment().startOf('month').format("YYYY-MM-DD")} 00:00:00`)

        const rg2 = new Date(`${moment().endOf('month').format("YYYY-MM-DD")} 23:59:59`)
        
        const treshold = new Date(`${moment().format("YYYY-MM")}-${reSep} 23:59:59`)

        const farDate = new Date(`${moment().startOf('month').subtract(1, 'months').format("YYYY-MM-DD")} 00:00:00`)
        // const range = moment().range(rg1, rg2)

        let periode
        let onPgrs

        let prevReimburse = []
        let prv: number = 0
        let prvPrc: number = 0

        let count = 0

        let autoReject: boolean = false

        if(
        (moment(details[0].created_at) < moment(details[0].receipt_date)) ||
        (moment(farDate) > moment(details[0].receipt_date)) || 
        ((moment(rg1) > moment(details[0].receipt_date)) && (moment(details[0].created_at) > moment(treshold)))
        ) 
        {
            autoReject = true
        }

        prevReimburse = await model.previousReimburse(details[0].employeeId, `${moment(details[0].receipt_date).startOf('month').format("YYYY-MM-DD") + ' 00:00:00'}`, `${moment(details[0].receipt_date).endOf('month').format("YYYY-MM-DD") + ' 23:59:59'}`)

        for(let x = 0; x < prevReimburse.length;x++) {
            prv += parseInt(prevReimburse[x].counts)
        }

        onPgrs = await model.previousReimburseProcessed(getReimburseID[0].reimburseId, details[0].employeeId, `${moment(details[0].receipt_date).startOf('month').format("YYYY-MM-DD") + ' 00:00:00'}`, `${moment(details[0].receipt_date).endOf('month').format("YYYY-MM-DD") + ' 23:59:59'}`)
        
        for(let x = 0; x < onPgrs.length;x++) {
            prvPrc += parseInt(onPgrs[x].counts)
        }

        if(allowance[0].saldo_pengobatan < prv) {
            count = 0
        } else {
            count = allowance[0].saldo_pengobatan - prv
        }

        periode = 1

        let imgs = await model.reimburseImages(getReimburseID[0].reimburseId)
        if(imgs.length < 1) {
            imgs = [{
                src: ''
            }]
        }

        let datas =  {
            data: details,
            items,
            imgs,
            allowed: count,
            periode,
            processed: prvPrc,
            autoReject,
            requester: reqName[0].fullname
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

export async function getReimburseDetailEmployee(id: number) {
    try {
        const details = await model.reimburseDetail(id)
        const items = await model.reimburseItems(id)
        let imgs = await model.reimburseImages(id)

        if(imgs.length < 1) {
            imgs = [{
                src: ''
            }]
        }
        let datas =  {
            data: details,
            items,
            imgs,
            requester: ''
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

export async function getData(param: IPagination) {
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

    const total: any = await model.countLists(params);

    const paginations = await paginationPSQL(page, row, total[0].total_all);
    params.limit = paginations.query

    let list = await model.list(params);

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

        const data = await getData(params)

        return res.json(data)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
}

export default protectAPI(handler)