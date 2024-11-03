import React, { useEffect, useReducer } from "react";
import dynamic from "next/dynamic";
import type { ReactElement } from 'react'
import { getLoginSession } from "../../lib/auth";
import { NextApiRequest } from "next";
import useSWR, { useSWRConfig, SWRConfig } from "swr";
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router';
import { PageHeader, Card, Table, Button, Input, Row, Col, Statistic, Divider } from "antd";
import DashboardLayout from "../../components/layouts/Dashboard";
import { pageCheck } from "../../lib/helper";
import { getData as getDataDaily } from "../api/summary/daily";
import { getData as getDataWeekly } from "../api/summary/weekly";
import { getData as getDataMonthly } from "../api/summary/monthly";
import { IState, IPagination } from "../../interfaces/summary.interface";
import { TableRenderer } from "../../components/TableRenderer";
import SearchBar from "../../components/SearchBar"
import moment from "moment";
import { masterCheckTp, masterCompany, masterDepartment } from "../api/master/index";

export function titleCase(str: any) {
    if(/[A-Z]/.test(str)) {
        let strg = str.replace(/([A-Z])/g, " $1")
        let splitStr = strg.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
        }
        return splitStr.join(' ');
    } else {
        let strg = str.replace(/_/g, ' ')
        let splitStr = strg.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
        }
        return splitStr.join(' ');
    }
}

const { Search } = Input
const ModalFilter = dynamic(() => import("./_filter"), { loading: () => <p>Loading...</p>, ssr: false });

const Summary = (props: any, { fallback }: any) => {
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const router = useRouter();

    const url = `/api/summary/${router.query.periode}?day=${states.filter.day}&week=${states.filter.week}&month=${states.filter.month}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}&company=${states.filter.company}&department=${states.filter.department}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}`
    const { data, error } = useSWR(url)

    const handleTableChange = (pagination: any, filters: any, sorter: any) => {
        setStates({
            data: {
                ...states.data,
                dataPerPage: pagination.pageSize,
                currentPage: pagination.current,
            },
            filter: {
                ...states.filter,
                columns: sorter.field,
                directions: sorter.order
            }
        })
    };

    const resetFilter = () => {
        setStates({
            modalFilter: false,
            data: {
                ...states.data,
                dataPerPage: 10,
                currentPage: 1,
            },
            filter: {
                ...states.filter,
                startDate: '',
                endDate: '',
                day: moment().format("YYYY-MM-DD"),
                week: moment().format("YYYY-MM-DD"),
                month: moment().format("YYYY-MM"),
                department: "",
                company: "",
                columns: "",
                directions: ""
            }
        })
    };
    
    const handleFilter = async (data: any) => {
        setStates({
            filter: {
                ...states.filter,
                startDate: data.startDate ? moment(data.startDate).format("YYYY-MM-DD") : "",
                endDate: data.endDate ? moment(data.endDate).format("YYYY-MM-DD") : "",
                day: moment(data.day).format("YYYY-MM-DD"),
                week: moment(data.week).format("YYYY-MM-DD"),
                month: moment(data.month).format("YYYY-MM"),
                department: data.department,
                company: data.company,
            },
            data: {
                ...states.data,
                currentPage: 0
            },
            modalFilter: false
        })
    };

    const handleSearch = (data: any) => {
        setStates({
            filter: {
                ...states.filter,
                key: data.key
            }
        })
    };
    
    useEffect(() => {
        var columns: any = TableRenderer(states.master.table, states.master.tableFormatter)
        setStates({
            columns: columns
        })
    }, [states.master.table])

    const handleOpenModal = async (param: any) => {
        if (param.name === "openModal" && param.id) {
            setStates({
                [param.name]: param.value,
            });
        } else {
            setStates({
                [param.name]: param.value,
            });
        }
    }

    useEffect(() => {
        if (data) {
            setStates({
                isLoading: false,
                data: {
                    ...states.data,
                    list: data.data,
                    key: states.data.key ? states.data.key : ""
                },
                master: {
                    ...states.master,
                    table: data.tabling,
                },
                totalEmp: data.sum_emp,
                totalAtt: data.sum_att,
                totalAbsent: data.sum_abs,
                totalLateIn: data.sum_late,
                totalEarlyOut: data.sum_early,
                totalNoCheckOut: data.sum_NoCheck,
                totalDayOff: data.sum_dayoff,
                totalLeave: data.sum_leave,
                totalSickLeave: data.sum_SickLeave,
                totalDayWork: data.sum_DayWork,

                // 19 Jul 24
                totalAttendanceAE: data.sum_total_att,
                totalAbsentAE: data.sum_total_abs,
                totalLeaveAE: data.sum_total_lea,
                totalSickLeaveAE: data.sum_total_silea,
                totalDWAE: data.sum_total_dwae,

                totalAttendancePE: data.sum_total_att_pe,
                totalAbsentPE: data.sum_total_abs_pe,
                totalLeavePE: data.sum_total_lea_pe,
                totalSickLeavePE: data.sum_total_silea_pe,
                totalDWPE: data.sum_total_dw_pe,

                totalAttendancePM: data.sum_total_att_pm,
                totalAbsentPM: data.sum_total_abs_pm,
                totalLeavePM: data.sum_total_lea_pm,
                totalSickLeavePM: data.sum_total_silea_pm,
                totalDWPM: data.sum_total_dw_pm,
            })
        }
    }, [data])

    const dataSource = states?.data.list

    dataSource.forEach((i: any, index: number) => {
        i.key = index;
    });

    if (error) {
        return <p>Failed to load</p>
    }

    if (!data && !states.data) {
        setStates({ isLoading: true })
    }

    let weeknumber = moment(states.filter.week).week();

    const expSummary = async () => {
        let param = states.filter
        await exportSummaries(param)
    }

    const expSummary2 = async () => {
        let param = states.filter
        await exportSummaries2(param)
    }

    const exportSummaries = async (data: any) => {
        let res = await window.open(`/api/summary/export/${router.query.periode}?day=${states.filter.day}&week=${states.filter.week}&month=${states.filter.month}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}&company=${states.filter.company}&department=${states.filter.department}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}`)
    }

    const exportSummaries2 = async (data: any) => {
        let res = await window.open(`/api/summary/exportSpec1?day=${states.filter.day}&week=${states.filter.week}&month=${states.filter.month}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}&company=${states.filter.company}&department=${states.filter.department}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}`)
    }

    return (
        <>
            <SWRConfig value={{ fallback }}>
                <PageHeader
                    title={`${titleCase(router.query.periode)} Attendance Summary`}
                    extra={[
                        <Row key="1">
                            {states.access.m_export == 1 ?
                            <>
                                <Col style={{ marginRight: '1em' }}>
                                    <Button
                                        key="1"
                                        onClick={expSummary}
                                        className={'button'}
                                        shape="round"
                                    >
                                        Export
                                    </Button>
                                </Col>
                                {router.query.periode === 'monthly' ?
                                <Col style={{ marginRight: '1em' }}>
                                <Button
                                    key="2"
                                    onClick={expSummary2}
                                    className={'button'}
                                    shape="round"
                                >
                                    Export Summarized Data
                                </Button>
                            </Col>
                            : null }
                            </>
                            : null }
                            <Col>
                                <Button
                                    key="1"
                                    onClick={() =>
                                        handleOpenModal({
                                            name: "modalFilter",
                                            value: true,
                                        })
                                    }
                                    className={'button'}
                                    shape="round"
                                >
                                    Filter
                                </Button>
                            </Col>
                        </Row>
                    ]}
                />
                <Divider>Summary Total</Divider>
                <Row gutter={21} justify="center" className="summary-row" style={{ marginLeft: "12px", marginBottom: "20px", textAlign: "center" }}>
                    <Col span={3}>
                        <Statistic title="Total Employees" value={states.totalEmp} />
                    </Col>
                    <Col span={3}>
                        <Statistic title="Total Attendance" value={states.totalAtt} />
                    </Col>
                    <Col span={3}>
                        <Statistic title="Total Absent" value={states.totalAbsent} />
                    </Col>
                    <Col span={3}>
                        <Statistic title="Total Paid Leave" value={states.totalLeave} />
                    </Col>
                    <Col span={3}>
                        <Statistic title="Total Sick Leave" value={states.totalSickLeave} />
                    </Col>
                    <Col span={3}>
                        <Statistic title="Total Day Work" value={states.totalDayWork} />
                    </Col>
                    {
                        router.query.periode != 'daily' ?
                        <Col span={3}>
                            <Statistic title="Total Day Off" value={states.totalDayOff} />
                        </Col>
                        : null
                    }
                </Row>
                {/* 19 Jul 24 */}
                {/* {router.query.periode === 'monthly' ? 
                <>
                <Divider>Summary of All Employees</Divider>                
                <Row gutter={21} justify="center" className="summary-row" style={{ marginLeft: "12px", marginBottom: "20px", textAlign: "center" }}>
                    <Col span={4}>
                        <Statistic title="Total Attendance" value={states.totalAttendanceAE} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="Total Absent" value={states.totalAbsentAE} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="Total Leave" value={states.totalLeaveAE} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="Total Sick Leave" value={states.totalSickLeaveAE} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="Total" value={states.totalDWAE} />
                    </Col>
                </Row>
                <Divider>Average Attendance Per Employee</Divider>
                <Row gutter={21} justify="center" className="summary-row" style={{ marginLeft: "12px", marginBottom: "20px", textAlign: "center" }}>
                    <Col span={4}>
                        <Statistic title="Ratio Attendance" value={states.totalAttendancePE} precision={3} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="Ratio Absent" value={states.totalAbsentPE} precision={3} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="Ratio Leave" value={states.totalLeavePE} precision={3} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="Ratio Sick Leave" value={states.totalSickLeavePE} precision={3} />
                    </Col>
                    <Col span={4}>
                        <Statistic title="Total (Same as Day Work)" value={states.totalDWPE} precision={3} />
                    </Col>
                </Row>
                <Divider>Average Attendance Per Month</Divider>
                <Row gutter={21} justify="center" className="summary-row" style={{ marginLeft: "12px", marginBottom: "20px", textAlign: "center" }}>
                    <Col span={3}>
                        <Statistic title="% Attendance" value={states.totalAttendancePM} prefix='%' precision={3} />
                    </Col>
                    <Col span={3}>
                        <Statistic title="% Absent" value={states.totalAbsentPM} prefix='%' precision={3} />
                    </Col>
                    <Col span={3}>
                        <Statistic title="% Leave" value={states.totalLeavePM} prefix='%' precision={3} />
                    </Col>
                    <Col span={3}>
                        <Statistic title="% Sick Leave" value={states.totalSickLeavePM} prefix='%' precision={3} />
                    </Col>
                    <Col span={3}>
                        <Statistic title="Percentage" value={states.totalDWPM} prefix='%' precision={3} />
                    </Col>
                </Row>
                </> : null} */}
                <Card
                    className="custom-card"
                    title={router.query.periode === 'daily' ?  
                    `Periode ` + moment(states.filter.day).format("DD MMMM YYYY") : 
                            router.query.periode === 'weekly' ?
                            `Periode Week ` + weeknumber + ' of ' + moment(states.filter.week).format("YYYY") :

                            router.query.periode === "monthly" && states.filter.startDate !== '' ? `Periode ` + moment(states.filter.startDate).format("DD MMMM") + ' - ' + moment(states.filter.endDate).format("DD MMMM YYYY") :  
                            `Periode ` + moment(states.filter.month).format("MMMM YYYY")}
                    extra={
                        <SearchBar handleFilter={handleSearch} filter={states.filter} />
                    }
                >
                    <Table
                        scroll={{ x: true }}
                        loading={states.isLoading}
                        dataSource={dataSource}
                        columns={states.columns}
                        size="middle"
                        pagination={false}
                        onChange={handleTableChange}
                    />
                </Card> 
                <ModalFilter
                    mode={router.query.periode}
                    header={"Filter Attendance"}
                    open={states.modalFilter}
                    master={states.master}
                    data={states.filter}
                    handleOpenModal={handleOpenModal}
                    handleFilter={handleFilter}
                    resetFilter={resetFilter}
                />
            </SWRConfig>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getLoginSession(ctx.req as NextApiRequest)

    if (!session) {
        return {
            redirect: {
                destination: "/login",
                permanent: false
            }
        }
    }

    const userId: number = session.emp;
    const trueRole = await pageCheck(session.username, `/summary/${ctx.query.periode}`)

    if (trueRole.length < 1) {
        return {
            redirect: {
                destination: "/403",
                permanent: false
            }
        }
    }

    const periode = ctx.query.periode

    const params: IPagination = {
        day: moment().format("YYYY-MM-DD"),
        month: "",
        week: "",
        row: 10,
        page: 0,
        key: "",
        direction: "",
        column: "",
        limit: "",
        department: "",
        company: "",
        startDate: '',
        endDate: '',
    }

    const department = await masterDepartment();
    const company = await masterCompany();
    const tablesFormatter = await masterCheckTp()
    const getList = periode === "daily" ? await getDataDaily(params, session) : periode === "weekly" ? await getDataWeekly(params, session) : await getDataMonthly(params, session);
    const totalEmp = getList.sum_emp;
    const totalAtt = getList.sum_att;
    const totalAbsent = getList.sum_abs;
    const totalLateIn = getList.sum_late;
    const totalEarlyOut = getList.sum_early;
    const totalNoCheckOut = getList.sum_NoCheck;
    const totalDayoff = getList.sum_dayoff;
    const totalLeave = getList.sum_leave;
    const totalSickLeave = getList.sum_SickLeave;
    const totalDayWork = getList.sum_DayWork;

    // 19 Jul 24
    const totalAttendanceAE = getList.sum_total_att;
    const totalAbsentAE = getList.sum_total_abs;
    const totalLeaveAE = getList.sum_total_lea;
    const totalSickLeaveAE = getList.sum_total_silea;
    const totalDWAE = getList.sum_total_dw_ae;

    const totalAttendancePE = getList.sum_total_att_pe;
    const totalAbsentPE = getList.sum_total_abs_pe;
    const totalLeavePE = getList.sum_total_lea_pe;
    const totalSickLeavePE = getList.sum_total_silea_pe;
    const totalDWPE = getList.sum_total_dw_pe;

    const totalAttendancePM = getList.sum_total_att_pm;
    const totalAbsentPM = getList.sum_total_abs_pm;
    const totalLeavePM = getList.sum_total_lea_pm;
    const totalSickLeavePM = getList.sum_total_silea_pm;
    const totalDWPM = getList.sum_total_dw_pm;
    //
    const data = {
        list: getList.data,
        key: ""
    }

    return {
        props: {
            fallback: {
                '/api/summary/weekly': JSON.parse(JSON.stringify(data))
            },
            data: JSON.parse(JSON.stringify(data)),
            master: {
                table: JSON.parse(JSON.stringify(getList.tabling)),
                department: JSON.parse(JSON.stringify(department)),
                company: JSON.parse(JSON.stringify(company)),
                tableFormatter: JSON.parse(JSON.stringify(tablesFormatter)),
            },
            columns: [],
            access: {
                m_insert: trueRole[0].m_insert,
                m_update: trueRole[0].m_update,
                m_delete: trueRole[0].m_delete,
                m_view: trueRole[0].m_view,
                m_export: trueRole[0].m_export
            },
            isLoading: false,
            openModal: false,
            typeModal: "",
            dataModal: {},
            filter: {
                key: "",
                directions: "",
                columns: "",
                day: moment().format("YYYY-MM-DD"),
                week: moment().format("YYYY-MM-DD"),
                month: moment().format("YYYY-MM"),
                department: "",
                company: "",
                startDate: '',
                endDate: ''
            },
            userId: userId,
            totalEmp,
            totalAtt,
            totalAbsent,
            totalLateIn,
            totalEarlyOut,
            totalNoCheckOut,
            totalDayoff,
            totalLeave,
            totalSickLeave,
            totalDayWork,
            // 19 Jul 24
            totalAttendanceAE,
            totalAbsentAE,
            totalLeaveAE,
            totalSickLeaveAE,
            totalDWAE,

            totalAttendancePE,
            totalAbsentPE,
            totalLeavePE,
            totalSickLeavePE,
            totalDWPE,

            totalAttendancePM,
            totalAbsentPM,
            totalLeavePM,
            totalSickLeavePM,
            totalDWPM,
            //
        }
    }
}

export default Summary;

Summary.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}