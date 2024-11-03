import React, { useEffect, useReducer } from "react";
import type { ReactElement } from 'react'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import useSWR, { useSWRConfig, SWRConfig } from "swr";
import { GetServerSideProps } from 'next'
import Link from "next/link"
import { useRouter } from 'next/router';
import { PageHeader, Card, Table, Button, Space, Row, Col, Tag } from "antd";
import DashboardLayout from "../../../components/layouts/Dashboard";
import Notifications from "../../../components/Notifications";
import { pageCheck } from "../../../lib/helper";
import { getData } from "../../api/master/employees/list";
import { masterDepartment, masterCompany } from "../../api/master/index";
import { IState, IPagination } from "../../../interfaces/employees.interface";
import { showDeleteConfirm } from "../../../components/modals/ModalAlert";
import { useApp } from "../../../context/AppContext";
import SearchBar from "../../../components/SearchBar";
import dynamic from "next/dynamic";

const ModalFilter = dynamic(() => import("./_filter"), { loading: () => <p>Loading...</p>, ssr: false });

const Employee = (props: any, { fallback }: any) => {
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const { mutate } = useSWRConfig();
    const { statesContex, setSubmitNotif } = useApp();
    const router = useRouter();

    const url = `/api/master/employees/list?page=${states.data.currentPage}&row=${states.data.dataPerPage}&column=${states.filter.columns}&direction=${states.filter.directions}&key=${states.filter.key}&department=${states.filter.department}&company=${states.filter.company}&status=${states.filter.status}`
    const { data, error } = useSWR(url)

    
    const deleteEmployee = async (param: any) => {
        const { userId } = states;
        const data = Buffer.from(JSON.stringify({...param, userId})).toString('base64');
        router.push(`/master/employees/delete?&submit=${data}`)
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
                department: "",
                company: "",
                status: "",
                columns: "",
                directions: ""
            }
        })
    };
    
    const handleFilter = async (data: any) => {
        setStates({
            filter: {
                ...states.filter,
                department: data.department,
                company: data.company,
                status: data.status,
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
            filter: data
        })
    };

    useEffect(() => {
        var columns: any = [
             {
                title: "No",
                dataIndex: "number",
                key: "number",
                style: { textAlign: "center" },
             },
            {
                title: "Name",
                dataIndex: "fullname",
                key: "fullname",
                sorter: true,
            },
            {
                title: "ID Employee",
                dataIndex: "id_employee",
                key: "id_employee",
                sorter: true,
            },
            {
                title: "Company",
                dataIndex: "company",
                key: "company",
                sorter: true,
            },
            {
                title: "Department",
                dataIndex: "department",
                key: "department",
                sorter: true,
            },
            {
                title: "Division",
                dataIndex: "division",
                key: "division",
                sorter: true,
            },
            {
                title: "Shift",
                dataIndex: "shift",
                key: "shift",
                sorter: true,
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
                            {states.access.m_update == 1 ?
                                <Link href={`/master/employees/modify?id=${record.id}`} key={'linkEdit'}>
                                    <a className={"link"}
                                    >
                                        Edit
                                    </a>
                                </Link>
                                : null}
                            {states.access.m_delete == 1 ?
                                <a className={"link"}
                                    onClick={() => showDeleteConfirm({ onOk: (() => deleteEmployee(record)) })}
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

    useEffect(() => {
        const { type, message, description } = statesContex.submitNotif
        Notifications(type, message, description)
        setSubmitNotif({type: "", message: "", description: ""})
        if (router.query) {
            router.push({
                pathname: '/master/employees',
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
                    title="Employees Management"
                    extra={[ 
                        states.access.m_insert == 1 ?
                            <Row key="1">
                                <Col style={{ marginRight: '1em' }}>
                                    <Link href={`/master/employees/add`} key={'link1'}>
                                        <Button key="1"
                                            className={'button'}
                                            shape="round"
                                        >
                                            Add Employee
                                        </Button>
                                    </Link>
                                </Col>
                                <Col>
                                    <Button
                                        key="1"
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
                            </Row>
                        : null
                    ]}
                />
                <Card
                    className="custom-card"
                    title="List Employees" 
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
                    header={"Filter Employee"}
                    open={states.openModal}
                    dataModal= {states.filter}
                    master={states.master}
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
        limit: "",
        department: "",
        company: "",
        status: "",
    }

    const getList = await getData(params, session);
    const deptMaster = await masterDepartment();
    const compMaster = await masterCompany();

    const data = {
        list: getList.data,
        key: ""
    }

    return {
        props: {
            fallback: {
                '/api/master/employees/list': JSON.parse(JSON.stringify(data))
            },
            data: JSON.parse(JSON.stringify(data)),
            master: {
                dept: JSON.parse(JSON.stringify(deptMaster)),
                company: JSON.parse(JSON.stringify(compMaster))
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
                columns: "",
                department: "",
                company: "",
                status: "",
            },
            userId: userId,
        }
    }
}

export default Employee;

Employee.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}