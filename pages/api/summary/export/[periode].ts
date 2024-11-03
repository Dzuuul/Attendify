import type { NextApiRequest, NextApiResponse } from "next";
import { getLoginSession } from "@lib/auth";
import * as model from "../_model";
import protectAPI from "../../../../lib/protectApi";
import Cors from "../../../../lib/cors";
import moment from "moment";
import { masterCheckTp } from "../../master";
import { ISession } from "interfaces/common.interface";

interface IPagination {
    day: string | any
    week: string | any
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
    periode: string
}

const excel = require('node-excel-export')

const enumerateDays = async (startDate: any, endDate: any, isWeekday?: boolean, isDayoff?: boolean) => {
    let now = startDate
    const dates = [];

    if (isWeekday) {
        const weekend = [0,6]
        const start = moment(startDate).format('YYYY-MM-DD');
        const end = moment(endDate).format('YYYY-MM-DD');
        const findDayOff = await model.totalDayoffMonthly(start, end)
        const dayOff = findDayOff[0].date ? findDayOff[0].date : [];       
        while (now.isSameOrBefore(endDate)) {
            if (!weekend.includes(now.day()) && (!dayOff.includes(now.format('YYYY-MM-DD')))){
                dates.push(now.format('YYYY-MM-DD'));
            }
            now.add(1, 'days');
        }
        return dates;
    }

    if (isDayoff) {
        const weekend = [0,6]
        const start = moment(startDate).format('YYYY-MM-DD');
        const end = moment(endDate).format('YYYY-MM-DD');
        const findDayOff = await model.totalDayoffMonthly(start, end)
        const dayOff = findDayOff[0].date ? findDayOff[0].date : [];
        
        while (now.isSameOrBefore(endDate)) {
            if (weekend.includes(now.day()) && (!dayOff.includes(now.format('YYYY-MM-DD')))) {
                dates.push(now.format('YYYY-MM-DD'))
            }
            now.add(1, 'days');
        }

        const total = dayOff.length + dates.length;
        return total;
    }
    
    while (now.isSameOrBefore(endDate)) {
        dates.push(now.format('YYYY-MM-DD'));
        now.add(1, 'days');
    }
    return dates;
};

const timeConvert = (d: number) => {
    d = Number(d);
    let h = Math.floor(d / 3600);
    let m = Math.floor(d % 3600 / 60);
    let s = Math.floor(d % 3600 % 60);

    let hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    let mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    let sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
};

const qHourConvert = (tgt: any) => {
    return `((${tgt} % (60*60*24)) / 3600)`
}

const qMinConvert = (tgt: any) => {
    return `(((${tgt} % (60*60*24)) % 3600) / 60)`
}

const qSecConvert = (tgt: any) => {
    return `((${tgt}) % 60)`
}

const countPercentageWeekdays = (att: any, weekday: number) => {
    if (att > 0) {
        const value = Math.round((att / weekday) * 100);
        const displayName = `${value}%`;
        return displayName
    }
    return (att ?? 0);
}

const countPercentageWorking = (working_hour_param: any, work_hour: any, weekday: number) => {
    if (work_hour > 0) {
        const value = Math.round(work_hour / (Number(working_hour_param) * weekday) * 100);
        const displayName = `${value}%`;
        return displayName
    }
    return (work_hour ?? 0);
}

async function summaryDaily(params: IPagination) {
    const {day, month} = params;

    const start = day ? moment(day) : moment.now();
    const end = day ? moment(day) : moment.now();

    params.startDate = moment(start).format("YYYY-MM-DD");
    params.endDate = moment(end).format("YYYY-MM-DD");

    const mapQry = await enumerateDays(start, end);

    let allseconds = ""
    let late = ""
    let check_in = ""
    let check_out = ""
    let check_type = ""
    let qry = ""
    let left = ""
    let group = ""

    for(let n = 0; n < mapQry.length; n++) {
        allseconds += `COALESCE("${mapQry[n]}"."duration", 0)::bigint`;
        late += `COALESCE("${mapQry[n]}"."late", 0)::bigint`;
        check_in += `CASE WHEN "${mapQry[n]}".check_in IS NOT NULL THEN TO_CHAR("${mapQry[n]}".check_in, 'HH24:MI:SS') ELSE '-' END`;
        check_out += `CASE WHEN "${mapQry[n]}".check_out IS NOT NULL THEN TO_CHAR("${mapQry[n]}".check_out, 'HH24:MI:SS') ELSE '-' END`;
        check_type += `"${mapQry[n]}"."description"`;
        qry += `SUM(CASE WHEN DATE(A.created_at) = '${mapQry[n]}' THEN (A.check_type) ELSE 0 END) AS "${mapQry[n]}"`;
        group += `"${mapQry[n]}".check_in, "${mapQry[n]}".check_out, "${mapQry[n]}".description, "${mapQry[n]}"."duration", "${mapQry[n]}"."late", "${mapQry[n]}"."work_hour"`;
        left += `LEFT JOIN (
            SELECT 
                "employeeId", 
                mst_request_type.description,
                A."work_hour",
                (
                    (
                        DATE_PART('day', check_out - A."work_hour") * 24 +
                        DATE_PART('hour', check_out - A."work_hour")
                    ) * 60 +
                    DATE_PART('minute', check_out - A."work_hour")
                ) * 60 + DATE_PART('second', check_out - A."work_hour") AS "duration",
                (
                    (
                        DATE_PART('hour', (CASE WHEN TO_CHAR(check_in, 'HH24:MI') < clock_in  THEN TO_TIMESTAMP(clock_in, 'HH24:MI:SS') ELSE check_in END) - TO_TIMESTAMP(clock_in, 'HH24:MI:SS'))
                    ) * 60 +
                    DATE_PART('minute', (CASE WHEN TO_CHAR(check_in, 'HH24:MI') < clock_in  THEN TO_TIMESTAMP(clock_in, 'HH24:MI:SS') ELSE check_in END) - TO_TIMESTAMP(clock_in, 'HH24:MI:SS'))
                ) * 60 + DATE_PART('second', (CASE WHEN TO_CHAR(check_in, 'HH24:MI') < clock_in  THEN TO_TIMESTAMP(clock_in, 'HH24:MI:SS') ELSE check_in END) - TO_TIMESTAMP(clock_in, 'HH24:MI:SS')) AS "late",
                check_in,
                check_out
            FROM
                attendance
                LEFT JOIN (SELECT id, (check_in + INTERVAL '1 hour') AS "work_hour" FROM attendance) A ON attendance.id = A.id
                LEFT JOIN mst_request_type ON attendance.check_type = mst_request_type.id
                LEFT JOIN mst_shift_det ON attendance."shiftDetId" = mst_shift_det.id
            WHERE
                DATE(check_in) = '${mapQry[n]}' AND mst_request_type.tipe = 1
            GROUP BY "employeeId", check_out, check_in, duration, description, late, A."work_hour"
        ) AS "${mapQry[n]}" ON "${mapQry[n]}"."employeeId" = B.id `;
        
        if(n !== mapQry.length - 1) {
            check_in += ' , ';
            check_out += ' , ';
            allseconds += ' + ';
            late += ' + ';
            check_type += ' , ';
            qry += ', ';
            group += ', ';
        }
    }

    const getFormatter = await masterCheckTp()
    const title4Date = (x: any) => getFormatter.find(({key}: any) => key === parseInt(x))
    let response: any = await model.xportDaily(params, check_in, check_out, qHourConvert(allseconds), qMinConvert(allseconds), qSecConvert(allseconds), qHourConvert(late), qMinConvert(late), check_type, qry, left, group);

    const tabling: any = []
    
    tabling.push({
        key: 'fullname',
        title: "FULLNAME",
        dataIndex: "fullname",
        sorter: true
    })

    if (mapQry.length > 0) {
        const filterData = mapQry.filter((item: any) => item !== 'id')
        const weekeend = [0,6]
        const srtDate = params.startDate ? moment(params.startDate) : moment(month).startOf('month');
        const startOf = moment(srtDate).format('YYYY-MM-DD');
        const endOf = moment(end).format('YYYY-MM-DD');
        const findDayOff = await model.totalDayoffMonthly(startOf, endOf)
        const dayOff = findDayOff[0].date ? findDayOff[0].date : [];
        
        filterData.map((item: any, indx: any) => { 
                tabling.push({
                    key: indx,
                    title: item,
                    dataIndex: item,
                    red: weekeend.includes(srtDate.day()) || dayOff.includes(item) ? true : false
                })
                srtDate.add(1,'days')
            }
        )
    }

    tabling.push(
        {
            key: 'check_in',
            title: "CHECK IN",
            dataIndex: "check_in",
            sorter: true
        },
        {
            key: 'check_out',
            title: "CHECK OUT",
            dataIndex: "check_out",
            sorter: true
        },
        {
            key: 'check_type',
            title: "CHECK TYPE",
            dataIndex: "check_type",
            sorter: true
        },
        {
            key: 'duration_hour',
            title: "TOTAL WORK IN HOUR",
            dataIndex: "duration_hour",
            sorter: true
        },
        {
            key: 'duration_minute',
            title: "TOTAL WORK IN MINUTE",
            dataIndex: "duration_minute",
            sorter: true
        },
        {
            key: 'duration_second',
            title: "TOTAL WORK IN SECOND",
            dataIndex: "duration_second",
            sorter: true
        },
        {
            key: 'late_hour',
            title: "TOTAL LATE IN HOUR",
            dataIndex: "late_hour",
            sorter: true
        },
        {
            key: 'late_minute',
            title: "TOTAL LATE IN MINUTE",
            dataIndex: "late_minute",
            sorter: true
        },
    )

    if (mapQry.length < 1) {
        tabling.push({
            key: '5',
            title: "Columns",
            dataIndex: "columns",
            sorter: true
        })
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
    let objtx = ["fullname", "check_in", "check_out", "check_type", "duration_hour", "duration_minute", "duration_second", "late_hour", "late_minute"]
    for (let index = 0; index < obejctDefine.length; index++) {
        specification[`${obejctDefine[index]}`] = {
            displayName: 
                obejctDefine[index] == "fullname" ? "FULLNAME" :
                obejctDefine[index] == "check_in" ? "CHECK IN" :
                obejctDefine[index] == "check_out" ? "CHECK OUT" :
                obejctDefine[index] == "check_type" ? "CHECK TYPE" :
                obejctDefine[index] == "duration_hour" ? "TOTAL WORK IN HOUR" :
                obejctDefine[index] == "duration_minute" ? "TOTAL WORK IN MINUTE" :
                obejctDefine[index] == "duration_second" ? "TOTAL WORK IN SECOND" :
                obejctDefine[index] == "late_hour" ? "TOTAL LATE IN HOUR" :
                obejctDefine[index] == "late_minute" ? "TOTAL LATE IN MINUTE" :
                obejctDefine[index],
            headerStyle: styles.headerDark,
            cellFormat: (value: any, row: any) => {
                if (obejctDefine[index] === "duration_hour" || obejctDefine[index] === "duration_minute" || obejctDefine[index] === "duration_second" || obejctDefine[index] === "late_hour" || obejctDefine[index] === "late_minute") {
                    return (value ?? 0)
                }
                
                let chk = !objtx.includes(obejctDefine[index]) && !isNaN(value)
                let chkVD = moment(obejctDefine[index])
                let d = new Date(obejctDefine[index])
                return chk && (value == '0' || value == 0) && (chkVD.isValid() && moment(chkVD).isBefore(moment()) && (d.getDay() !== 6 && d.getDay() !== 0)) ? '-' : chk && (value == '0' || value == 0) && !chkVD.isValid() ? '-' : chk ? title4Date(value)?.label : value;
            },
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

    return report
};

async function summaryWeekly(params: IPagination, session: ISession) {
    const {week} = params;

    const start = moment(week, "YYYY-MM-DD").startOf('week');
    const end = moment(week, "YYYY-MM-DD").endOf('week');  
    params.startDate = moment(start).format("YYYY-MM-DD");
    params.endDate = moment(end).format("YYYY-MM-DD");
    
    const mapQry = await enumerateDays(start, end);
    let allseconds = ""
    let late = ""
    let qry = ""
    let left = ""
    let group = ""

    for(let n = 0; n < mapQry.length; n++) {
        allseconds += `COALESCE("${mapQry[n]}"."duration", 0)::bigint`
        late += `COALESCE("${mapQry[n]}"."late", 0)::bigint`;
        qry += `SUM(CASE WHEN DATE(A.created_at) = '${mapQry[n]}' THEN (A.check_type) ELSE 0 END) AS "${mapQry[n]}"`
        group += `"${mapQry[n]}"."duration", "${mapQry[n]}"."late", "${mapQry[n]}"."work_hour"`
        left += `LEFT JOIN (
            SELECT "employeeId",
            A."work_hour",
            (
                (
                    DATE_PART('day', check_out - A."work_hour") * 24 +
                    DATE_PART('hour', check_out - A."work_hour")
                ) * 60 +
                DATE_PART('minute', check_out - A."work_hour")
            ) * 60 + DATE_PART('second', check_out - A."work_hour") AS "duration",
            (
                (
                    DATE_PART('hour', (CASE WHEN TO_CHAR(check_in, 'HH24:MI') < clock_in  THEN TO_TIMESTAMP(clock_in, 'HH24:MI:SS') ELSE check_in END) - TO_TIMESTAMP(clock_in, 'HH24:MI:SS'))
                ) * 60 +
                DATE_PART('minute', (CASE WHEN TO_CHAR(check_in, 'HH24:MI') < clock_in  THEN TO_TIMESTAMP(clock_in, 'HH24:MI:SS') ELSE check_in END) - TO_TIMESTAMP(clock_in, 'HH24:MI:SS'))
            ) * 60 + DATE_PART('second', (CASE WHEN TO_CHAR(check_in, 'HH24:MI') < clock_in  THEN TO_TIMESTAMP(clock_in, 'HH24:MI:SS') ELSE check_in END) - TO_TIMESTAMP(clock_in, 'HH24:MI:SS')) AS "late"
            FROM
                attendance
            LEFT JOIN (SELECT id, (check_in + INTERVAL '1 hour') AS "work_hour" FROM attendance) A ON attendance.id = A.id
            LEFT JOIN mst_shift_det ON attendance."shiftDetId" = mst_shift_det.id
            WHERE
                DATE(attendance.created_at) = '${mapQry[n]}'
        ) AS "${mapQry[n]}" ON "${mapQry[n]}"."employeeId" = B.id `
        
        if(n !== mapQry.length - 1) {
            allseconds += ' + ';
            late += ' + ';
            qry += ', ';
            group += ', ';
        }
    }

    let avgWrap = `ROUND(AVG((${allseconds}) / (3600 * (D.count | 0)))::numeric, 0)`

    const checkGetLastDayBiggerThanToday: boolean = end > moment()

    const isWeekday = await enumerateDays(moment(params.startDate), end ? moment(end) : moment(), true)
    const weekday = isWeekday.length;
    const total_dayoff = await enumerateDays(moment(params.startDate), moment(params.endDate), false, true)

    const getFormatter = await masterCheckTp()
    const title4Date = (x: any) => getFormatter.find(({key}: any) => key === parseInt(x));

    const response: any = await model.xportWeekly(params, qHourConvert(allseconds), qMinConvert(allseconds), qSecConvert(allseconds), avgWrap, qHourConvert(late), qMinConvert(late), qSecConvert(late), qry, weekday, total_dayoff, left, group, checkGetLastDayBiggerThanToday);
    const tabling: any = []

    tabling.push({
        key: 'number',
        title: "No.",
        dataIndex: "number",
        sorter: true
    })

    tabling.push({
        key: 'fullname',
        title: "FULLNAME",
        dataIndex: "fullname",
        sorter: true,
        red: false,
        width: 5,
    })

    if (mapQry.length < 1) {
        tabling.push({
            key: '5',
            title: "Columns",
            dataIndex: "columns",
            sorter: true
        })
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
        headerRed: {
            fill: {
                fgColor: {
                    rgb: "FFFFFF",
                },
            },
            font: {
                color: {
                    rgb: "FF0000",
                },
                sz: 14,
                bold: true,
                underline: true,
                textAlign: "center",
            },
        },
    };
    let specification: any = {};
    let objtx = ["number", "fullname", "average", "duration_hour", "duration_minute", "duration_second", "late_hour", "late_minute", "totalAtt", "totalAbs", "totalDayOff", "totalCuti", "totalSakit", "totalIzin", "perform_working", "perform_weekday"];

    const weekeend = [0,6]
    const findDayOff = await model.totalDayoffWeekly(params.startDate, params.endDate)
    const dayOff = findDayOff[0].date ? findDayOff[0].date : [];
    let startDate: any = [];

    let working_hour_param: any = await model.workHourParam();
    working_hour_param = working_hour_param.length > 0 ? working_hour_param[0].value : 0;
    let perform_working: number = 0;

    for (let index = 0; index < obejctDefine.length; index++) {
        let styleColor: any = styles.headerDark;
        
        if (!objtx.includes(obejctDefine[index])) {
            if (!moment(startDate, "DD/MM/YYYY", true).isValid()) {
                startDate = moment(obejctDefine[index]).startOf('week');   
            }
            
            if (moment(startDate, "DD/MM/YYYY", true).isValid()) {
                if (weekeend.includes(startDate.day()) || dayOff.includes(obejctDefine[index]) )styleColor = styles.headerRed;
                startDate.add(1,'days')            
            }
        }

        specification[`${obejctDefine[index]}`] = {
            displayName: 
                obejctDefine[index] == "number" ? "NO." :
                obejctDefine[index] == "fullname" ? "FULLNAME" :
                obejctDefine[index] == "duration_hour" ? "TOTAL WORK HOUR" :
                obejctDefine[index] == "duration_minute" ? "TOTAL WORK MINUTE" :
                obejctDefine[index] == "duration_second" ? "TOTAL WORK SECOND" :
                obejctDefine[index] == "average" ? "TOTAL AVERAGE WORK HOUR" :
                obejctDefine[index] == "late_hour" ? "TOTAL LATE HOUR" :
                obejctDefine[index] == "late_minute" ? "TOTAL LATE MINUTE" :
                obejctDefine[index] == "totalAtt" ? "H" :
                obejctDefine[index] == "totalAbs" ? "A" :
                obejctDefine[index] == "totalDayOff" ? "DO" :
                obejctDefine[index] == "totalCuti" ? "C" :
                obejctDefine[index] == "totalSakit" ? "S" :
                obejctDefine[index] == "totalIzin" ? "I" :
                obejctDefine[index] == "perform_working" ? "PERFORMANCE PERCENTAGE BY WORKING HOURS" :
                obejctDefine[index] == "perform_weekday" ? "PERFORMANCE PERCENTAGE BY WEEKDAYS" :
                obejctDefine[index],
            headerStyle: styleColor,
            cellFormat: (value: any, row: any) => {
                if (obejctDefine[index] === "average" || obejctDefine[index] === "duration_hour" || obejctDefine[index] === "duration_minute" || obejctDefine[index] === "duration_second" || obejctDefine[index] === "late_hour" || obejctDefine[index] === "late_minute") {
                    if (obejctDefine[index] === "duration_hour") {
                        perform_working = value;
                    }
                    return (value ?? 0)
                }

                if (obejctDefine[index] === "perform_working") {
                    return countPercentageWorking(working_hour_param, perform_working, weekday);
                }

                if (obejctDefine[index] === "perform_weekday") {
                    perform_working = 0
                    return countPercentageWeekdays(value, weekday);
                }
                
                let chk = !objtx.includes(obejctDefine[index]) && !isNaN(value)
                let chkVD = moment(obejctDefine[index])
                let d = new Date(obejctDefine[index])
                return chk && (value == '0' || value == 0) && (chkVD.isValid() && moment(chkVD).isBefore(moment()) && (d.getDay() !== 6 && d.getDay() !== 0)) ? '-' : chk && (value == '0' || value == 0) && !chkVD.isValid() ? '-' : chk ? title4Date(value)?.label : value;
            },
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

    return report
};

async function summaryMonthly(params: IPagination) {
    const {month} = params;
    
    const start = params.startDate ? moment(params.startDate) : moment(month, "YYYY-MM-DD").startOf('month')
    const end = params.endDate ? moment(params.endDate) : moment(month, "YYYY-MM-DD").endOf('month')

    params.startDate = moment(start).format("YYYY-MM-DD");
    params.endDate = moment(end).format("YYYY-MM-DD");

    const mapQry = await enumerateDays(start, end)

    let allseconds = ""
    let late = ""
    let overtime = ""
    let qry = ""
    let left = ""
    let group = ""

    for(let n = 0; n < mapQry.length; n++) {
        allseconds += `COALESCE("${mapQry[n]}"."duration", 0)::bigint`
        late += `COALESCE("${mapQry[n]}"."late", 0)::bigint`;
        overtime += `COALESCE("${mapQry[n]}"."overtime", 0)::bigint`;
        qry += `SUM(CASE WHEN DATE(A.created_at) = '${mapQry[n]}' THEN (A.check_type) ELSE 0 END) AS "${mapQry[n]}"`
        group += `"${mapQry[n]}"."duration", "${mapQry[n]}"."late", "${mapQry[n]}"."overtime", "${mapQry[n]}"."work_hour"`
        left += `LEFT JOIN (
            SELECT "employeeId",
            A."work_hour",
            (
                (
                    DATE_PART('day', check_out - A."work_hour") * 24 +
                    DATE_PART('hour', check_out - A."work_hour")
                ) * 60 +
                DATE_PART('minute', check_out - A."work_hour")
            ) * 60 + DATE_PART('second', check_out - A."work_hour") AS "duration",
            (
                (
                    DATE_PART('hour', (CASE WHEN TO_CHAR(check_in, 'HH24:MI') < clock_in  THEN TO_TIMESTAMP(clock_in, 'HH24:MI:SS') ELSE check_in END) - TO_TIMESTAMP(clock_in, 'HH24:MI:SS'))
                ) * 60 +
                DATE_PART('minute', (CASE WHEN TO_CHAR(check_in, 'HH24:MI') < clock_in  THEN TO_TIMESTAMP(clock_in, 'HH24:MI:SS') ELSE check_in END) - TO_TIMESTAMP(clock_in, 'HH24:MI:SS'))
            ) * 60 + DATE_PART('second', (CASE WHEN TO_CHAR(check_in, 'HH24:MI') < clock_in  THEN TO_TIMESTAMP(clock_in, 'HH24:MI:SS') ELSE check_in END) - TO_TIMESTAMP(clock_in, 'HH24:MI:SS')) AS "late",
            (
                (
                    DATE_PART('hour', (check_out) - TO_TIMESTAMP(clock_out, 'HH24:MI:SS'))
                ) * 60 +
                (DATE_PART('minute', (check_out) - TO_TIMESTAMP(clock_out, 'HH24:MI:00')) - 7)
            ) * 60 AS "overtime"
            FROM
                attendance
            LEFT JOIN (SELECT id, (check_in + INTERVAL '1 hour') AS "work_hour" FROM attendance) A ON attendance.id = A.id
            LEFT JOIN mst_shift_det ON attendance."shiftDetId" = mst_shift_det.id
            WHERE
                DATE(attendance.created_at) = '${mapQry[n]}'
        ) AS "${mapQry[n]}" ON "${mapQry[n]}"."employeeId" = B.id `
        
        if(n !== mapQry.length - 1) {
            allseconds += ' + ';
            late += ' + ';
            overtime += ' + ';
            qry += ', ';
            group += ', ';
        }
    }

    let avgWrap = `ROUND(AVG((${allseconds}) / (3600 * (D.count | 0)))::numeric, 0)`

    const checkGetLastDayBiggerThanToday: boolean = end > moment()

    const isWeekday = await enumerateDays(moment(params.startDate), end ? moment(end) : moment(), true)
    const weekday = isWeekday.length;
    const total_dayoff = await enumerateDays(moment(params.startDate), moment(params.endDate), false, true)

    const getFormatter = await masterCheckTp()
    const title4Date = (x: any) => getFormatter.find(({key}: any) => key === parseInt(x));

    const response: any = await model.xportMonthly(params, qHourConvert(allseconds), qMinConvert(allseconds), qSecConvert(allseconds), avgWrap, qHourConvert(late), qMinConvert(late), qSecConvert(late), qHourConvert(overtime), qMinConvert(overtime), qry, weekday, total_dayoff, left, group, checkGetLastDayBiggerThanToday);
    const tabling: any = []
    
    tabling.push({
        key: 'number',
        title: "No.",
        dataIndex: "number",
        sorter: true
    })

    tabling.push({
        key: 'fullname',
        title: "FULLNAME",
        dataIndex: "fullname",
        sorter: true,
        red: false,
        width: 5,
    })

    if (mapQry.length < 1) {
        tabling.push({
            key: '5',
            title: "Columns",
            dataIndex: "columns",
            sorter: true
        })
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
        headerRed: {
            fill: {
                fgColor: {
                    rgb: "FFFFFF",
                },
            },
            font: {
                color: {
                    rgb: "FF0000",
                },
                sz: 14,
                bold: true,
                underline: true,
                textAlign: "center",
            },
        },
    };
    let specification: any = {};
    let objtx = ["number", "fullname", "average", "duration_hour", "duration_minute", "duration_second", "late_hour", "late_minute", "overtime_hour", "overtime_minute", "totalAtt", "totalAbs", "totalDayOff", "totalCuti", "totalSakit", "totalIzin", "perform_working", "perform_weekday"];

    const weekeend = [0,6]
    const findNationalDO = await model.totalDayoffMonthly(params.startDate, params.endDate)
    const dayOff = findNationalDO[0].date ? findNationalDO[0].date : [];
    let startDate: any = [];

    let working_hour_param: any = await model.workHourParam();
    working_hour_param = working_hour_param.length > 0 ? working_hour_param[0].value : 0;
    let perform_working: number = 0;

    for (let index = 0; index < obejctDefine.length; index++) {
        let styleColor: any = styles.headerDark;
        
        if (!objtx.includes(obejctDefine[index])) {
            if (!moment(startDate, "DD/MM/YYYY", true).isValid()) {
                startDate = moment(obejctDefine[index]).startOf('month');
            }
            
            if (moment(startDate, "DD/MM/YYYY", true).isValid()) {
                if (weekeend.includes(startDate.day()) || dayOff.includes(obejctDefine[index]))styleColor = styles.headerRed;
                startDate.add(1,'days')      
            }
        }

        specification[`${obejctDefine[index]}`] = {
            displayName: 
                obejctDefine[index] == "number" ? "NO." :
                obejctDefine[index] == "fullname" ? "FULLNAME" :
                obejctDefine[index] == "duration_hour" ? "TOTAL WORK HOUR" :
                obejctDefine[index] == "duration_minute" ? "TOTAL WORK MINUTE" :
                obejctDefine[index] == "duration_second" ? "TOTAL WORK SECOND" :
                obejctDefine[index] == "average" ? "TOTAL AVERAGE WORK HOUR" :
                obejctDefine[index] == "late_hour" ? "TOTAL LATE HOUR" :
                obejctDefine[index] == "late_minute" ? "TOTAL LATE MINUTE" :
                obejctDefine[index] == "overtime_hour" ? "OVERTIME HOUR" :
                obejctDefine[index] == "overtime_minute" ? "OVERTIME MINUTE" :
                obejctDefine[index] == "totalAtt" ? "H" :
                obejctDefine[index] == "totalAbs" ? "A" :
                obejctDefine[index] == "totalDayOff" ? "DO" :
                obejctDefine[index] == "totalCuti" ? "C" :
                obejctDefine[index] == "totalSakit" ? "S" :
                obejctDefine[index] == "totalIzin" ? "I" :
                obejctDefine[index] == "perform_working" ? "PERFORMANCE PERCENTAGE BY WORKING HOURS" :
                obejctDefine[index] == "perform_weekday" ? "PERFORMANCE PERCENTAGE BY WEEKDAYS" :
                obejctDefine[index],
            headerStyle: styleColor,
            cellFormat: (value: any, row: any) => {
                if (obejctDefine[index] === "average" || obejctDefine[index] === "duration_hour" || obejctDefine[index] === "late_hour" || obejctDefine[index] === "duration_minute" || obejctDefine[index] === "late_minute" || obejctDefine[index] === "overtime_hour" || obejctDefine[index] === "overtime_minute" || obejctDefine[index] === "duration_second") {
                    if (obejctDefine[index] === "duration_hour") {
                        perform_working = value;
                    }
                    return (value ?? 0)
                }

                if (obejctDefine[index] === "perform_working") {
                    return countPercentageWorking(working_hour_param, perform_working, weekday);
                }

                if (obejctDefine[index] === "perform_weekday") {
                    perform_working = 0
                    return countPercentageWeekdays(value, weekday);
                }
                
                let chk = !objtx.includes(obejctDefine[index]) && !isNaN(value)
                let chkVD = moment(obejctDefine[index])
                let d = new Date(obejctDefine[index])
                return chk && (value == '0' || value == 0) && (chkVD.isValid() && moment(chkVD).isBefore(moment()) && (d.getDay() !== 6 && d.getDay() !== 0)) ? '-' : chk && (value == '0' || value == 0) && !chkVD.isValid() ? '-' : chk ? title4Date(value)?.label : value;
            },
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

    return report
};

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

        const {key, direction, column, day, week, month, department, company, startDate, endDate, periode} = req.query

        let params = {
            key,
            direction,
            column,
            day,
            week,
            month,
            department,
            company,
            startDate,
            endDate,
            periode
        } as IPagination

        if (params.company == "undefined" || params.company == "null") {
            params.company = ""
        }
        if (params.department == "undefined" || params.department == "null") {
            params.department = ""
        }

        let report: any = "";
        if (periode == "daily") {
            report = await summaryDaily(params);
        }

        if (periode == "weekly") {
            report = await summaryWeekly(params, session);
        }

        if (periode == "monthly") {
            report = await summaryMonthly(params);
        }

        res.setHeader("Content-disposition", `attachment;filename=${moment().format("DD-MM-YYYY")}_summary${periode.toString().toUpperCase()}.xlsx`)
        res.send(report);
        return
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export default protectAPI(handler);