import React, { useReducer, useEffect } from "react";
import type { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from 'next/router';
import { IForm, IStateType } from "../../../interfaces/shift_transaction.interface";
import { PageHeader, Button, Card, Form, Row, Col, Input, Select, Checkbox } from "antd"
import DashboardLayout from "../../../components/layouts/Dashboard";
import Notifications from "../../../components/Notifications";
import { pageCheck } from "../../../lib/helper";
import { save, edit, findOne, findRole } from "../../api/transaction/shift/list";
import { useApp } from "../../../context/AppContext";
import { masterShift } from "../../api/transaction/shift/_model";
import { showConfirm } from "../../../components/modals/ModalAlert";
import moment from "moment";

const DetailShift = (props: any) => {
    const router = useRouter();
    const [ formModal ] = Form.useForm()
    const { setSubmitNotif } = useApp();
    const [states, setStates] = useReducer((state: IStateType, newState: Partial<IStateType>) => ({ ...state, ...newState }), props)

    const submitUpdate = async (values: any) => {
        const data = Buffer.from(JSON.stringify({...values})).toString('base64');
        router.push(router.asPath + `&submit=${data}`)
    }
    const submitAdd = async (values: any) => {
        const data = Buffer.from(JSON.stringify({...values})).toString('base64');
        router.push(router.asPath + `?submit=${data}`)
    }

    useEffect(() => {
        if (props.redirect) {
            const { type, message, description } = props.notif
            setSubmitNotif({type, message, description});
            router.push('/transaction/shift')
        }

        if (props.notif) {
            const { type, message, description } = props.notif
            Notifications(type, message, description)
            setSubmitNotif({type: "", message: "", description: ""})
            router.push({
                pathname: '/transaction/shift/' + router.query.type,
                query: router.query.type == "update" ? {id: router.query.id} : {}
             }, undefined, { shallow: true})
        }
    }, [props.notif])

    if (props.redirect) {
        return <></>
    }

    const submit = async (values: any) => {
        showConfirm({
            onOk: (router.query.type == 'add' ? () => submitAdd(values) : () => submitUpdate(values)) 
        })
    }

    let optionHour = [
        { key: "1", name: "work_hour", value: "8", label: "8 Hours" },
        { key: "0", name: "work_hour", value: "24", label: "24 Hours" }
    ];

    return (
        <>
            <PageHeader
                title="Shift Management"
                extra={[
                    <Button key="1"
                        onClick={() => formModal.submit()}
                        className={'button'}
                        shape="round"
                    >
                        Save
                    </Button>
                ]}
            />
            <Card title="Add Shift" >
                <Form 
                    form={formModal}
                    onFinish={submit}
                    initialValues={states.form}
                    className={"form"}
                    layout="vertical"
                >
                    
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item 
                                label="Shift"
                                name="shift_id"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    options={states.master.shift}
                                    placeholder="Shift Description"
                                    className={"select"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item 
                                label="Clock In"
                                name="clock_in"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Input
                                    type={"time"}
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item 
                                label="Clock Out"
                                name="clock_out"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Input
                                    type={"time"}
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item 
                                label="Working Hour"
                                name="work_hour"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    options={optionHour}
                                    placeholder="Working Hour"
                                    className={"select"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item 
                                label="Valid From"
                                name="validFrom"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Input
                                    placeholder="Valid From"
                                    type="date"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item 
                                label="Valid To"
                                name="validTo"
                            >
                                <Input
                                    placeholder="Valid To"
                                    type="date"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Col span={24}>
                        <Card title="Workday">
                            <Row>
                                <Form.Item name="workday">
                                    <Checkbox.Group>
                                        <Row>
                                            <Col span={12}>
                                                <Checkbox value="sunday">
                                                    Sunday
                                                </Checkbox>
                                            </Col>
                                            <Col span={12}>
                                                <Checkbox value="monday">
                                                    Monday
                                                </Checkbox>
                                            </Col>
                                            <Col span={12}>
                                                <Checkbox value="tuesday">
                                                    Tuesday
                                                </Checkbox>
                                            </Col>
                                            <Col span={12}>
                                                <Checkbox value="wednesday">
                                                    Wednesday
                                                </Checkbox>
                                            </Col>
                                            <Col span={12}>
                                                <Checkbox value="thursday">
                                                    Thursday
                                                </Checkbox>
                                            </Col>
                                            <Col span={12}>
                                                <Checkbox value="friday">
                                                    Friday
                                                </Checkbox>
                                            </Col>
                                            <Col span={12}>
                                                <Checkbox value="saturday">
                                                    Saturday
                                                </Checkbox>
                                            </Col>
                                        </Row>
                                    </Checkbox.Group>
                                </Form.Item>
                            </Row>
                            <Form.Item hidden name="id">
                                <Input type="hidden" />
                            </Form.Item>
                        </Card>
                    </Col>
                </Form>
            </Card>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const types = ['add', 'update', 'delete']
    const query: any = ctx.query
    var form = {
        id: "",
        shift_id: null,
        clock_in: "",
        clock_out: "",
        work_hour: "",
        workday: [],
        validFrom: "",
        validTo: "",
        status: null,
    } as IForm
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

    const trueRole = await pageCheck(session.username, '/transaction/shift')
    const getRole: any = await findRole({description: query.role as string, status: 0})
    
    if (trueRole.length < 1 || 
        (getRole.length < 1 && query.type == "update" && trueRole.m_update == 0) ||
        (query.type == "add" && trueRole.m_insert == 0) || 
        (query.type == "delete" && trueRole[0].m_delete == 0)
    ) {
        return {
            redirect: {
                destination: "/403",
                permanent: false
            }
        }
    }

    const shiftMaster = await masterShift();

    var access: {access: any, rawAccess: any} = {
        access: [],
        rawAccess: []
    }

    if (query.submit) {
        var param = JSON.parse(Buffer.from(query.submit, 'base64').toString('ascii'));
        
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
                    redirect: true,
                    notif: {
                        type: "success",
                        message: "Success",
                        description: "Item has been Updated"
                    },
                }
            }
        }

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
                redirect: true,
                notif: {
                    type: "success",
                    message: "Success",
                    description: "New shift has been added"
                },
            }
        }
    }

    if (query.type == 'add') {
        //access = await sortMenus(1);
        //form.access = access.rawAccess
    }

    if (query.type == 'update') {
        const detailData: any = await findOne(query.id)
        const validFrom: any = detailData[0].valid_from ? moment(detailData[0].valid_from).format("YYYY-MM-DD") : null;
        const validTo: any = detailData[0].valid_to ? moment(detailData[0].valid_to).format("YYYY-MM-DD") : null;
        
        form.id = detailData[0].id
        form.shift_id = detailData[0].shiftId
        form.clock_in = detailData[0].clock_in
        form.clock_out = detailData[0].clock_out
        form.work_hour = detailData[0].work_hour
        form.validFrom = validFrom
        form.validTo = validTo
        
        if (detailData[0].sunday == 1) {
            form.workday.push('sunday');
        }
        if (detailData[0].monday == 1) {
            form.workday.push('monday');
        }
        if (detailData[0].tuesday == 1) {
            form.workday.push('tuesday');
        }
        if (detailData[0].wednesday == 1) {
            form.workday.push('wednesday');
        }
        if (detailData[0].thursday == 1) {
            form.workday.push('thursday');
        }
        if (detailData[0].friday == 1) {
            form.workday.push('friday');
        }
        if (detailData[0].saturday == 1) {
            form.workday.push('saturday');
        }
    }

    return {
        props: {
            master: {
                shift: JSON.parse(JSON.stringify(shiftMaster))
            },
            access: {
                m_insert: trueRole[0].m_insert,
                m_update: trueRole[0].m_update,
                m_delete: trueRole[0].m_delete,
                m_view: trueRole[0].m_view
            },
            isLoading: false,
            menuAccess: JSON.parse(JSON.stringify(access.access)),
            form: JSON.parse(JSON.stringify(form)),
        }
    }
}

DetailShift.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}

export default DetailShift;