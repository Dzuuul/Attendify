import React, { useEffect } from "react";
import type { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from 'next/router';
import DashboardLayout from "../../../components/layouts/Dashboard";
import { pageCheck } from "../../../lib/helper";
import { save, deleteDivision, edit } from "../../api/master/division/list";
import { useApp } from "../../../context/AppContext";

const ProcessDivision = (props: any) => {
    const router = useRouter();
    const { setSubmitNotif } = useApp();

    useEffect(() => {
        const { type, message, description } = props.notif
        setSubmitNotif({
            type,
            message,
            description
        })
        router.push('/master/division')
    },[])

    return (
        <>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const types = ['add', 'update', 'delete']
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

    const trueRole = await pageCheck(session.username, '/master/division')
    
    if (trueRole.length < 1 || 
        (query.type == "add" && trueRole[0].m_insert == 0) ||
        (query.type == "delete" && trueRole[0].m_delete == 0) ||
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
        if (query.type == 'update') {
            const update: any = await edit(param, session)
            if (update == 'error' || update.error) {
                return {
                    props: {
                        isLoading: false,
                        notif: {
                            type: update.error.type,
                            message: update.error.message,
                            description: update?.error?.description 
                        }, 
                        error: 'oops'
                    }
                }
            }
    
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: "success",
                        message: "Success to change division data",
                        description: ""
                    },
                }
            }
        }

        //delete
        if (query.type == "delete") {
            const delDivision: any = await deleteDivision(param, session);
            if (delDivision == 'error' || delDivision.error) {
                return {
                    props: {
                        isLoading: false,
                        notif: {
                            type: delDivision.error.type,
                            message: delDivision.error.message,
                            description: delDivision?.error?.description 
                        }, 
                        error: 'oops'
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
                }
            }
        }

        // add
        const saveData: any = await save(param, session);
        if (saveData == 'error' || saveData.error) {
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: saveData.error.type,
                        message: saveData.error.message,
                        description: saveData?.error?.description 
                    }, 
                    error: 'oops'
                }
            }
        }

        return {
            props: {
                isLoading: false,
                notif: {
                    type: "success",
                    message: "Success",
                    description: "Success to add new division"
                },
            }
        }
    }

    return {
        props: {
            isLoading: false,
        }
    }
}

ProcessDivision.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}

export default ProcessDivision;