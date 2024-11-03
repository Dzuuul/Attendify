import React, { useEffect } from "react";
import type { ReactElement } from "react";
import { GetServerSideProps } from "next";
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from "next/router";

import DashboardLayout from "../../components/layouts/Dashboard";

import { pageCheck } from "../../lib/helper";
import { reqTimeOff } from "../api/attendance/list";
import { useApp } from "../../context/AppContext";
import requestIp from "request-ip"
import axios from "axios";

const ProcessUser = (props: any) => {
    const router = useRouter();
    const { setSubmitNotif } = useApp();

    useEffect(() => {
        const { type, message, description } = props.notif;
        setSubmitNotif({
            type,
            message,
            description,
        });
        router.push("/attendance/request_timeoff");
    }, []);

    return <></>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const query: any = ctx.query;
    const clientIp = requestIp.getClientIp(ctx.req)

    const session = await getLoginSession(ctx.req as NextApiRequest)

    if (!session) {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    const trueRole = await pageCheck(
        session.username,
        "/attendance"
    );
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

        const saveData: any = await reqTimeOff(param, session);

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