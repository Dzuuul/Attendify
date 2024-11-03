import React, { useEffect } from "react";
import type { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from 'next/router';

import DashboardLayout from "../../../components/layouts/Dashboard";

import { pageCheck } from "../../../lib/helper";
import { save, deleteUser, edit } from "../../api/user/list";
import { useApp } from "../../../context/AppContext";

const ProcessUser = (props: any) => {
    const router = useRouter();
    const { setSubmitNotif } = useApp();

    useEffect(() => {
        const { type, message, description } = props.notif
        setSubmitNotif({
            type,
            message,
            description
        })
        router.push('/settings/users')
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

    const trueRole = await pageCheck(session.username, '/settings/users')
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
        //update
        if (query.type == 'update') {
            const update: any = await edit(param)
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
                        message: "Success to change user data",
                        description: ""
                    },
                }
            }
        }

        //delete
        if (query.type == "delete") {
            const delUser: any = await deleteUser(param);
            if (delUser == 'error' || delUser.error) {
                return {
                    props: {
                        isLoading: false,
                        notif: {
                            type: delUser.error.type,
                            message: delUser.error.message,
                            description: delUser?.error?.description 
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
        //check null
        if (param.username == '' || param.name == '' || param.password == '') {
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
        const saveUsers: any = await save(param);
        if (saveUsers == 'error' || saveUsers.error) {
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: saveUsers.error.type,
                        message: saveUsers.error.message,
                        description: saveUsers?.error?.description 
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
                    description: "Success to add new user"
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

ProcessUser.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}

export default ProcessUser;