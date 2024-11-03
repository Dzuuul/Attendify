import React, { useEffect } from "react";
import type { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from 'next/router';
import DashboardLayout from "../../../components/layouts/Dashboard";
import { pageCheck } from "../../../lib/helper";
import { approve, reject, deleteData } from "../../api/approval/timeoff/list";
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
        router.push(`/approval/timeoff?page=${props.queries.page}&row=${props.queries.row}&key=${props.queries.key}&column=${props.queries.column}&direction=${props.queries.direction}&startDate=${props.queries.startDate}&endDate=${props.queries.endDate}&status=${props.queries.status}`)
    },[])

    return (
        <>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const types = ['reject', 'approve', 'delete']
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

    const trueRole = await pageCheck(session.username, '/approval/timeoff')
    
    if (trueRole.length < 1 || 
        (query.type == "add" && trueRole[0].m_insert == 0) ||
        (query.type == "update" && trueRole[0].m_update == 0) ||
        (query.type == "delete" && trueRole[0].m_delete == 0)
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

        //reject
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

        //delete
        if (query.type == "delete") {
            const delData: any = await deleteData(param, session);
            if (delData == 'error' || delData.error) {
                return {
                    props: {
                        isLoading: false,
                        notif: {
                            type: delData.error.type,
                            message: delData.error.message,
                            description: delData?.error?.description 
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
                        message: "Success to delete data",
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