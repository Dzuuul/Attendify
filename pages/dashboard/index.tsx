// import { Row, Col, Card, Skeleton, Statistic } from "antd";
import Row from "antd/lib/row";
import Col from "antd/lib/col";
import Card from "antd/lib/card";
import Skeleton from "antd/lib/skeleton";
import Statistic from "antd/lib/statistic";
import { NextApiRequest } from "next";
import { useReducer } from "react";
import type { ReactElement } from 'react'
import { getLoginSession } from '@lib/auth';
import { pageCheck } from "../../lib/helper";
import { GetServerSideProps } from 'next';
import DashboardLayout from "../../components/layouts/Dashboard";
import { InitState } from "interfaces/dashboard.interface";
import moment from "moment";

const Dashboard = (props: any) => {
    const [states, setStates] = useReducer((state: InitState, newState: Partial<InitState>) => ({ ...state, ...newState }), props)

    // const { data: arrayEntries, error: errorEntries, isValidating: isLoadingEntries } = useSWR(`/api/dashboard/entries?subtract=0&type=${states.filter1.type}&startDate=${states.filter1.startDate}&endDate=${states.filter1.endDate}&monthYear=${states.filter1.monthYear}&condition=${states.filter1.condition}`)


    let date = new Date()
    return (
        <>
        <Row justify="center">
                <Col xs={24} xl={12}>
                    <Card hoverable style={{ margin: '16px 10px' }} title="Daily">
                        {/* <Link to="/entries"> */}
                        <Skeleton active
                            loading={false}
                        >
                            <Row gutter={24}>
                            <Col>
                            <Statistic
                                title="Attendance / Employees"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={120 + '/' + 120}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="On Leave"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={12}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="Total Late In"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={100}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="Total Early Out"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={100}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="Total No Check Out"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={100}
                            />
                            </Col>
                            </Row>
                        </Skeleton>
                        {/* </Link> */}
                    </Card>
                    <Card hoverable style={{ margin: '16px 10px' }} title="Weekly">
                        {/* <Link to="/entries"> */}
                        <Skeleton active
                            loading={false}
                        >
                            <Row gutter={24}>
                            <Col>
                            <Statistic
                                title="Attendance / Employees"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={120 + '/' + 120}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="On Leave"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={12}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="Total Late In"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={100}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="Total Early Out"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={100}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="Total No Check Out"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={100}
                            />
                            </Col>
                            </Row>
                        </Skeleton>
                        {/* </Link> */}
                    </Card>
                    <Card hoverable style={{ margin: '16px 10px' }} title="Monthly">
                        {/* <Link to="/entries"> */}
                        <Skeleton active
                            loading={false}
                        >
                            <Row gutter={24}>
                            <Col>
                            <Statistic
                                title="Attendance / Employees"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={120 + '/' + 120}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="On Leave"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={12}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="Total Late In"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={100}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="Total Early Out"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={100}
                            />
                            </Col>
                            <Col>
                            <Statistic
                                title="Total No Check Out"
                                // value={arrayEntries !== undefined ?
                                //     arrayEntries.totalEntries : '-'}
                                value={100}
                            />
                            </Col>
                            </Row>
                        </Skeleton>
                        {/* </Link> */}
                    </Card>
                </Col>
            </Row>
            <Row justify="center">
                <Col>
                    {/* <h2 style={{color: "#1890FF"}}>{
          `
          ${
            // arrayStat === undefined ? 'N/A':
            moment(arrayStat.startDate).format('D MMMM YYYY HH:mm')
          }
           - 
           ${
              arrayStat === undefined ? 'N/A':
             moment(arrayStat.endDate).format('D MMMM YYYY HH:mm')}`
           }</h2> */}
                </Col>
            </Row>
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

    // const roleMaster = await masterRole();

    let date = new Date()
    return {
        props: {
            // fallback: {
            //     '/api/dashboard/entries': JSON.parse(JSON.stringify(data))
            // },
            master: {
                // role: JSON.parse(JSON.stringify(roleMaster))
            },
            columns: [],
            access: {
                m_insert: trueRole[0].m_insert,
                m_update: trueRole[0].m_update,
                m_delete: trueRole[0].m_delete,
                m_view: trueRole[0].m_view
            },
            isLoading: false,
            key1: 'daily',
            key2: 'daily',
            filter: {
                startDate: "",
                endDate: "",
                monthYear: moment().format("YYYY-MM"),
                type: "chart",
                condition: "daily",
                media: "all"
            },
        }
    }
}

export default Dashboard;

Dashboard.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}