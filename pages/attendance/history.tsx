import React, { useEffect, useReducer } from "react";
import type { ReactElement } from 'react'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import useSWR, { useSWRConfig, SWRConfig } from "swr";
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router';
import { PageHeader, Card, Table, Button, Col, Tag, Row, Statistic } from "antd";
import DashboardLayout from "../../components/layouts/Dashboard";
import Notifications from "../../components/Notifications";
import { pageCheck } from "../../lib/helper";
import { getData } from "../api/attendance/listHistory";
import { IState, IPagination } from "../../interfaces/attendance.interface";
import { useApp } from "../../context/AppContext";
import SearchBar from "../../components/SearchBar";
import dynamic from "next/dynamic";
import Link from "next/link"

const ModalFilter = dynamic(() => import("./_filter"), { loading: () => <p>Loading...</p>, ssr: false });

const History = (props: any, { fallback }: any) => {
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const { mutate } = useSWRConfig();
    const { statesContex, setSubmitNotif } = useApp();
    const router = useRouter();

    const url = `/api/attendance/listHistory?page=${states.data.page}&row=${states.data.row}&column=${states.filter.columns}&direction=${states.filter.directions}&key=${states.filter.key}&employeeId=${states.userId}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}`
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
        var columns: any = [
            {
                title: "Date",
                dataIndex: "date",
                key: "date",
                width: 50,
                render: (text: string) => (text || "Undefined")
            },
            {
                title: "Clock In",
                dataIndex: "check_in",
                key: "check_in",
                width: 50,
                render: (text: string) => (text || "-")
            },
            {
                title: "Clock Out",
                dataIndex: "check_out",
                key: "check_out",
                width: 50,
                render: (text: string) => (text || "-")
            },
            {
                title: "Status",
                dataIndex: "status",
                key: "status",
                width: 50,
                render: (text: any, record: any) => (
                    <>
                        { record.dept != 8 ? 
                            record.status == 0 ? 
                            <Tag color='green' key={record.status}>
                                { record.type + ' - ONTIME' }
                            </Tag> 
                        : record.status == 1 && record.check_type != 3 ? 
                            <Tag color='red' key={record.status}>
                                { record.type + ' - LATE' }
                            </Tag> 
                        : record.type
                        : record.type
                        }
                    </>
                )
            },
            {
                title: "Description",
                dataIndex: "desc_in",
                key: "desc_in",
                width: 50,
                render: (text: string) => (text || "-")
            },
            {
                title: "Clock In Location",
                dataIndex: "lat_in",
                key: "lat_in",
                width: 50,
                render: (text: any, record: any) => (
                    <>
                        { record.lat_in && record.long_in ? 
                            <Link href={`https://www.google.com/maps/search/?api=1&query=${record.lat_in},${record.long_in}`} key={'linkLocation'}>
                                <a className={"link"}>
                                    Show location
                                </a>
                            </Link>
                            : '-'
                        }
                    </>
                )
            }
        ]

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
                    list: data,
                    key: states.data.key ? states.data.key : ""
                }
            })
        }
    }, [data])

    useEffect(() => {
        const { type, message, description } = statesContex.submitNotif
        Notifications(type, message, description)
        setSubmitNotif({type: "", message: "", description: ""})
        if (router.query) {
            router.push({
                pathname: '/attendance/history',
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
                    title="Log Attendance"
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
                <Row 
                    className="summary-row"
                    style={{ 
                        marginLeft: "12px", 
                        marginBottom: "20px", 
                        textAlign: "center"
                    }}
                >
                    <Col span={3}>
                        <Statistic title="Total Attendance" value={dataSource.length} />
                    </Col>
                </Row>
                <Card
                    className="custom-card"
                    title="List Attendance" 
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
                <ModalFilter
                    header={"Filter Date Attendance"}
                    open={states.openModal}
                    dataModal= {states.filter}
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
                '/api/attendance/listHistory': JSON.parse(JSON.stringify(data))
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

export default History;

History.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}