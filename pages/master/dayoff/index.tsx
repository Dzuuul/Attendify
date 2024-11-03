import React, { useEffect, useReducer } from "react";
import type { ReactElement } from 'react'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import useSWR, { SWRConfig } from "swr";
import dynamic from "next/dynamic";
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router';
import { PageHeader, Card, Table, Button, Space, Input, Tag } from "antd";
import DashboardLayout from "../../../components/layouts/Dashboard";
import { pageCheck } from "../../../lib/helper";
import { getData } from "../../api/master/dayoff/list";
import { useApp } from "../../../context/AppContext";
import { IState } from "../../../interfaces/dayoff.interface";
import Notifications from "../../../components/Notifications";
import { showDeleteConfirm } from "../../../components/modals/ModalAlert";
import SearchBar from "../../../components/SearchBar";
import moment from "moment";

const Modals = dynamic(() => import('./_modal'), { loading: () => <p></p> })

const Dayoff = (props: any, { fallback }: any) => {
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const router = useRouter();
    const { statesContex, setSubmitNotif } = useApp();

    const url = `/api/master/dayoff/list?page=${states.data.currentPage}&row=${states.data.dataPerPage}&key=${states.filter.key}&column=${states.filter.columns}&direction=${states.filter.directions}`
    const { data, error } = useSWR(url)

    const deleteDayoff = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/master/dayoff/delete?&submit=${data}`)
    }

    const handleOpenModal = (param: any) => {
        setStates({
            [param.name]: param.value,
            typeModal: param.typeModal,
            dataModal: param.dataModal ? param.dataModal : {}
        });
    }

    const submitUpdate = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/master/dayoff/update?&submit=${data}`)
    }

    const submit = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/master/dayoff/add?&submit=${data}`)
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
    }, [])

    useEffect(() => {
        var columns: any = [
            {
                title: "No",
                dataIndex: "number",
                key: "number",
                style: { textAlign: "center" },
            },
            {
                title: "Description",
                dataIndex: "description",
                key: "description",
            },
            {
                title: "Date",
                dataIndex: "date",
                key: "date",
                sorter: true,
                render: (text: string) => (moment(text).format("DD-MM-YYYY"))
                //render: (text: string) => (moment(text).format("YYYY-MM-DD"))
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
                            {states.access.m_update == 1 ?
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
                                    Edit
                                </a>
                                : null}
                            {states.access.m_delete == 1 ?
                                <a className={"link"}
                                    onClick={() => showDeleteConfirm({ onOk: (() => deleteDayoff(record)) })}
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

    const handleSearch = (data: any) => {
        setStates({
            filter: data
        })
    };

    const dataSource = states?.data.list
        dataSource.forEach((i: any, index: number) => {
            i.key = index;
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
                    title="National Holiday Data Management"
                    extra={[
                        states.access.m_insert == 1 ?
                        <Button key="1"
                            onClick={() =>
                                handleOpenModal({
                                    name: "openModal",
                                    value: true,
                                    typeModal: "Add",
                                    inputDisabled: false,
                                })
                            }
                            className={'button'}
                            shape="round"
                        >
                            Add Data
                        </Button> : null
                    ]}
                />
                <Card
                    className="custom-card"
                    title="List Datas" 
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
                    header={states.typeModal == "Add" ? "Add Data" : "Edit Data"}
                    handleOpenModal={handleOpenModal}
                    submit={states.typeModal == "Add" ? submit : submitUpdate}
                    data={states.dataModal}
                    inputDisabled={states.typeModal == "Add" ? false : true}
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
    const data = {
        list: getList.data,
        key: ""
    }

    return {
        props: {
            fallback: {
                '/api/master/dayoff/list': JSON.parse(JSON.stringify(data))
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
                columns: ""
            }
        }
    }
}

export default Dayoff;

Dayoff.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}