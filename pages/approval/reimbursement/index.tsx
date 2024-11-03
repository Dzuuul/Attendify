import React, { useReducer, useEffect} from 'react'
import type { ReactElement } from 'react'
import { useRouter } from "next/router";
import useSWR, { SWRConfig } from "swr";
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import DashboardLayout from "../../../components/layouts/Dashboard";
import dynamic from "next/dynamic";
import { IState } from "../../../interfaces/reimbursement.interface";
import { IPagination } from "../../../interfaces/approval_reimbursement.interface";
import { pageCheck } from "../../../lib/helper";
import { getData } from "../../api/approval/request_reimbursement/list";
import { masterReimbursementType, masterRole } from "../../api/master/index";
import { GetServerSideProps } from "next";
import { useApp } from "../../../context/AppContext";
import Notifications from "../../../components/Notifications";
import { showMoneyReady } from "../../../components/modals/ModalAlert";
import { Tag, Table, Card, PageHeader, Space, Button } from 'antd';
import moment from 'moment';
import SearchBar from "../../../components/SearchBar";

const ModalFilter = dynamic(() => import("./_filter"), { loading: () => <p>Loading...</p>, ssr: false });

const ModalImage = dynamic(() => import("./_images"), {
    loading: () => <p>Loading...</p>,
});

const ModalView = dynamic(() => import('./_view'), { loading: () => <p></p> })

const fileToBase64 = (data: any) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = (event) => {
        return resolve(event.target?.result)
      };
      reader.onerror = (err) => {
        reject(err)
      };
      reader.readAsDataURL(data);
    })
  }

const Reimbursement = (props: any, { fallback }: any) => {
    const router = useRouter();
    const { statesContex, setSubmitNotif } = useApp();
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    
    const { data: arrayData, error: errorData, isValidating: isLoadingData } = useSWR(`/api/approval/request_reimbursement/list?key=${states.filter.key}&page=${states.data.currentPage}&row=${states.data.dataPerPage}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}&column=${states.filter.columns}&direction=${states.filter.directions}&isApproved=${states.filter.isApproved}`)

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
                endDate: data.endDate,
                isApproved: data.isApproved
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

    const handleOpenModal = async (data: any) => {
        if(data.typeModal === "modalAdd" || data.typeModal === "modalClose") {
            setStates({
                [data.name]: data.value,
                typeModal: data.typeModal,
            })
        } else if(data.type === "openImage" && data.value === true) {
            const img = await getImages(data.id)
            setStates({
                images: img,
                [data.name]: data.value,
                typeModal: data.typeModal,
            })
        } else {
            setStates({
                [data.name]: data.value,
                typeModal: data.typeModal,
                editData: data.data
            })
        }
        
    }

    const handleOpenView = (param: any) => {
        setStates({
            [param.name]: param.value,
            typeView: param.typeView,
            dataView: param.dataView ? param.dataView : {}
        });
    }
    
    const rejectReimburse = async (param: any) => {
        // const data = Buffer.from(JSON.stringify(param)).toString('base64');
        // router.push(`/approval/timeoff/reject?&submit=${data}`)
    }

    const setReimburseReady = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/approval/reimbursement/ready?&submit=${data}&key=${states.filter.key}&page=${states.data.currentPage}&row=${states.data.dataPerPage}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}&column=${states.filter.columns}&direction=${states.filter.directions}&isApproved=${states.filter.isApproved}`)
    }

    const completeReimburse = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/approval/reimbursement/complete?&submit=${data}&key=${states.filter.key}&page=${states.data.currentPage}&row=${states.data.dataPerPage}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}&column=${states.filter.columns}&direction=${states.filter.directions}&isApproved=${states.filter.isApproved}`)
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
        if (arrayData) {
            setStates({
                isLoading: false,
                data: {
                    ...states.data,
                    dataPerPage: arrayData.dataPerPage,
                    currentPage: arrayData.currentPage,
                    totalData: arrayData.totalData,
                    totalPage: arrayData.totalPage,
                    list: arrayData.data,
                    key: states.data.key ? states.data.key : ""
                }
            })
        }
    }, [arrayData])
    
    useEffect(() => {
        const { type, message, description } = statesContex.submitNotif
        Notifications(type, message, description)
        setSubmitNotif({type: "", message: "", description: ""})
    }, [])
    
    const dataSource = states?.data.list;
    
    dataSource.forEach((i: any, index: number) => {
        i.key = index;
        i.no =
            states.data.currentPage === 1
                ? Number(index + 1)
                : states.data.currentPage === 2
                    ? Number(states.data.dataPerPage) + (index + 1)
                    : (Number(states.data.currentPage) - 1) * Number(states.data.dataPerPage) + (index + 1);
    });

    useEffect(() => {
        var columns: any = [
            {
                title: "No",
                dataIndex: "no",
                key: "no",
            },
            {
                title: 'Request Time',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (text: string) => ( text ? moment(text).format('DD-MM-YYYY HH:mm:ss') : "-" ),
                sorter: true,
            },
            {
                title: 'Employee Name',
                dataIndex: 'fullname',
                key: 'fullname',
                sorter: true,
            },
            {
                title: 'Employee ID',
                dataIndex: 'empId',
                key: 'empId',
            },
            {
                title: 'Subject',
                dataIndex: 'title',
                key: 'title',
                sorter: true,
            },
            {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                sorter: true,
            },
            {
                title: 'Receipt Date',
                dataIndex: 'receipt_date',
                key: 'receipt_date',
                render: (text: string) => ( text ? moment(text).format('DD-MM-YYYY') : "-" ),
                sorter: true,
            },
            {
                title: 'Amount',
                dataIndex: 'amount',
                key: 'amount',
                render: (text: any) => {
                    return "Rp. " + text.toLocaleString("en")
                },
                sorter: true,
            },
            {
                title: 'Picture',
                dataIndex: 'filename',
                key: 'filename',
                render: (e: any, record: any) => <a className={"link"}
                onClick={() =>
                    handleOpenModal({
                        name: 'openImage',
                        type: 'openImage',
                        value: true,
                        id: record.reimburseId
                    })
                }
            >
                Show Images
            </a>
            },     
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                sorter: true,
                render: (text: any, record: any) => (
                    <>
                        {record.status == null ? 
                            <Tag color='default' key={record.status}>
                                NEED APPROVAL
                            </Tag> 
                        : record.status == 0 ? 
                            <Tag color='red' key={record.status}>
                                REJECTED
                            </Tag> 
                        : record.status == 1 ? 
                            <Tag color='lime' key={record.status}>
                                APPROVED
                            </Tag> 
                        : record.status == 2 ? 
                            <Tag color='lime' key={record.status}>
                                REIMBURSEMENT READY 
                            </Tag> 
                        : record.status == 3 ? 
                            <Tag color='green' key={record.status}>
                                CONFIRMED BY EMPLOYEE
                            </Tag> 
                        : record.status == 4 ? 
                            <Tag color='cyan' key={record.status}>
                                COMPLETED
                            </Tag>
                        : record.status == 5 ? 
                        <Tag color='default' key={record.status}>
                            PROCESSED
                        </Tag>
                     
                        : null}
                    </>
                )
            },
        ]

        if (states.access.m_insert == 1 || states.access.m_update == 1 || states.access.m_delete == 1) {
            columns.push({
                title: "Action",
                dataIndex: "action",
                key: "action",
                render: (text: any, record: any) => {
                    const reimReadyActive = states.access.m_update == 1 && record.is_approved === 1 && states.controlMode === 7 && record.status === 1
                    const reimComplete = states.access.m_update == 1 && record.is_approved === 1 && states.controlMode === 7 && record.status === 3
                    return (
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
                                {states.access.m_update == 1 && ([null].includes(record.is_approved_r)) && record.is_approved !== 1 ?
                                <>
                                    {/* <a className={"link"}
                                        onClick={() => showApprove({ onOk: (() => approveReimburse(record)) })}
                                    > */}
                                    <a className={"link"} href={`/approval/reimbursement/entry?id=${record.id}&aprv=1`}>
                                        Approve/Reject
                                    </a>
                                    {/* <a className={"link"}
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
                                    </a> */}
                                </>
                            : null}
                            {reimReadyActive ?
                                <>
                                    <a className={"link"} onClick={() => showMoneyReady({ onOk: (() => setReimburseReady(record)) })}>
                                        Set Reimburse Ready
                                    </a>
                                </>
                            : null}
                            {reimComplete ?
                                <>
                                    <a className={"link"} onClick={() => showMoneyReady({ onOk: (() => completeReimburse(record)) })}>
                                        Complete Reimburse
                                    </a>
                                </>
                            : null}
                        </Space>
                    </>
                )}
            })
        }

        setStates({
            columns: columns
        })
    }, [states.access])
    
    return (
        <>
            <SWRConfig value={{ fallback }}>
                <PageHeader
                    title="All Reimbursement"
                    extra={[
                        states.access.m_insert == 1 ?
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
                        : null
                    ]}
                />
                <Card
                    className="custom-card"
                    title="List of Reimbursements"
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
                <ModalImage
                    open={states.openImage}
                    handleOpenModal={handleOpenModal}
                    header={"Images"}
                    images={states.images}
                />
                <ModalView
                    open={states.openView}
                    header="View Data"
                    handleOpenView={handleOpenView}
                    data={states.dataView}
                />
                <ModalFilter
                    header={"Filter Reimburse"}
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

const getImages = async (data: any) => {
    let res = await fetch(`/api/approval/request_reimbursement/${data}`)
    if (res.status !== 404) {
        let dataList = await res.json()
        return dataList
    } else {
        return alert("Error 404")
    }
}
        
export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session: any = await getLoginSession(ctx.req as NextApiRequest);
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

    const { key, page, row, startDate, endDate, column, direction, isApproved } = ctx.query as any

    const params: IPagination = {
        row: row ?? 10,
        page: page ?? 0,
        key: key ?? "",
        direction: direction ?? "",
        column: column ?? "",
        limit: "",
        startDate: startDate ?? '',
        endDate: endDate ?? '',
        isApproved: isApproved ?? ''
    }

    const getList = await getData(params, session);
    const roleMaster = await masterRole();
    const reimMaster = await masterReimbursementType()

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
                '/api/approval/request_reimbursement/list': JSON.parse(JSON.stringify(data))
            },
            data: JSON.parse(JSON.stringify(data)),
            master: {
                role: JSON.parse(JSON.stringify(roleMaster)),
                reimburse: JSON.parse(JSON.stringify(reimMaster)),
            },
            user: session.username,
            columns: [],
            access: {
                m_insert: trueRole[0].m_insert,
                m_update: trueRole[0].m_update,
                m_delete: trueRole[0].m_delete,
                m_view: trueRole[0].m_view
            },
            selectedFile: null,
            controlMode: session.accessId,
            isLoading: false,
            openModal: false,
            openImage: false,
            openView: false,
            typeView: "",
            dataView: {},
            typeModal: "",
            dataModal: {},
            editData: "",
            filter: {
                key: key ?? "",
                directions: direction ?? "",
                columns: column ?? "",
                limit: "",
                startDate: startDate ?? '',
                endDate: endDate ?? '',
                isApproved: isApproved ?? ''
            }
        }
    }
}

Reimbursement.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}

export default Reimbursement;