import React, { useEffect, useReducer } from "react";
import type { ReactElement } from 'react'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import useSWR, { useSWRConfig, SWRConfig } from "swr";
import { GetServerSideProps } from 'next'
import Link from "next/link"
import { useRouter } from 'next/router';
import { PageHeader, Card, Table, Button, Space, Tag, Input } from "antd";
import DashboardLayout from "../../../components/layouts/Dashboard";
import Notifications from "../../../components/Notifications";
import { pageCheck } from "../../../lib/helper";
import { getData } from "../../api/transaction/shift/list";
import { masterRole } from "../../api/master/index";
import { IState } from "../../../interfaces/user.interface";
import { useApp } from "../../../context/AppContext";
const { Search } = Input

const ShiftTransaction = (props: any, { fallback }: any) => {
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const { mutate } = useSWRConfig();
    const { statesContex, setSubmitNotif } = useApp();
    const router = useRouter();

    const url = `/api/transaction/shift/list?page=${states.data.currentPage}&row=${states.data.dataPerPage}&column=${states.filter.columns}&direction=${states.filter.directions}`
    const { data, error } = useSWR(url)

    useEffect(() => {
        var columns: any = [
            {
                title: "No",
                dataIndex: "number",
                key: "number",
                width: 50
            },
            {
                title: "Description",
                dataIndex: "description",
                key: "description",
            },
            {
                title: "Clock In",
                dataIndex: "clock_in",
                key: "clock_in",
            },
            {
                title: "Clock Out",
                dataIndex: "clock_out",
                key: "clock_out",
            },
            {
                title: "Working Hour",
                dataIndex: "work_hour",
                key: "work_hour",
                render: (text: string) => ( text ? text + " Hours" : "-"),
            },
            {
                title: "Workday",
                dataIndex: "workday",
                key: "workday",
            },
            {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (record: any) => (
                    <>
                        {record == 1 ? <Tag color='green' key={record}>
                            ACTIVE
                        </Tag> : null}
                        {record == 0 ? <Tag color='red' key={record}>
                            INACTIVE
                        </Tag> : null}
                    </>
                )
            },
        ]

        if (states.access.m_insert == 1 || states.access.m_update == 1 || states.access.m_delete == 1) {
            columns.push({
                title: "Action",
                dataIndex: "action",
                key: "action",
                render: (text: any, record: any) => (
                    <>
                        <Space size="middle">
                            {states.access.m_update == 1 && record.status == 1 ?
                                <Link href={`/transaction/shift/update?id=${record.id}`} key={'linkEdit'}>
                                    <a className={"link"}
                                    >
                                        Edit
                                    </a>
                                </Link>
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

    useEffect(() => {
        const { type, message, description } = statesContex.submitNotif
        Notifications(type, message, description)
        setSubmitNotif({type: "", message: "", description: ""})
        if (router.query) {
            router.push({
                pathname: '/transaction/shift',
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
                    title="Shift Management"
                    extra={[
                        states.access.m_insert == 1 ?
                        <Link href={`/transaction/shift/add`} key={'link1'}>
                            <Button key="1"
                                className={'button'}
                                shape="round"
                            >
                                Add Shift
                            </Button>
                        </Link> : null
                    ]}
                // subTitle="This is a subtitle"
                />
                <Card
                    className="custom-card"
                    title="List Shift" 
                    extra={<Search 
                        name="key"
                        placeholder="input search text"
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
                    />
                </Card> 
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

    const userId = session.id;
    const trueRole = await pageCheck(session.username, ctx.resolvedUrl)

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

    const params: IPagination = {
        row: 10,
        page: 0,
        key: "",
        direction: "",
        column: "",
        limit: ""
    }

    const getList = await getData(params);
    const roleMaster = await masterRole();

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
                '/api/transaction/shift/list': JSON.parse(JSON.stringify(data))
            },
            data: JSON.parse(JSON.stringify(data)),
            master: {
                role: JSON.parse(JSON.stringify(roleMaster))
            },
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
                columns: ""
            },
            userId
        }
    }
}

export default ShiftTransaction;

ShiftTransaction.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}