import React, { useEffect } from "react";
import type { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from 'next/router';
import DashboardLayout from "../../../components/layouts/Dashboard";
import { pageCheck } from "../../../lib/helper";
import { approve, reject } from "../../api/approval/request_attendance/list";
import { useApp } from "../../../context/AppContext";

const ProcessEmployeeShift = (props: any) => {
    const router = useRouter();
    const { setSubmitNotif } = useApp();
    useEffect(() => {
        const { type, message, description } = props.notif
        setSubmitNotif({
            type,
            message,
            description
        })
        router.push(`/approval/request_attendance?page=${props.queries.page}&row=${props.queries.row}&key=${props.queries.key}&column=${props.queries.column}&direction=${props.queries.direction}`)
    },[])

    return (
        <>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const types = ['reject', 'approve']
    const query: any = ctx.query

    if (!types.includes(query.type)) {
        return {
            notFound: true
        }
    }

    const session = await getLoginSession(ctx.req as NextApiRequest)

    if (!session) {
        return {
            redirect: {
                destination: "/login",
                permanent: false
            }
        }
    }

    const trueRole = await pageCheck(session.username, '/approval/request_attendance')
    
    if (trueRole.length < 1 || 
        (query.type == "add" && trueRole[0].m_insert == 0) ||
        (query.type == "update" && trueRole[0].m_update == 0)
    ) {
        return {
            redirect: {
                destination: "/403",
                permanent: false
            }
        }
    }

    const { submit } = query
    
    if (submit) {
        var param = JSON.parse(Buffer.from(submit, 'base64').toString('ascii'));
        //approve
        if (query.type == 'approve') {
            const update: any = await approve(param, session)
            if (update == 'error' || update.error) {
                return {
                    props: {
                        isLoading: false,
                        notif: {
                            type: update.error.type,
                            message: update.error.message,
                            description: update?.error?.description 
                        }, 
                        error: 'oops',
                        queries: query
                    }
                }
            }
    
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: "success",
                        message: "Success to approve data",
                        description: ""
                    },
                    queries: query
                }
            }
        }
        if (query.type == 'reject') {
            const update: any = await reject(param, session)
            if (update == 'error' || update.error) {
                return {
                    props: {
                        isLoading: false,
                        notif: {
                            type: update.error.type,
                            message: update.error.message,
                            description: update?.error?.description 
                        }, 
                        error: 'oops',
                        queries: query
                    }
                }
            }
    
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: "success",
                        message: "Success to reject data",
                        description: ""
                    },
                    queries: query
                }
            }
        }
    }

    return {
        props: {
            isLoading: false,
            queries: query
        }
    }
}

ProcessEmployeeShift.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}

export default ProcessEmployeeShift;