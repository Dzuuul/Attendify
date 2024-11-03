import type { NextApiRequest, NextApiResponse } from "next";
import { getLoginSession } from '@lib/auth';
// import { pagination, hashPassword } from "../../../lib/serverHelper";
import * as model from "./_model";
import protectAPI from "../../../lib/protectApi";
import Cors from "../../../lib/cors";
import moment from "moment"
import { getTotalAbsent, getTotalAbsentNoHeader, getTotalAtt, getTotalAttNoHeader, getTotalDayWork, getTotalEmp, getTotalEmpNoHeader, getTotalLeave, getTotalLeaveNoHeader, getTotalSickLeave, getTotalSickLeaveNoHeader } from "./monthly";

interface IPagination {
    month: string | any
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
    department: string
    company: string
    startDate?: string | any
    endDate?: string | any
}

const excel = require('node-excel-export')

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await Cors(req, res);

    const session = await getLoginSession(req);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    if (req.method !== "GET") {
      return res.status(403).json({ message: "Forbidden!" });
    }

    const {key, direction, column, month, department, company, startDate, endDate} = req.query

        const monthz = month ? month : moment()
        let params = {
            key: key ? key : '',
            direction: direction ? direction : '',
            column: column ? column : '',
            month: monthz,
            department: department ? department : '',
            company: company ? company : '',
            startDate: startDate ? startDate : moment(monthz).startOf('month'),
            endDate: endDate ? endDate: moment(monthz).endOf('month')
        } as IPagination

        if (params.company == "undefined" || params.company == "null") {
            params.company = ""
        }
        if (params.department == "undefined" || params.department == "null") {
            params.department = ""
        }
        if (params.startDate == "undefined") {
            params.startDate = moment(params.month).startOf('month')
        }
        if (params.endDate == "undefined") {
            params.endDate = moment(params.month).endOf('month')
        }

        const totalEmp = await getTotalEmpNoHeader(params, session);

        const totalAtt = await getTotalAttNoHeader(params);
        const totalAbs = await getTotalAbsentNoHeader(params, session);
        const totalLeave = await getTotalLeaveNoHeader(params);
        const totalSickLeave = await getTotalSickLeaveNoHeader(params);
        const totalDayWork = await getTotalDayWork(params);

        const totalDayWorkofAllEmp = totalEmp * totalDayWork

        const totalAttendancePE = totalAtt / totalEmp
        const totalAbsentPE = totalAbs / totalEmp
        const totalLeavePE = totalLeave / totalEmp
        const totalSickLeavePE = totalSickLeave / totalEmp
        const totalPE = totalAttendancePE + totalAbsentPE + totalLeavePE + totalSickLeavePE

        const totalAttendancePM = totalAttendancePE / totalDayWork
        const totalAbsentPM = totalAbsentPE / totalDayWork
        const totalLeavePM = totalLeavePE / totalDayWork
        const totalSickLeavePM = totalSickLeavePE / totalDayWork
        const totalPM = totalAttendancePM + totalAbsentPM + totalLeavePM + totalSickLeavePM

        let response:any[] = [
            {category: 'Total Hari Kerja', H: totalAtt, A: totalAbs, C: totalLeave, S: totalSickLeave, total: totalDayWorkofAllEmp},
            {category: 'Rata-rata kehadiran / karyawan', H: totalAttendancePE, A: totalAbsentPE, C: totalLeavePE, S: totalSickLeavePE, total: totalPE},
            {category: 'Rata-rata kehadiran / bulan (%)', H: totalAttendancePM * 100, A: totalAbsentPM * 100, C: totalLeavePM * 100, S: totalSickLeavePM * 100, total: totalPM * 100}
        ]

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
                displayName: obejctDefine[index],
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
        res.setHeader("Content-disposition", `attachment;filename=${moment(monthz).format("DD-MM-YYYY")}_SummarizedSummary.xlsx`)
        res.send(report);

    // return res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export default protectAPI(handler);
