import React, { useEffect, useReducer } from "react";
import type { ReactElement } from 'react'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import useSWR, { SWRConfig } from "swr";
import dynamic from "next/dynamic";
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router';
import { PageHeader, Card, Table, Space, Tag, Col, Button, Row } from "antd";
import DashboardLayout from "../../../components/layouts/Dashboard";
import { pageCheck } from "../../../lib/helper";
import { getData } from "../../api/approval/timeoff/list";
import { masterShift, masterCompany, masterEmployee, masterTimeoff } from "../../api/master/index";
import { useApp } from "../../../context/AppContext";
import { IState } from "../../../interfaces/approval_timeoff.interface";
import Notifications from "../../../components/Notifications";
import SearchBar from "../../../components/SearchBar";
import moment from "moment";
import { showApprove, showDeleteConfirm } from "../../../components/modals/ModalAlert";
import { getData as getDataHol } from "../../api/master/dayoff/all"

const Modals = dynamic(() => import('./_modal'), { loading: () => <p></p> })
const ModalView = dynamic(() => import('./_view'), { loading: () => <p></p> })
const ModalAdd = dynamic(() => import('./_modalAdd'), { loading: () => <p></p> })
const ModalFilter = dynamic(() => import("./_filter"), { loading: () => <p>Loading...</p>, ssr: false });

export const calcWrkD = (startDate: any, endDate: any, localHoliday: any) => {
    let day = moment(startDate);
    let wrkHrs = 0;

    while (day.isSameOrBefore(endDate, 'day')) {
        if (day.day() != 0 && day.day() != 6 && !localHoliday.includes(moment(day).format('YYYY-MM-DD'))) wrkHrs++;
        day.add(1, 'd');
    }

    return wrkHrs;
}

const Employee = (props: any, { fallback }: any) => {
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const router = useRouter();
    const { statesContex, setSubmitNotif } = useApp();

    const url = `/api/approval/timeoff/list?page=${states.data.currentPage}&row=${states.data.dataPerPage}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}&status=${states.filter.status}`
    const { data, error } = useSWR(url)

    const handleOpenModal = (param: any) => {
        setStates({
            [param.name]: param.value,
            typeModal: param.typeModal,
            dataModal: param.dataModal ? param.dataModal : {}
        });
    }

    const handleOpenView = (param: any) => {
        setStates({
            [param.name]: param.value,
            typeView: param.typeView,
            dataView: param.dataView ? param.dataView : {}
        });
    }

    const handleOpenAdd = (param: any) => {
        setStates({
            [param.name]: param.value,
            typeAdd: param.typeAdd,
            dataAdd: param.dataAdd ? param.dataAdd : {}
        });
    }

    const handleOpenFilter = async (param: any) => {
        if (param.name === "openFilter" && param.id) {
            setStates({
                [param.name]: param.value,
            });
        } else {
            setStates({
                [param.name]: param.value,
            });
        }
    }

    const approveTimeOff = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/approval/timeoff/approve?&submit=${data}&page=${states.data.currentPage}&row=${states.data.dataPerPage}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}&status=${states.filter.status}`)
    }

    const submitReject = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/approval/timeoff/reject?&submit=${data}&page=${states.data.currentPage}&row=${states.data.dataPerPage}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}&status=${states.filter.status}`)
    }

    const deleteRequest = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/approval/timeoff/delete?&submit=${data}&page=${states.data.currentPage}&row=${states.data.dataPerPage}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}&status=${states.filter.status}`)
    }

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

    useEffect(() => {
        const { type, message, description } = statesContex.submitNotif
        Notifications(type, message, description)
        setSubmitNotif({ type: "", message: "", description: "" })
        if (router.query) {
            router.push({
                pathname: '/approval/timeoff',
                query: {}
            }, undefined, { shallow: true })
        }
    }, [])

    useEffect(() => {
        var columns: any = [
            {
                title: "No",
                dataIndex: "no",
                key: "no",
                style: { textAlign: "center" },
            },
            {
                title: "Fullname",
                dataIndex: "fullname",
                key: "fullname",
            },
            {
                title: "Request Type",
                dataIndex: "type",
                key: "type",
            },
            {
                title: "Created At",
                dataIndex: "created_at",
                key: "created_at",
                render: (text: string, record: any) => (moment(text).format('DD-MM-YYYY'))
            },
            {
                title: "Request Date",
                dataIndex: "start_date",
                key: "start_date",
                sorter: true,
                render: (text: string, record: any) => (record.requestTypeId == 3 ? moment(text).format('DD-MM-YYYY HH:mm') : record.start_date && record.end_date ? moment(record.start_date).format('DD-MM-YYYY') + " s/d " + moment(record.end_date).format('DD-MM-YYYY') : "-")
            },
            {
                title: "Days Requested",
                key: "drqst",
                render: (text: string, record: any) => {
                    let start = moment(record.start_date)
                    let end = moment(record.end_date)
                    if (record.end_date === null) {
                        return 1
                    } else {
                        return calcWrkD(start, end, states.master.holidays)
                    }
                }
            },
            {
                title: "Remaining Leave",
                dataIndex: "saldo_cuti",
                key: "saldo_cuti",
                sorter: true
            },
            {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (text: any, record: any) => (
                    <>
                        <Tag color={record.status == "NOT YET APPROVED" ? 'orange' : record.status == 'APPROVED' ? 'green' : 'red'} key={record.status}>
                            {record.status}
                        </Tag>
                    </>
                )
            },
        ]

        if (states.access.m_view == 1) {
            columns.push({
                title: "Action",
                dataIndex: "action",
                key: "action",
                render: (text: any, record: any) => (
                    <>
                        <Space size="middle">
                            <a className={"link"}
                                onClick={() =>
                                    handleOpenView({
                                        name: "openView",
                                        value: true,
                                        typeView: "View",
                                        dataView: record
                                    })
                                }
                            >
                                View Detail
                            </a>
                            {states.access.m_update == 1 && record.is_approved == null ?
                                <>
                                    <a className={"link"}
                                        onClick={() => showApprove({ onOk: (() => approveTimeOff(record)) })}
                                    >
                                        Approve
                                    </a>
                                    <a className={"link"}
                                        onClick={() =>
                                            handleOpenModal({
                                                name: "openModal",
                                                value: true,
                                                typeModal: "Update",
                                                dataModal: record
                                            })
                                        }
                                    >
                                        Reject
                                    </a>
                                </>
                                : null}
                            {states.access.m_delete == 1 ?
                                <a className={"link"}
                                    onClick={() => showDeleteConfirm({ onOk: (() => deleteRequest(record)) })}
                                >
                                    Delete
                                </a>
                                : null}
                        </Space>
                    </>
                )
            })
        }

        setStates({
            columns: columns
        })
    }, [states.access])

    useEffect(() => {
        if (data) {
            setStates({
                isLoading: false,
                data: {
                    ...states.data,
                    dataPerPage: data.dataPerPage,
                    currentPage: data.currentPage,
                    totalData: data.totalData,
                    totalPage: data.totalPage,
                    list: data.data,
                    key: states.data.key ? states.data.key : ""
                }
            })
        }
    }, [data])

    const resetFilter = () => {
        setStates({
            openFilter: false,
            data: {
                ...states.data,
                dataPerPage: 10,
                currentPage: 1,
            },
            filter: {
                ...states.filter,
                startDate: '',
                endDate: '',
                status: '',
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
                status: data.status
            },
            data: {
                ...states.data,
                currentPage: 0
            },
            openFilter: false
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

    const submit = async (types: any) => {
        const param = {
            employeeId: types?.emp,
            start: types?.start,
            end: types?.end,
            offType: types?.TOType,
            desc: types?.desc
        }
        const data = Buffer.from(JSON.stringify(param)).toString("base64");
        router.push(`/approval/timeoff/off?&submit=${data}`);
    };

    const dataSource = states?.data.list
    dataSource.forEach((i: any, index: number) => {
        i.key = index;
        i.no =
            states.data.currentPage === 1
                ? Number(index + 1)
                : states.data.currentPage === 2
                    ? Number(states.data.dataPerPage) + (index + 1)
                    : (Number(states.data.currentPage) - 1) * Number(states.data.dataPerPage) + (index + 1);
    }
    );

    const expTimeoff = async () => {
        let param = states.filter
        await exportTimeoffs(param)
    }

    const exportTimeoffs = async (data: any) => {
        let res = await window.open(`/api/approval/timeoff/export?&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}&status=${states.filter.status}`)
    }

    if (error) {
        return <p>Failed to load</p>
    }

    if (!data && !states.data) {
        setStates({ isLoading: true })
    }

    return (
        <>
            <SWRConfig value={{ fallback }}>
                <PageHeader
                    title="Request Time Off Management"
                    extra={[
                        <Row key="100">
                            {states.access.m_insert == 1 ?
                                <Col style={{ marginRight: '1em' }} key="110">
                                    <Button
                                        onClick={() =>
                                            handleOpenAdd({
                                                name: "openAdd",
                                                value: true,
                                                typeAdd: "Add",
                                                inputDisabled: false,
                                            })
                                        }
                                        className={'button'}
                                        shape="round"
                                    >
                                        ADD REQUEST
                                    </Button>
                                </Col>
                                : null}
                            <Col style={{ marginRight: '1em' }} key="130">
                                <Button
                                    key="1"
                                    onClick={() =>
                                        handleOpenFilter({
                                            name: "openFilter",
                                            value: true,
                                        })
                                    }
                                    className={'button'}
                                    shape="round"
                                >
                                    Filter
                                </Button>
                            </Col>
                            {states.access.m_export == 1 ?
                                <Col key="120">
                                    <Button
                                        key="btn-exp"
                                        onClick={expTimeoff}
                                        className={'button'}
                                        shape="round"
                                    >
                                        Export
                                    </Button>
                                </Col>
                                : null}
                        </Row>
                    ]}
                />
                <Card
                    className="custom-card"
                    title={`Periode ` + (states.filter.startDate ? moment(states.filter.startDate).format("MMMM YYYY") : moment().format("MMMM YYYY"))}
                    extra={
                        <SearchBar
                            handleFilter={handleSearch}
                            filter={states.filter}
                        />
                    }
                >
                    <Table
                        style={{ overflowX: 'scroll' }}
                        loading={states.isLoading}
                        dataSource={dataSource}
                        columns={states.columns}
                        size="middle"
                        pagination={{
                            current: states.data.currentPage as number,
                            total: states.data.totalData as number,
                            pageSize: states.data.dataPerPage as number
                        }}
                        onChange={handleTableChange}
                    />
                </Card>
                <Modals
                    open={states.openModal}
                    header="Reject Request Time Off"
                    handleOpenModal={handleOpenModal}
                    submit={submitReject}
                    data={states.dataModal}
                    master={states.master}
                    inputDisabled={states.typeModal == "Add" ? false : true}
                />
                <ModalView
                    open={states.openView}
                    header="View Data"
                    handleOpenView={handleOpenView}
                    data={states.dataView}
                />
                <ModalAdd
                    open={states.openAdd}
                    handleOpenAdd={handleOpenAdd}
                    master={props?.master}
                    header="Request Time-Off"
                    handleAdd={submit}
                    holidays={states.master.holidays}
                />
                <ModalFilter
                    header={"Filter Time Off"}
                    open={states.openFilter}
                    data={states.filter}
                    handleOpenModal={handleOpenFilter}
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

    const trueRole = await pageCheck(session.username, "/approval/timeoff")

    if (trueRole.length < 1) {
        return {
            redirect: {
                destination: "/403",
                permanent: false
            }
        }
    }

    interface IPagination {
        row: string | number
        page: string | number
        key: string
        direction: string
        column: string
        startDate: string
        endDate: string
        status: string
        limit: number | string
    }

    const { page, row, key, column, direction, startDate, endDate, status } = ctx.query as any

    const params: IPagination = {
        row: row ?? 10,
        page: page ?? 0,
        key: key ?? "",
        direction: direction ?? "",
        column: column ?? "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
        status: status ?? "",
        limit: ""
    }

    const shiftMaster = await masterShift();
    const compMaster = await masterCompany();
    const empMaster = await masterEmployee();
    const timeoffMaster = await masterTimeoff();

    const holidays = await getDataHol();

    const arrHol = holidays.data.map((i: any, idx: number) =>
        moment(i.date).format('YYYY-MM-DD')
    )

    const getList = await getData(params, session);

    const data = {
        dataPerPage: getList.dataPerPage,
        currentPage: getList.currentPage,
        totalData: getList.totalData,
        totalPage: getList.totalPage,
        list: getList.data,
        key: ""
    }

    return {
        props: {
            fallback: {
                '/api/approval/timeoff/list': JSON.parse(JSON.stringify(data))
            },
            master: {
                shift: JSON.parse(JSON.stringify(shiftMaster)),
                comp: JSON.parse(JSON.stringify(compMaster)),
                emp: JSON.parse(JSON.stringify(empMaster)),
                timeoff: JSON.parse(JSON.stringify(timeoffMaster)),
                holidays: JSON.parse(JSON.stringify(arrHol))
            },
            data: JSON.parse(JSON.stringify(data)),
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
            openView: false,
            typeView: "",
            dataView: {},
            openAdd: false,
            typeAdd: "",
            dataAdd: {},
            openFilter: false,
            filter: {
                key: key ?? "",
                directions: direction ?? "",
                columns: column ?? "",
                status: status ?? "",
                startDate: startDate ?? '',
                endDate: endDate ?? ''
            }
        }
    }
}

export default Employee;

Employee.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}