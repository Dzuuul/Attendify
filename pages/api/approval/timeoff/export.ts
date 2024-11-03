//FIXXXXX AFTER ALL
import type { NextApiRequest, NextApiResponse } from "next";
import { getLoginSession } from "@lib/auth";
import * as model from "./_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import moment from "moment";
import { IPagination } from "../../../../interfaces/approval_timeoff.interface";
import { getData as getDataHol } from "../../master/dayoff/all";

const excel = require('node-excel-export')

export const calcWrkD = (startDate: any, endDate: any, localHoliday: any) => {
    let day = moment(startDate);
    let wrkHrs = 0;
    
    while (day.isSameOrBefore(endDate,'day')) {
        if (day.day()!=0 && day.day()!=6 && !localHoliday.includes(moment(day).format('YYYY-MM-DD'))) wrkHrs++;
        day.add(1,'d');
    }
    
    return wrkHrs;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        await Cors(req, res)

        const session = await getLoginSession(req)
        if (!session) {
            return res.status(401).json({message: "Unauthorized!"})
        }

        if (req.method !== 'GET') {
            return res.status(403).json({message: "Forbidden!"})
        }

        const {key, direction, column, month, startDate, endDate, status} = req.query

        let params = {
            key,
            direction,
            column,
            startDate,
            endDate,
            status
        } as IPagination

        const start = startDate ? startDate : moment().startOf('month');
        const end = endDate ? endDate : moment().endOf('month');

        params.startDate = moment(start).format("YYYY-MM-DD");
        params.endDate = moment(end).format("YYYY-MM-DD");
        
        const arrHol = await getDataHol();
        const holidays = arrHol.data.map((i: any, idx: number) => moment(i.date).format('YYYY-MM-DD'))

        let response: any = await model.xport(params, session);

        if (response.length > 0) {
            for (let index = 0; index < response.length; index++) {
                const element = response[index];
                response[index]['drqst'] = await calcWrkD(element.start_date, element.end_date, holidays);
            }
        }

        let obejctDefine: any
        if (response.length < 1) {
            obejctDefine = []
        } else {
            obejctDefine = Object.keys(response[0])
        }
        const styles = {
            headerDark: {
                fill: {
                    fgColor: {
                        rgb: "FFFFFF",
                    },
                },
                font: {
                    color: {
                        rgb: "000000",
                    },
                    sz: 14,
                    bold: true,
                    underline: true,
                    textAlign: "center",
                },
            },
        };
        let specification: any = {};
        for (let index = 0; index < obejctDefine.length; index++) {
            specification[`${obejctDefine[index]}`] = {
                displayName: 
                    obejctDefine[index] == "no" ? "NO" :
                    obejctDefine[index] == "fullname" ? "FULLNAME" :
                    obejctDefine[index] == "type" ? "REQUEST TYPE" :
                    obejctDefine[index] == "created_at" ? "CREATED AT" :
                    obejctDefine[index] == "start_date" ? "START DATE" :
                    obejctDefine[index] == "end_date" ? "END DATE" :
                    obejctDefine[index] == "drqst" ? "DAYS REQUESTED" :
                    obejctDefine[index] == "description" ? "DESCRIPTION" :
                    obejctDefine[index] == "status" ? "STATUS" :
                    obejctDefine[index] == "need_approve" ? "NEED APPROVE" :
                    obejctDefine[index] == "status_approve" ? "STATUS APPROVE" :
                    obejctDefine[index] == "saldo_cuti" ? "REMAINING LEAVE" :
                    obejctDefine[index] == "reject" ? "REJECT REASON" :
                    obejctDefine[index],
                headerStyle: styles.headerDark,
                width: 30
            }
        }
        
        const report = excel.buildExport([
            {
                name: "Report",
                specification: specification,
                data: response,
            },
        ]);
        res.setHeader("Content-disposition", `attachment;filename=${moment().format("DD-MM-YYYY")}_summaryRequestTimeOff.xlsx`)
        res.send(report);

    // return res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export default protectAPI(handler);


//LIVE TEMPORARY
//import type { NextApiRequest, NextApiResponse } from "next";
//import { getLoginSession } from "@lib/auth";
//import * as model from "./_model";
//import protectAPI from "../../../lib/protectApi";
//import Cors from "../../../lib/cors";
//import moment from "moment";

//interface IPagination {
//    month: string | any
//    row: string | number
//    page: string | number
//    key: string
//    direction: string
//    column: string
//    limit: number | string
//    department: string
//    company: string
//    startDate?: string | any
//    endDate?: string | any
//}

//const excel = require('node-excel-export')

//const enumerateDays = async (startDate: any, endDate: any, isWeekday?: boolean, isDayoff?: boolean) => {
//    let now = startDate
//    const dates = [];

//    if (isWeekday) {
//        const weekend = [0,6]
//        const start = moment(startDate).format('YYYY-MM-DD');
//        const end = moment(endDate).format('YYYY-MM-DD');
//        const findDayOff = await model.totalDayoffMonthly(start, end)
//        const dayOff = findDayOff[0].date ? findDayOff[0].date : [];       
//        while (now.isSameOrBefore(endDate)) {
//            if (!weekend.includes(now.day()) && (!dayOff.includes(now.format('YYYY-MM-DD')))){
//                dates.push(now.format('YYYY-MM-DD'));
//            }
//            now.add(1, 'days');
//        }
//        return dates;
//    }

//    if (isDayoff) {
//        const weekend = [0,6]
//        const start = moment(startDate).format('YYYY-MM-DD');
//        const end = moment(endDate).format('YYYY-MM-DD');
//        const findDayOff = await model.totalDayoffMonthly(start, end)
//        const dayOff = findDayOff[0].date ? findDayOff[0].date : [];
        
//        while (now.isSameOrBefore(endDate)) {
//            if (weekend.includes(now.day()) && (!dayOff.includes(now.format('YYYY-MM-DD')))) {
//                dates.push(now.format('YYYY-MM-DD'))
//            }
//            now.add(1, 'days');
//        }

//        const total = dayOff.length + dates.length;
//        return total;
//    }
    
//    while (now.isSameOrBefore(endDate)) {
//        dates.push(now.format('YYYY-MM-DD'));
//        now.add(1, 'days');
//    }
//    return dates;
//};

//const handler = async (req: NextApiRequest, res: NextApiResponse) => {
//    try {
//        await Cors(req, res)

//        const session = await getLoginSession(req)
//        if (!session) {
//            return res.status(401).json({message: "Unauthorized!"})
//        }

//        if (req.method !== 'GET') {
//            return res.status(403).json({message: "Forbidden!"})
//        }

//        const {key, direction, column, month, department, company, startDate, endDate} = req.query

//        let params = {
//            key,
//            direction,
//            column,
//            month,
//            department,
//            company,
//            startDate,
//            endDate
//        } as IPagination

//        if (params.company == "undefined" || params.company == "null") {
//            params.company = ""
//        }
//        if (params.department == "undefined" || params.department == "null") {
//            params.department = ""
//        }

//        const start = startDate ? moment(startDate) : moment(month).startOf('month')
//        const end = endDate ? moment(endDate) : moment(month).endOf('month')

//        params.startDate = moment(start).format("YYYY-MM-DD");
//        params.endDate = moment(end).format("YYYY-MM-DD");

//        const mapQry = await enumerateDays(start, end)

//        let qry = ``
//        for(let n = 0; n < mapQry.length; n++) {
//            qry += `SUM(CASE WHEN DATE(A.created_at) = '${mapQry[n]}' THEN (CASE WHEN A.check_type = 1 THEN 1 WHEN A.check_type = 2 THEN 2 ELSE 0 END) ELSE 0 END) AS "${mapQry[n]}"`
            
//            if(n !== mapQry.length - 1) {
//                qry += ', '
//            }
//        }

//        const srtDate = startDate ? moment(startDate) : moment(month).startOf('month');
//        const isWeekday = await enumerateDays(srtDate, end, true)
//        const weekday = isWeekday.length;

//        let response: any = await model.xport(params, qry, weekday);
    
//        const tabling: any = []
        
//        tabling.push({
//            key: 'fullname',
//            title: "Fullname",
//            dataIndex: "fullname",
//            sorter: true
//        })

//        if (mapQry.length > 0) {
//            const filterData = mapQry.filter((item: any) => item !== 'id')
//            const weekeend = [0,6]
//            const startOf = moment(srtDate).format('YYYY-MM-DD');
//            const endOf = moment(end).format('YYYY-MM-DD');
//            const findDayOff = await model.totalDayoffMonthly(startOf, endOf)
//            const dayOff = findDayOff[0].date ? findDayOff[0].date : [];
            
//            filterData.map((item: any, indx: any) => { 
//                    tabling.push({
//                        key: indx,
//                        title: item,
//                        dataIndex: item,
//                        red: weekeend.includes(srtDate.day()) || dayOff.includes(item) ? true : false
//                    })
//                    srtDate.add(1,'days')
//                }
//            )
//        }

//        tabling.push({
//            key: 'totalAtt',
//            title: "Total Attendance",
//            dataIndex: "totalAtt",
//            sorter: true
//        },
//        {
//            key: 'totalAbs',
//            title: "Total Absent",
//            dataIndex: "totalAbs",
//            sorter: true
//        })

//        if (mapQry.length < 1) {
//            tabling.push({
//                key: '5',
//                title: "Columns",
//                dataIndex: "columns",
//                sorter: true
//            })
//        }

//        let obejctDefine: any
//        if (response.length < 1) {
//            obejctDefine = []
//        } else {
//            obejctDefine = Object.keys(response[0])
//        }
//        const styles = {
//            headerDark: {
//                fill: {
//                    fgColor: {
//                        rgb: "FFFFFF",
//                    },
//                },
//                font: {
//                    color: {
//                        rgb: "000000",
//                    },
//                    sz: 14,
//                    bold: true,
//                    underline: true,
//                    textAlign: "center",
//                },
//            },
//        };
//        let specification: any = {};
//        let objtx = ["fullname", "totalAtt", "totalAbs"]
//        for (let index = 0; index < obejctDefine.length; index++) {
//            specification[`${obejctDefine[index]}`] = {
//                displayName: 
//                    obejctDefine[index] == "fullname" ? "FULLNAME" :
//                    obejctDefine[index] == "totalAtt" ? "TOTAL ATTENDANCE" :
//                    obejctDefine[index] == "totalAbs" ? "TOTAL ABSENT" :
//                    obejctDefine[index],
//                headerStyle: styles.headerDark,
//                cellFormat: function(value: any, row: any) {
//                    let chk = !objtx.includes(obejctDefine[index]) && !isNaN(value)
//                    return chk && (value === '0' || value === 0) ? '-' : (!objtx.includes(obejctDefine[index]) && (value == '1' || value == 1)) ? 'H' : value;
//                },
//                width: 30
//            }
//        }
//        const report = excel.buildExport([
//            {
//                name: "Report",
//                specification: specification,
//                data: response,
//            },
//        ]);
//        res.setHeader("Content-disposition", `attachment;filename=${moment().format("DD-MM-YYYY")}_summaryMonthly.xlsx`)
//        res.send(report);

//    // return res.json(data);
//  } catch (err: any) {
//    res.status(500).json({ message: err.message });
//  }
//};

//export default protectAPI(handler);