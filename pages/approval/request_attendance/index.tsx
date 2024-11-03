import React, { useEffect, useReducer } from "react";
import type { ReactElement } from 'react'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import useSWR, { SWRConfig } from "swr";
import dynamic from "next/dynamic";
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router';
import { PageHeader, Card, Table, Space, Tag } from "antd";
import DashboardLayout from "../../../components/layouts/Dashboard";
import { pageCheck } from "../../../lib/helper";
import { getData } from "../../api/approval/request_attendance/list";
import { masterShift } from "../../api/master/index";
import { useApp } from "../../../context/AppContext";
import { IState } from "../../../interfaces/approval_attendance.interface";
import Notifications from "../../../components/Notifications";
import SearchBar from "../../../components/SearchBar";
import moment from "moment";
import { showApprove } from "../../../components/modals/ModalAlert";

const Modals = dynamic(() => import('./_modal'), { loading: () => <p></p> })
const ModalView = dynamic(() => import('./_view'), { loading: () => <p></p> })

const Employee = (props: any, { fallback }: any) => {
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const router = useRouter();
    const { statesContex, setSubmitNotif } = useApp();

    const url = `/api/approval/request_attendance/list?page=${states.data.currentPage}&row=${states.data.dataPerPage}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}`
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

    const approveAttendance = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/approval/request_attendance/approve?&submit=${data}&page=${states.data.currentPage}&row=${states.data.dataPerPage}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}`)
    }

    const submitReject = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/approval/request_attendance/reject?&submit=${data}&page=${states.data.currentPage}&row=${states.data.dataPerPage}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}`)
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
        setSubmitNotif({type: "", message: "", description: ""})
        if (router.query) {
            router.push({
                pathname: '/approval/request_attendance',
                query: {}
            }, undefined, { shallow: true})
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
                title: "Start Date",
                dataIndex: "start_date",
                key: "start_date",
                sorter: true,
                render: (text: string, record: any) => ( record.start_date ? moment(text).format('DD-MM-YYYY') : "-" )
            },
            {
                title: "End Date",
                dataIndex: "end_date",
                key: "end_date",
                sorter: true,
                render: (text: string, record: any) => ( record.end_date ? moment(text).format('DD-MM-YYYY') : "-" )
            },
            {
                title: "Start Time",
                dataIndex: "start_time",
                key: "start_time",
                sorter: true,
                render: (text: string, record: any) => ( record.start_time ? moment(text, "HH:mm:ss").format("HH:mm") : "-" )
            },
            {
                title: "End Time",
                dataIndex: "end_time",
                key: "end_time",
                sorter: true,
                render: (text: string, record: any) => ( record.end_time ? moment(text, "HH:mm:ss").format("HH:mm") : "-" )
            },
            {
                title: "Status",
                dataIndex: "status",
                key: "status", 
                render: (text: any, record: any) => (
                    <>
                        <Tag color={ record.status == "NOT YET APPROVED" ? 'orange' : record.status == 'APPROVED' ? 'green' : 'red' } key={record.status}>
                            { record.status }
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
                                        onClick={() => showApprove({ onOk: (() => approveAttendance(record)) })}
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

    const handleSearch = (data: any) => {
        setStates({
            filter: data
        })
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
                    title="Request Attendance Management"
                />
                <Card
                    className="custom-card"
                    title="List Requests"
                    extra={
                        <SearchBar 
                            handleFilter={handleSearch}
                            filter={states.filter} 
                        />
                    }
                >
                    <Table
                        style={{overflowX: 'scroll'}}
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
                    header="Reject Request Attendance"
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

    const trueRole = await pageCheck(session.username, "/approval/request_attendance")

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
        limit: number | string
    }

    const { page, row, key, column, direction } = ctx.query as any

    const params: IPagination = {
        row: row ?? 10,
        page: page ?? 0,
        key: key ?? "",
        direction: direction ?? "",
        column: column ?? "",
        limit: ""
    }

    const shiftMaster = await masterShift();
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
                '/api/approval/request_attendance/list': JSON.parse(JSON.stringify(data))
            },
            master: {
                shift: JSON.parse(JSON.stringify(shiftMaster))
            },
            data: JSON.parse(JSON.stringify(data)),
            columns: [],
            access: {
                m_insert: trueRole[0].m_insert,
                m_update: trueRole[0].m_update,
                m_delete: trueRole[0].m_delete,
                m_view: trueRole[0].m_view
            },
            isLoading: false,
            openModal: false,
            typeModal: "",
            dataModal: {},
            openView: false,
            typeView: "",
            dataView: {},
            filter: {
                key: key ?? "",
                directions: direction ?? "",
                columns: column ?? "",
                status: "",
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