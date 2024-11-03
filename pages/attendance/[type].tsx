import React, { useEffect } from "react";
import type { ReactElement } from "react";
import { GetServerSideProps } from "next";
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from "next/router";

import DashboardLayout from "../../components/layouts/Dashboard";

import { pageCheck } from "../../lib/helper";
import { checkIn, checkOut } from "../api/attendance/list";
import { useApp } from "../../context/AppContext";
import requestIp from "request-ip"
import axios from "axios";

const ProcessUser = (props: any) => {
    const router = useRouter();
    const { setSubmitNotif } = useApp();
    
    useEffect(() => {
        const { type, message, description, clockType } = props.notif;
        setSubmitNotif({
            type,
            message,
            description,
        });
        if (clockType == 3) {
            router.push("/attendance/request_timeoff");
        } else {
            router.push("/attendance");
        }
    }, []);
    
    return <></>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const types = ["add", "update", "delete"];
    const query: any = ctx.query;
    const clientIp = requestIp.getClientIp(ctx.req)
    
    if (!types.includes(query.type)) {
        return {
            notFound: true,
        };
    }
    
    const session = await getLoginSession(ctx.req as NextApiRequest)
    
    if (!session) {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }
    
    const trueRole = await pageCheck(session.username, "/attendance");
    // const getRole = await checkRole({description: query.role})
    if (
        trueRole.length < 1 ||
        (query.type == "add" && trueRole[0].m_insert == 0) ||
        (query.type == "delete" && trueRole[0].m_delete == 0) ||
        (query.type == "update" && trueRole[0].m_update == 0)
    ) {
        return {
            redirect: {
                destination: "/403",
                permanent: false,
            },
        };
    }
        
    const { submit } = query;
        
    if (submit) {
        var param = JSON.parse(Buffer.from(submit, "base64").toString("ascii"));
        //update
        if (query.type == "update") {
            const update: any = await checkOut(param, session);
            if (update == "error" || update.error) {
            return {
                props: {
                isLoading: false,
                notif: {
                    type: update.error.type,
                    message: update.error.message,
                    description: update?.error?.description,
                },
                error: "oops",
                },
            };
            }
        
            return {
            props: {
                isLoading: false,
                notif: {
                type: "success",
                message: "Success",
                description: "",
                },
            },
            };
        }
        
        // add
        const saveData: any = await checkIn(param, session);
        if (saveData == "error" || saveData.error) {
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: saveData.error.type,
                        message: saveData.error.message,
                        description: saveData?.error?.description,
                    },
                    error: "oops",
                },
            };
        }
        
        return {
            props: {
                isLoading: false,
                notif: {
                    type: "success",
                    message: "Success",
                    description: "",
                    clockType: saveData.clockType,
                },
            },
        };
    }
    
    return {
        props: {
            isLoading: false,
        },
    };
};
        
ProcessUser.getLayout = function getLayout(page: ReactElement) {
    return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProcessUser;