import React, { useEffect, useReducer } from "react";
import type { ReactElement } from 'react'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import useSWR, { SWRConfig } from "swr";
import dynamic from "next/dynamic";
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router';
import moment from "moment";
import { PageHeader, Card, Table, Button, Space, Input } from "antd";
import DashboardLayout from "../../../components/layouts/Dashboard";
import { pageCheck } from "../../../lib/helper";
import { getData } from "../../api/user/list";
import { masterRole, masterApps } from "../../api/master/index";
import { useApp } from "../../../context/AppContext";
import { IState } from "../../../interfaces/user.interface";
import Notifications from "../../../components/Notifications";
import { showDeleteConfirm } from "../../../components/modals/ModalAlert";
import SearchBar from "../../../components/SearchBar";

const Modals = dynamic(() => import('./_modal'), { loading: () => <p></p> })

const Users = (props: any, { fallback }: any) => {
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const router = useRouter();
    const { statesContex, setSubmitNotif } = useApp();

    const url = `/api/user/list?page=${states.data.currentPage}&row=${states.data.dataPerPage}&column=${states.filter.columns}&direction=${states.filter.directions}&key=${states.filter.key}`
    const { data, error } = useSWR(url)

    const deleteUser = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/settings/users/delete?&submit=${data}`)
    }

    const handleOpenModal = (param: any) => {
        setStates({
            [param.name]: param.value,
            typeModal: param.typeModal,
            dataModal: param.dataModal ? param.dataModal : {}
        });
    }

    const handleSearch = (data: any) => {
        setStates({
            filter: {
                ...states.filter,
                key: data.key
            },
        })
    };

    const submitUpdate = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/settings/users/update?&submit=${data}`)
    }

    const submit = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/settings/users/add?&submit=${data}`)
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
                title: "id",
                dataIndex: "usersId",
                key: "usersId",
                hidden: true,
            },
            {
                title: "accessAppsId",
                dataIndex: "accessAppsId",
                key: "accessAppsId",
                hidden: true,
            },
            {
                title: "Username",
                dataIndex: "username",
                key: "username",
                sorter: true,
            },
            {
                title: "Name",
                dataIndex: "name",
                key: "name",
                sorter: true,
            },
            {
                title: "Application",
                dataIndex: "appsId",
                key: "appsId",
                render: (appsId: string) => (appsId == "1" ? "ESS" : appsId == "2" ? "E-Document" : "")
            },
            {
                title: "Role",
                dataIndex: "role",
                key: "role",
                sorter: true,
            },
            {
                title: "Registered At",
                dataIndex: "created_at",
                key: "created_at",
                sorter: true,
                render: (rcvd_time: string) => `${moment(rcvd_time).format('DD-MM-YYYY HH:mm:ss')}`
            },
        ].filter(item => !item.hidden)

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
                                    onClick={() => showDeleteConfirm({ onOk: (() => deleteUser(record)) })}
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

    const dataSource = states?.data.list
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
                    title="User Management"
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
                            Add User
                        </Button> : null
                    ]}
                />
                <Card
                    className="custom-card"
                    title="List User" 
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
                    header={states.typeModal == "Add" ? "Add User" : "Update User"}
                    handleOpenModal={handleOpenModal}
                    submit={states.typeModal == "Add" ? submit : submitUpdate}
                    data={states.dataModal}
                    master={states.master}
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

    const getList = await getData(params, session);
    const appsMaster = await masterApps(session);
    const roleMaster = await masterRole();

    const data = {
        list: getList.data,
        key: ""
    }

    return {
        props: {
            fallback: {
                '/api/user/list': JSON.parse(JSON.stringify(data))
            },
            data: JSON.parse(JSON.stringify(data)),
            master: {
                apps: JSON.parse(JSON.stringify(appsMaster)),
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
            }
        }
    }
}

export default Users;

Users.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}