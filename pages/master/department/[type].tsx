import React, { useEffect } from "react";
import type { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from 'next/router';
import DashboardLayout from "../../../components/layouts/Dashboard";
import { pageCheck } from "../../../lib/helper";
import { save, deleteDept, edit } from "../../api/master/department/list";
import { useApp } from "../../../context/AppContext";

const ProcessDepartment = (props: any) => {
    const router = useRouter();
    const { setSubmitNotif } = useApp();

    useEffect(() => {
        const { type, message, description } = props.notif
        setSubmitNotif({
            type,
            message,
            description
        })
        router.push('/master/department')
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

    const trueRole = await pageCheck(session.username, '/master/department')
    // const getRole = await checkRole({description: query.role})
    
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

        //delete
        if (query.type == "delete") {
            const delJobdata: any = await deleteDept(param, session);
            if (delJobdata == 'error' || delJobdata.error) {
                return {
                    props: {
                        isLoading: false,
                        notif: {
                            type: delJobdata.error.type,
                            message: delJobdata.error.message,
                            description: delJobdata?.error?.description 
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

        //check null
        if (param.description == '' || param.status == '') {
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: "error",
                        message: "Error",
                        description: "Data cannot be empty!"
                    }, 
                    error: 'oops'
                }
            }
        }
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
                        message: "Success",
                        description: ""
                    },
                }
            }
        }

        // add
        const saveJobdata: any = await save(param, session);
        if (saveJobdata == 'error' || saveJobdata.error) {
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: saveJobdata.error.type,
                        message: saveJobdata.error.message,
                        description: saveJobdata?.error?.description 
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

    return {
        props: {
            isLoading: false,
        }
    }
}

ProcessDepartment.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}

export default ProcessDepartment;