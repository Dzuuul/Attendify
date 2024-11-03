import React, { useEffect } from "react";
import type { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from 'next/router';
import DashboardLayout from "../../../components/layouts/Dashboard";
import { pageCheck } from "../../../lib/helper";
import { save, deleteCompany, edit } from "../../api/master/company/list";
import { useApp } from "../../../context/AppContext";

const ProcessCompany = (props: any) => {
    const router = useRouter();
    const { setSubmitNotif } = useApp();

    useEffect(() => {
        const { type, message, description } = props.notif
        setSubmitNotif({
            type,
            message,
            description
        })
        router.push('/master/company')
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

    const trueRole = await pageCheck(session.username, '/master/company')
    
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
                        message: "Success to change company data",
                        description: ""
                    },
                }
            }
        }

        //delete
        if (query.type == "delete") {
            const delComp: any = await deleteCompany(param, session);
            if (delComp == 'error' || delComp.error) {
                return {
                    props: {
                        isLoading: false,
                        notif: {
                            type: delComp.error.type,
                            message: delComp.error.message,
                            description: delComp?.error?.description 
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
        const savePosition: any = await save(param, session);
        if (savePosition == 'error' || savePosition.error) {
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: savePosition.error.type,
                        message: savePosition.error.message,
                        description: savePosition?.error?.description 
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
                    description: "Success to add new company data"
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

ProcessCompany.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}

export default ProcessCompany;