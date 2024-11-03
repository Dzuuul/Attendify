import React, { useEffect, useReducer } from "react";
import type { ReactElement } from 'react'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import useSWR, { useSWRConfig, SWRConfig } from "swr";
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router';
import { PageHeader, Card, Table, Button, Col, Tag, Space } from "antd";
import DashboardLayout from "../../../components/layouts/Dashboard";
import Notifications from "../../../components/Notifications";
import { pageCheck } from "../../../lib/helper";
import { getData } from "../../api/attendance/request_timeoff/list";
import { IState, IPagination } from "../../../interfaces/request_timeoff.interface";
import { useApp } from "../../../context/AppContext";
import SearchBar from "../../../components/SearchBar";
import dynamic from "next/dynamic";
import moment from "moment";

const ModalFilter = dynamic(() => import("./_filter"), { loading: () => <p>Loading...</p>, ssr: false });
const Modals = dynamic(() => import('./_modal'), { loading: () => <p></p> })

const RequestTimeOff = (props: any, { fallback }: any) => {
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const { mutate } = useSWRConfig();
    const { statesContex, setSubmitNotif } = useApp();
    const router = useRouter();

    const url = `/api/attendance/request_timeoff/list?page=${states.data.page}&row=${states.data.row}&column=${states.filter.columns}&direction=${states.filter.directions}&key=${states.filter.key}&employeeId=${states.userId}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}`
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

    const handleOpenView = (param: any) => {
        setStates({
            [param.name]: param.value,
            typeView: param.typeView,
            dataView: param.dataView ? param.dataView : {}
        });
    }

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

    const resetFilter = () => {
        setStates({
            openModal: false,
            data: {
                ...states.data,
                dataPerPage: 10,
                currentPage: 1,
            },
            filter: {
                ...states.filter,
                startDate: "",
                endDate: "",
                columns: "",
                directions: ""
            }
        })
    };
    
    const handleFilter = async (data: any) => {
        setStates({
            filter: {
                ...states.filter,
                startDate: data.startDate,
                endDate: data.endDate
            },
            data: {
                ...states.data,
                currentPage: 0
            },
            openModal: false
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
        if (data) {
            setStates({
                isLoading: false,
                data: {
                    ...states.data,
                    dataPerPage: data.dataPerPage,
                    currentPage: data.currentPage,
                    totalData: data.totalData,
                    totalPage: data.totalPage,
                    list: data,
                    key: states.data.key ? states.data.key : ""
                }
            })
        }
    }, [data])

    let columns: any = [
        {
            title: "No",
            dataIndex: "number",
            key: "number",
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
            render: (text: string, record: any) => ( record.requestTypeId == 3 ? moment(text).format('DD-MM-YYYY HH:mm') : record.start_date ? moment(text).format('DD-MM-YYYY') : "-" )
        },
        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",
            sorter: true,
            render: (text: string, record: any) => ( record.end_date ? moment(text).format('DD-MM-YYYY') : "-" )
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
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text: string) => (text || "-")
        },
        {
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
                    </Space>
                </>
            )
        }
    ]

    useEffect(() => {
        const { type, message, description } = statesContex.submitNotif
        Notifications(type, message, description)
        setSubmitNotif({type: "", message: "", description: ""})
        if (router.query) {
            router.push({
                pathname: '/attendance/request_timeoff',
                query: {}
            }, undefined, { shallow: true})
        }
    }, [])

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

    return (
        <>
            <SWRConfig value={{ fallback }}>
                <PageHeader
                    title="List Request Time Off"
                    extra={[
                        <Col key="1">
                            <Button
                                onClick={() =>
                                    handleOpenModal({
                                        name: "openModal",
                                        value: true,
                                    })
                                }
                                className={'button'}
                                shape="round"
                            >
                                Filter
                            </Button>
                        </Col>
                    ]}
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
                        columns={columns}
                        size="middle"
                        pagination={{
                            current: states.data.currentPage as number,
                            total: states.data.totalData as number,
                            pageSize: states.data.dataPerPage as number
                        }}
                         onChange={handleTableChange}
                    />
                </Card>
                <ModalFilter
                    header={"Filter Request Timeoff"}
                    open={states.openModal}
                    dataModal= {states.filter}
                    handleOpenModal={handleOpenModal}
                    handleFilter={handleFilter}
                    resetFilter={resetFilter}
                />
                <Modals
                    open={states.openView}
                    header="View Data"
                    handleOpenView={handleOpenView}
                    dataView={states.dataView}
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
    const trueRole = await pageCheck(session.username, ctx.resolvedUrl)

    if (trueRole.length < 1) {
        return {
            redirect: {
                destination: "/403",
                permanent: false
            }
        }
    }

    const params: IPagination = {
        row: 10,
        page: 0,
        key: "",
        direction: "",
        column: "",
        startDate: "",
        endDate: "",
        employeeId: userId,
    }

    const getList = await getData(params);
    
    const data = {
        list: getList,
        row: 10,
        page: 0,
        key: ""
    }
    
    return {
        props: {
            fallback: {
                '/api/attendance/request_timeoff/list': JSON.parse(JSON.stringify(data))
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
                key: "",
                directions: "",
                columns: "",
                startDate: "",
                endDate: "",
            },
            userId
        }
    }
}

export default RequestTimeOff;

RequestTimeOff.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}