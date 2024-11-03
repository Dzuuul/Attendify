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

import { pageCheck, formatNumber } from "../../../lib/helper";
import { sortMenus } from "../../api/menu/list";
import { useApp } from "../../../context/AppContext";
import { IState } from "../../../interfaces/menu.interface";
import Notifications from "../../../components/Notifications";
import { showDeleteConfirm } from "../../../components/modals/ModalAlert";
const Modals = dynamic(() => import('./_modal'), { loading: () => <p></p> })
const { Search } = Input

const MenuPage = (props: any, { fallback }: any) => {
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const router = useRouter();
    const { statesContex, setSubmitNotif } = useApp();

    const url = `/api/menu/list?type=2`
    const { data, error } = useSWR(url)

    const deleteMenu = async (param: any) => {
        const data = Buffer.from(JSON.stringify({...param, description: param.menu})).toString('base64');
        router.push(`/settings/menu/delete?&submit=${data}`)
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
        router.push(`/settings/menu/update?&submit=${data}`)
    }

    const submit = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/settings/menu/add?&submit=${data}`)
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

    // const handleChange = (e) => {
    //     setStates({
    //         data: {
    //             ...states.data,
    //             [e.target.name]: e.target.value
    //         },
    //         isLoading: true
    //     });
    // };

    useEffect(() => {
        const { type, message, description } = statesContex.submitNotif
        Notifications(type, message, description)
        setSubmitNotif({type: "", message: "", description: ""})
    }, [])

    useEffect(() => {
        var columns: any = [
            {
                title: 'Menu',
                dataIndex: 'menu',
                key: 'menu',
            },
            {
                title: 'Path',
                dataIndex: 'path',
                key: 'path',
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (text: any, record: any) => (
                    <>
                        {record.status == 1 ? <Tag color='green' key={record.status}>
                            ACTIVE
                        </Tag> : null}
                        {record.status == 0 ? <Tag color='red' key={record.status}>
                            INACTIVE
                        </Tag> : null}
                    </>
                )
            },
            {
                title: 'Sort',
                dataIndex: 'sort',
                key: 'sort'
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
                                {states.access.m_insert == 1 ? <a className={"link"}
                                        style={record.level != 1 ? { display: "none"} : {} }
                                        onClick={() =>
                                            handleOpenModal({
                                                name: "openModal",
                                                value: true,
                                                typeModal: "Add",
                                                dataModal: {
                                                    menu_header: record.menu_header,
                                                    level: Number(record.level) + 1
                                                }
                                            })
                                        }
                                    >
                                        Add Child
                                    </a> : null} 
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
                                        onClick={() => showDeleteConfirm({ onOk: (() => deleteMenu(record)) })}
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
                data: data.access
            })
        }
    }, [data])

    const dataSource = states?.data
    // const page = Number(states.data.currentPage)
    // const rowsPerPage = states.data.dataPerPage.toString()

    dataSource.forEach((i: any, index: number) => {
        i.key = index;
        // i.no =
        //     page === 1
        //         ? formatNumber(index + 1)
        //         : page === 2
        //             ? formatNumber(parseInt(rowsPerPage) + (index + 1))
        //             : formatNumber((page - 1) * parseInt(rowsPerPage) + (index + 1));
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
                    title="Menu Management"
                    extra={[
                        states.access.m_insert == 1 ?
                        <Button key="1"
                            onClick={() =>
                                handleOpenModal({
                                    name: "openModal",
                                    value: true,
                                    typeModal: "Add",
                                })
                            }
                            className={'button'}
                            shape="round"
                        >
                            Add Menu
                        </Button> : null
                    ]}
                />
                <Card
                    className="custom-card"
                    title="List Menu" 
                    extra={<Search 
                        name="key"
                        placeholder="input search text"
                        // value={states.data.key}
                        // onSearch={onSearch}
                        // onChange={handleChange}
                        />
                    }
                >
                    <Table
                        style={{overflowX: 'scroll'}}
                        loading={states.isLoading}
                        dataSource={dataSource}
                        columns={states.columns}
                        size="middle"
                        pagination={false}
                        onChange={handleTableChange}
                    />
                </Card>
                <Modals
                    open={states.openModal}
                    header={states.typeModal == "Add" ? "Add Menu" : "Update Menu"}
                    handleOpenModal={handleOpenModal}
                    submit={states.typeModal == "Add" ? submit : submitUpdate}
                    data={states.dataModal}
                    userId={states.userId}
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

    const userId = session.id
    const trueRole = await pageCheck(session.username, ctx.resolvedUrl)

    if (trueRole.length < 1) {
        return {
            redirect: {
                destination: "/403",
                permanent: false
            }
        }
    }

    const getMenu: any = await sortMenus("");
    const data = getMenu.access

    return {
        props: {
            fallback: {
                '/api/menu/list?type=2': JSON.parse(JSON.stringify(data))
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
            },
            userId: userId,
        }
    }
}

export default MenuPage;

MenuPage.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}