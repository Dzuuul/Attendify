import Row from "antd/lib/row";
import Col from "antd/lib/col";
import Card from "antd/lib/card";
import { Divider, Tag } from 'antd';
import { ReactElement, useCallback, useEffect, useState, useReducer } from 'react'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { pageCheck } from "../../lib/helper";
import { GetServerSideProps } from 'next';
import Image from "next/image";
import ClockIn from "../../public/img/clock-in.png";
import ClockOut from "../../public/img/clock-out.png";
import Clock from "react-digital-clock"
import Link from "next/link"
import DashboardLayout from "../../components/layouts/Dashboard";
import moment from "moment";
import { masterRole, masterTimeoff, masterCheckType } from "pages/api/master";
import { listAttendance, shiftEmployee, getTypeAtt, getRemainingLeave } from "pages/api/attendance/list";
import useSWR from "swr";
import { Button, Table } from "antd";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Notifications from "../../components/Notifications";
import { useApp } from "../../context/AppContext";
import { IPagination } from "../../interfaces/attendance.interface";

const ModalIO = dynamic(() => import('./_checkio'), { loading: () => <p></p> })

const ModalTO = dynamic(() => import('./_checkoff'), { loading: () => <p></p> })

const ModalAtt = dynamic(() => import('./_checkatt'), { loading: () => <p></p> })

const options = {
    enableHighAccuracy: false,
    timeout: 1000,
    maximumAge: 0
}

const Attendance = (props: any) => {
    const router = useRouter()
    const { statesContex, setSubmitNotif } = useApp();
    const [modalVisible, setModalVisible] = useReducer((state: any, newState: Partial<any>) => ({ ...state, ...newState }), { open: false, openTO: false, openAtt: false, mode: 0 })
    const [pos, setPos] = useState({ lat: -6.175392, lng: 106.827153 })
    const { data: dataAtt, error: errorAtt, isValidating: isLoadingAtt } = useSWR(`/api/attendance/list?employeeId=${props.emp}`)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        chkPosition()
        const checkIsMobile = () => {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        setIsMobile(checkIsMobile())
    }, [])

    const chkPosition = useCallback(async () => {
        const lalo = await navigator.geolocation.watchPosition((position) => {
            let lat: number = position.coords.latitude;
            let lng: number = position.coords.longitude;
            setPos({ lat: lat, lng: lng })
        })
    }, [])

    const chkIn = async (types: any) => {
        await chkPosition()
        if (!isMobile) {
            Notifications('warning', 'Warning', 'Please use mobile device only')
            return
        }
        const param = {
            employeeId: props?.emp,
            lat: pos.lat,
            long: pos.lng,
            clockType: types?.clockType,
            desc: types?.desc
        }
        const data = Buffer.from(JSON.stringify(param)).toString("base64");
        router.push(`/attendance/add?&submit=${data}`);
    };

    const chkOut = async (types: any) => {
        await chkPosition()
        if (!isMobile) {
            Notifications('warning', 'Warning', 'Please use mobile device only')
            return
        }
        const param = {
            employeeId: props?.emp,
            lat: pos.lat,
            long: pos.lng,
            desc: types?.desc
        }
        const data = Buffer.from(JSON.stringify(param)).toString("base64");
        router.push(`/attendance/update?&submit=${data}`);
    };

    const timeOffRequest = async (types: any) => {
        const param = {
            employeeId: props?.emp,
            start: types?.start,
            end: types?.end,
            offType: types?.TOType,
            desc: types?.desc
        }
        const data = Buffer.from(JSON.stringify(param)).toString("base64");
        router.push(`/attendance/off?&submit=${data}`);
    };

    const attendanceRequest = async (types: any) => {
        const param = {
            employeeId: props?.emp,
            start: types?.start,
            start_time: types?.start_time,
            end: types?.end,
            end_time: types?.end_time,
            type: types?.type,
            desc: types?.desc
        }
        const data = Buffer.from(JSON.stringify(param)).toString("base64");
        router.push(`/attendance/attendance_request?&submit=${data}`);
    };

    const dataSource = props?.list

    dataSource.forEach((i: any, index: number) => {
        i.key = index;
    });

    useEffect(() => {
        const { type, message, description } = statesContex.submitNotif
        Notifications(type, message, description)
        setSubmitNotif({ type: "", message: "", description: "" })
    }, [])

    let columns: any = [
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
                    {record.dept < 7 ?
                        record.status == 0 ?
                            <Tag color='green' key={record.status}>
                                {record.type + ' - ONTIME'}
                            </Tag>
                            : record.status == 1 && record.check_type != 3 ?
                                <Tag color='red' key={record.status}>
                                    {record.type + ' - LATE'}
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
                    {record.lat_in && record.long_in ?
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

    const mapVw: any =
        <iframe
            src={`https://maps.google.com/maps?q=${pos.lat},${pos.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            width="100%"
            height="300px"
            frameBorder="0"
            style={{ border: '0' }}
            allowFullScreen={false}
            aria-hidden="false"
            tabIndex={0}>
        </iframe>

    return (
        <>
            <div className="attendance-wrapper">
                <Row justify="center">
                    <Col style={{ textAlign: "center" }}>
                        <h6>{moment().format('dddd, MMMM Do YYYY')}</h6>
                        <h6> {props.shift[0] ? props.shift[0].description + " (" + props.shift[0].clock_in + " - " + props.shift[0].clock_out + ")" : ""}</h6>
                        <h1><Clock hour12={false} format={'HH:mm:ss'} /></h1>
                        <Card className="custom-card">
                            <Row>
                                <Button
                                    type="primary"
                                    onClick={() => setModalVisible({
                                        open: true,
                                        mode: 1
                                    })}
                                    disabled={isLoadingAtt ? true : dataAtt ? true : false}
                                    className="clockin-btn"
                                >
                                    <Image width={40} height={32} src={ClockIn} alt={"clock in"} />
                                    Clock-In
                                </Button>
                                <Divider type="vertical" style={{ height: "80px" }} />
                                <Button
                                    className="clockin-btn"
                                    type="primary"
                                    onClick={() => setModalVisible({
                                        open: true,
                                        mode: 2
                                    })}
                                    disabled={isLoadingAtt ? true : !dataAtt ? true : false}
                                >
                                    <Image width={40} height={32} src={ClockOut} alt={"clock out"} />
                                    Clock-Out
                                </Button>
                            </Row>
                        </Card>
                        {/*<div style={{ flexDirection: "row-reverse", display: "flex", marginBottom: '2em', color: '#d13037' }}>*/}
                        <Row gutter={24} style={{ marginLeft: 1, color: '#d13037' }}>
                            <a href="#"
                                onClick={() => setModalVisible({
                                    openAtt: true,
                                    mode: 1
                                })}
                            >
                                <p>Request Attendance</p>
                            </a> <span style={{ marginLeft: 20, marginRight: 20 }}>|</span>
                            <a href="#"
                                onClick={() => setModalVisible({
                                    openTO: true,
                                    mode: 1
                                })}
                            >
                                <p>Request Time Off</p>
                            </a>
                        </Row>
                        {/*</div>*/}
                    </Col>
                </Row>
            </div>
            <div className="content">
                <Row style={{ marginBottom: "30px" }}>
                    <Col span={24}>
                        {mapVw}
                    </Col>
                </Row>
                <Row justify="space-between" style={{ alignItems: "flex-end", marginBottom: "10px" }}>
                    <h2 style={{ marginBottom: "0px" }}>History</h2>
                    <span>Total Attendance : {dataSource.length}</span>
                    <Link href={`/attendance/history`} key={'link1'}>
                        <Button
                            key="1"
                            className={'custom-link'}
                            shape="round"
                        >
                            View Log
                        </Button>
                    </Link>
                </Row>
                <Row>
                    <Col xs={24} xl={24}>
                        <Table
                            style={{ overflowX: 'scroll' }}
                            dataSource={dataSource}
                            columns={columns}
                            size="middle"
                        />
                    </Col>
                </Row>
                <ModalIO
                    open={modalVisible.open}
                    close={() => setModalVisible({ open: false })}
                    mode={modalVisible.mode}
                    empName={props.empName}
                    checkType={props?.master?.chkType}
                    checkIn={chkIn}
                    checkOut={chkOut}
                />
                <ModalTO
                    open={modalVisible.openTO}
                    close={() => setModalVisible({ openTO: false })}
                    mode={modalVisible.mode}
                    empName={props.empName}
                    compName={props.compName}
                    remLeave={props.remLeave}
                    timeoff={props?.master?.timeoff}
                    timeoffReq={timeOffRequest}
                />
                <ModalAtt
                    open={modalVisible.openAtt}
                    close={() => setModalVisible({ openAtt: false })}
                    mode={modalVisible.mode}
                    empName={props.empName}
                    compName={props.compName}
                    typeAtt={props?.master?.typeAtt}
                    submitReq={attendanceRequest}
                />
            </div>
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

    const params: IPagination = {
        row: 10,
        page: 0,
        key: "",
        direction: "",
        column: "",
        startDate: "",
        endDate: "",
        employeeId: session.emp,
    }

    const roleMaster = await masterRole();
    const mstTimeoff = await masterTimeoff();
    const typeAtten = await getTypeAtt();
    const mstCheckType = await masterCheckType()
    const list = await listAttendance(params);
    const shift = await shiftEmployee(params)
    const getRemLeave = await getRemainingLeave(params)

    return {
        props: {
            master: {
                role: JSON.parse(JSON.stringify(roleMaster)),
                timeoff: JSON.parse(JSON.stringify(mstTimeoff)),
                chkType: JSON.parse(JSON.stringify(mstCheckType)),
                typeAtt: JSON.parse(JSON.stringify(typeAtten)),
            },
            columns: [],
            emp: session.emp,
            empName: session.fullname,
            compName: session.companyname,
            remLeave: getRemLeave,
            list: list,
            access: {
                m_insert: trueRole[0].m_insert,
                m_update: trueRole[0].m_update,
                m_delete: trueRole[0].m_delete,
                m_view: trueRole[0].m_view
            },
            isLoading: false,
            shift: JSON.parse(JSON.stringify(shift))
        }
    }
}

export default Attendance;

Attendance.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}