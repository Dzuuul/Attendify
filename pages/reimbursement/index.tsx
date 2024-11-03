import React, { useReducer, useEffect} from 'react'
import type { ReactElement } from 'react'
import { useRouter } from "next/router";
import useSWR, { SWRConfig } from "swr";
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import DashboardLayout from "../../components/layouts/Dashboard";
import dynamic from "next/dynamic";
import { IState, IPagination } from "../../interfaces/reimbursement.interface";
import { pageCheck } from "../../lib/helper";
import { getData, getRemainingReimburseDisplay } from "../api/reimbursement/employee";
import { getEmpId, masterRole } from "../api/master/index";
import { GetServerSideProps } from "next";
import { useApp } from "../../context/AppContext";
import Notifications from "../../components/Notifications";
import { showConfirm, showDeleteConfirm, showMoneyAccepted } from "../../components/modals/ModalAlert";
import { Image, Tag, Table, Input, Card, Button, PageHeader, Space, Col, Row } from 'antd';
import axios from 'axios';
import Link from "next/link";
import moment from 'moment';
// import { extendMoment } from 'moment-range';

// const moment = extendMoment(Moment);

const ModalFilter = dynamic(() => import("../approval/reimbursement/_filter"), { loading: () => <p>Loading...</p>, ssr: false });

const ModalImage = dynamic(() => import("./_images"), {
    loading: () => <p>Loading...</p>,
});

const ModalView = dynamic(() => import('./_view'), { loading: () => <p></p> })

const { Search } = Input

export const formatNumber = (number: number) => {
    if (number === undefined || number === null) {
      return null;
    } else {
    //   return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    let nf = new Intl.NumberFormat('en-US');
    return nf.format(number)
    }
};

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
    
    const { data: arrayData, error: errorData, isValidating: isLoadingData } = useSWR(`/api/reimbursement/employee?employeeId=${states.empId}&key=${states.filter.key}&page=${states.data.currentPage}&row=${states.data.dataPerPage}&startDate=${states.filter.startDate}&endDate=${states.filter.endDate}&column=${states.filter.columns}&direction=${states.filter.directions}&isApproved=${states.filter.isApproved}`)

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

    const handleOpenView = async (param: any) => {
        if(param.name === "openView" && param.value === true) {
            const encryp = Buffer.from(JSON.stringify(param.dataView?.reimburseId)).toString('base64')
            const respo = await getItems(encryp)
            setStates({
                [param.name]: param.value,
                typeView: param.typeView,
                dataView: param.dataView ? param.dataView : {},
                itemView: respo
            })
        } else {
        setStates({
            [param.name]: param.value,
            typeView: param.typeView,
            dataView: param.dataView ? param.dataView : {},
            itemView: []
        });
    }
    }

    const acceptReimburse = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/reimbursement/accept?&submit=${data}`)
    }
    
    const deleteData = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64')
        router.push(`/reimbursement/delete?submit=${data}`)
    };
    
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
                dataIndex: "number",
                key: "number",
            },
            {
                title: 'Request Time',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (text: string) => ( text ? moment(text).format('DD-MM-YYYY HH:mm:ss') : "-" )
            },
            {
                title: 'Subject',
                dataIndex: 'title',
                key: 'title',
            },
            {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
            },
            {
                title: 'Receipt Date',
                dataIndex: 'receipt_date',
                key: 'receipt_date',
                render: (text: string) => ( text ? moment(text).format('DD-MM-YYYY') : "-" )
            },
            {
                title: 'Amount',
                dataIndex: 'amount',
                key: 'amount',
                render: (text: any) => {
                    return "Rp. " + text.toLocaleString("en")
                }
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
                        id: record.id
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
                                CONFIRMED BY REQUESTER
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
                    const chk = () => {
                        return !record.status_approve.includes("APPROVED") && !record.status_approve.includes("REJECTED")
                    }
                    
                    return (
                    <>
                    <Space size="middle">
                    <a className={"link"} style={{paddingRight: '1em'}}
                                onClick={() =>
                                    handleOpenView({
                                        name: "openView",
                                        value: true,
                                        typeView: "View",
                                        dataView: record
                                    })
                                }
                            >
                                View Progress
                            </a>
                            </Space>
                        {!record.status ? (
                            <Space size="middle">
                            {states.access.m_update == 1 && record.status != 0 && chk() ?
                                <a className={"link"} href={`/reimbursement/entry?id=${record.id}`}>
                                Modify
                            </a>
                                : null}
                            {states.access.m_delete == 1 && record.status != 0 && chk() ?
                                <a className={"link"}
                                    onClick={() => showDeleteConfirm({ onOk: (() => deleteData(record.id)) })}
                                >
                                    Delete
                                </a>
                                : null}
                        </Space>
                        ) : null}
                        {record.status === 2 ? (
                            <Space size="middle">
                            <a className={"link"} href={`/approval/reimbursement/entry?id=${record.id}&view=1`}>
                                View Detail
                            </a>
                            {states.access.m_update == 1 ?
                                <a className={"link"} onClick={() => showMoneyAccepted({ onOk: (() => acceptReimburse(record)) })}>
                                Confirm
                            </a>
                                : null}
                        </Space>
                        ) : null}
                        
                    </>
                )
            }})
        }

        setStates({
            columns: columns
        })
    }, [states.access])

    return (
        <>
            <SWRConfig value={{ fallback }}>
                <PageHeader
                    title="Reimbursement"
                    extra={[
                        states.access.m_insert == 1 ?
                        <Row key="1">
                            <Col style={{marginRight: '1em'}}>
                            <Button
                                onClick={() =>
                                    // handleOpenModal({
                                    //     name: 'openModal',
                                    //     typeModal: 'modalAdd',
                                    //     value: true
                                    // })
                                    router.push('/reimbursement/entry')
                                }
                                className={'button'}
                                shape="round"
                            >
                                Add
                            </Button>
                            </Col>
                            <Col>
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
                            </Row>
                        : null
                    ]}
                />
                <Card
                    className="custom-card"
                    title="List of Reimbursements"
                >
                    <p style={{paddingLeft: '24px'}}>Remaining Reimburse: Rp. {formatNumber(states.allowed)}</p>
                    {/* <p style={{paddingLeft: '24px'}}>Periode: {states.dateRange}</p> */}
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
                    items={states.itemView}
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
    let res = await fetch(`/api/reimbursement/${data}`)
    if (res.status !== 404) {
        let dataList = await res.json()
        return dataList
    } else {
        return alert("Error 404")
    }
}

const getItems = async (data: any) => {
    let res = await fetch(`/api/reimbursement/items`, {
    method: 'POST',
      body: JSON.stringify({
          data: data
      }),
      headers: {
        'Content-Type': 'application/json',
    },
    })
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

    const empId = await getEmpId(session.username)
   
    const params: IPagination = {
        row: 10,
        page: 0,
        key: "",
        direction: "",
        limit: "",
        column: "",
        startDate: "",
        endDate: "",
        isApproved: '',
        employeeId: empId[0].id
    }
    
    const getRemaining: any = await getRemainingReimburseDisplay(empId[0].id)
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
                '/api/reimbursement/list': JSON.parse(JSON.stringify(data))
            },
            data: JSON.parse(JSON.stringify(data)),
            master: {
                role: JSON.parse(JSON.stringify(roleMaster))
            },
            empId: empId[0].id,
            user: session.username,
            columns: [],
            access: {
                m_insert: trueRole[0].m_insert,
                m_update: trueRole[0].m_update,
                m_delete: trueRole[0].m_delete,
                m_view: trueRole[0].m_view
            },
            allowed: JSON.parse(JSON.stringify(getRemaining.allowed)),
            dataView: {},
            selectedFile: null,
            isLoading: false,
            openModal: false,
            openImage: false,
            typeModal: "",
            dataModal: {},
            editData: "",
            filter: {
                key: "",
                directions: "",
                columns: "",
                startDate: "",
                endDate: "",
                isApproved: '',
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