import React, { useEffect } from "react";
import type { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import { getLoginSession } from "@lib/auth";
import { useRouter } from 'next/router';
import { NextApiRequest } from "next";
import DashboardLayout from "../../../components/layouts/Dashboard";
import { pageCheck } from "../../../lib/helper";
import { readyReim, completeReim } from "../../api/approval/request_reimbursement/approve";
import { useApp } from "../../../context/AppContext";

const ProcessReimburse = (props: any) => {
    const router = useRouter();
    const { setSubmitNotif } = useApp();

    useEffect(() => {
        const { type, message, description } = props.notif
        setSubmitNotif({
            type,
            message,
            description
        })
        router.push(`/approval/reimbursement?key=${props.queries.key}&page=${props.queries.currentPage}&row=${props.queries.dataPerPage}&startDate=${props.queries.startDate}&endDate=${props.queries.endDate}&column=${props.queries.columns}&direction=${props.queries.directions}&isApproved=${props.queries.isApproved}`)
    },[])

    return (
        <>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const types = ['ready', 'complete']
    const query: any = ctx.query

    if (!types.includes(query.type)) {
        return {
            notFound: true
        }
    }

    const session: any = await getLoginSession(ctx.req as NextApiRequest);

    if (!session) {
        return {
            redirect: {
                destination: "/login",
                permanent: false
            }
        }
    }

    const trueRole = await pageCheck(session.username, '/approval/reimbursement')

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
        //update
        if (query.type == 'ready') {
            const update: any = await readyReim(param, session)
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
                        message: "Success",
                        description: ""
                    },
                    queries: query
                }
            }
        }

        if (query.type == "complete") {
            const delData: any = await completeReim(param, session);
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
                        message: "Success",
                        description: ""
                    },
                    queries: query
                }
            }
        }

        return {
            props: {
                isLoading: false,
                notif: {
                    type: "success",
                    message: "Success",
                    description: "Item has been saved"
                },
                queries: query
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

ProcessReimburse.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}

export default ProcessReimburse;