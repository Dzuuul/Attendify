import React, { useReducer, useEffect } from "react";
import type { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from 'next/router';
import { IStateType, IList } from "../../../interfaces/role.interface";

import { PageHeader, Table, Button, Card, Form, Row, Col, Input, Select, Checkbox } from "antd"

import DashboardLayout from "../../../components/layouts/Dashboard";
import Notifications from "../../../components/Notifications";

import { pageCheck } from "../../../lib/helper";
import { save, edit, findOne, deleteRole } from "../../api/role/list";
import { sortMenus, menuLeftAccessV2 } from "../../api/menu/list";
import { showConfirm } from "../../../components/modals/ModalAlert";
import { useApp } from "../../../context/AppContext";

const DetailRole = (props: any) => {
    const router = useRouter();
    const { setSubmitNotif } = useApp();
    const [states, setStates] = useReducer((state: IStateType, newState: Partial<IStateType>) => ({ ...state, ...newState }), props)

    const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
        e.preventDefault()
        const { name, value } = e.currentTarget
        setStates({
          form: {
            ...states.form,
            [name]: value
          }
        })
    };

    const handleChangeSelect = (value: string, option: any) => {
        const name = option.name
        setStates({
            form: {
                ...states.form,
                [name]: value
            }
        });
    };

    const handleCheckBox = async (e: any, param: any) => {
        const { menuAccess, form } = states
        const { item, index, name } = param
        const tempAccess = menuAccess

        if (item.level != 1) {
            var found = {
                index: "",
                menu_header: ""
            }
            const sub = item.sub
            await menuAccess.map((el: any, index: number) => { 
                if (el.menu_header == sub) {
                    found = {...el, index}
                    return
                }
            });

            const check = tempAccess[found.index].children.some((el: any) => el[name] == 1);
            if (tempAccess[found.index].m_insert || 
                tempAccess[found.index].m_update || 
                tempAccess[found.index].m_delete || 
                tempAccess[found.index].m_view ||
                check
                ) {
                    tempAccess[found.index][name] = true
                    tempAccess[found.index].type = true    
            } else {
                tempAccess[found.index][name] = e.target.checked
                tempAccess[found.index].type = e.target.checked
            }

            const childMenuHeader = tempAccess[found.index].children[index].menu_header
            await form.access.map((el: any, index: number) => { 
                if (el.menu_header == childMenuHeader) {
                    form.access[index][name] = e.target.checked ? 1 : 0

                    if (form.access[index].m_insert || 
                        form.access[index].m_update || 
                        form.access[index].m_delete || 
                        form.access[index].m_view) {
                            form.access[index].type = true    
                    } else {
                        form.access[index].type = e.target.checked
                    }
                }
            });

            tempAccess[found.index].children[index][name] = e.target.checked ? 1 : 0
        }

        if (item.level == 1) {
            tempAccess[index][name] = e.target.checked
            if (tempAccess[index].children) {
                tempAccess[index].children.map(async (itemChild: any) => {
                    itemChild[name] = e.target.checked

                    await form.access.map((el: any, index: number) => { 
                        if (el.menu_header == itemChild.menu_header) {
                            form.access[index][name] = e.target.checked ? 1 : 0

                            if (form.access[index].m_insert || 
                                form.access[index].m_update || 
                                form.access[index].m_delete || 
                                form.access[index].m_view) {
                                    form.access[index].type = true    
                            } else {
                                form.access[index].type = e.target.checked
                            }
                        }
                    });
                })
            }

            await form.access.map((el: any, index: number) => { 
                if (el.menu_header == item.menu_header) {
                    form.access[index][name] = e.target.checked ? 1 : 0

                    if (form.access[index].m_insert || 
                        form.access[index].m_update || 
                        form.access[index].m_delete || 
                        form.access[index].m_view) {
                            form.access[index].type = true    
                    } else {
                        form.access[index].type = e.target.checked
                    }
                }
            });
        }

        setStates({
            menuAccess: tempAccess
        })
    }

    const handleCheckAll = async (e: any, param: any) => {
        const { menuAccess, form } = states
        const { item, index, name } = param
        const tempAccess = menuAccess
        
        if (item.level != 1) {
            var found = {
                index: "",
                menu_header: ""
            }
            const sub = item.sub
            await menuAccess.map((el: any, index: number) => { 
                if (el.menu_header == sub) {
                    found = {...el, index}
                    return
                }
            });

            const check = tempAccess[found.index].children.some((el: any) => el[name] == 1);
            //if had child, child check
            if (tempAccess[found.index].m_insert || 
                tempAccess[found.index].m_update || 
                tempAccess[found.index].m_delete || 
                tempAccess[found.index].m_view ||
                check
                ) {
                    tempAccess[found.index][name] = true
                    tempAccess[found.index].type = true    
            } else {
                //parent check
                tempAccess[found.index].m_insert = e.target.checked
                tempAccess[found.index].m_update = e.target.checked
                tempAccess[found.index].m_delete = e.target.checked
                tempAccess[found.index].m_view = e.target.checked
                tempAccess[found.index][name] = e.target.checked
                tempAccess[found.index].type = e.target.checked
            }

            //const childMenuHeader = tempAccess[found.index].children[index].menu_header

            if (tempAccess[found.index].children[index]) {
                form.access[index].m_insert = e.target.checked ? 1 : 0
                
                if (form.access[index].m_insert || 
                    form.access[index].m_update || 
                    form.access[index].m_delete || 
                    form.access[index].m_view) {
                    tempAccess[found.index].children[index].m_insert = e.target.checked ? 1 : 0
                    tempAccess[found.index].children[index].m_update = e.target.checked ? 1 : 0
                    tempAccess[found.index].children[index].m_delete = e.target.checked ? 1 : 0
                    tempAccess[found.index].children[index].m_view = e.target.checked ? 1 : 0
                    form.access[index].type = true    
                } else {
                    tempAccess[found.index].children[index].m_insert = e.target.checked ? 1 : 0
                    tempAccess[found.index].children[index].m_update = e.target.checked ? 1 : 0
                    tempAccess[found.index].children[index].m_delete = e.target.checked ? 1 : 0
                    tempAccess[found.index].children[index].m_view = e.target.checked ? 1 : 0
                    form.access[index].type = e.target.checked
                }
            }
            tempAccess[found.index].children[index][name] = e.target.checked ? 1 : 0
        }

        if (item.level == 1) {
            tempAccess[index][name] = e.target.checked
            tempAccess[index].m_insert = e.target.checked
            tempAccess[index].m_update = e.target.checked
            tempAccess[index].m_delete = e.target.checked
            tempAccess[index].m_view = e.target.checked
            form.access[index].m_insert = e.target.checked ? 1 : 0
            form.access[index].m_update = e.target.checked ? 1 : 0
            form.access[index].m_delete = e.target.checked ? 1 : 0
            form.access[index].m_view = e.target.checked ? 1 : 0

            if (tempAccess[index].children) {
                tempAccess[index].children.map(async (itemChild: any) => {
                    itemChild[name] = e.target.checked

                    await form.access.map((el: any, index: number) => { 
                        if (el.menu_header == itemChild.menu_header) {
                            form.access[index][name] = e.target.checked ? 1 : 0

                            if (form.access[index].m_insert || 
                                form.access[index].m_update || 
                                form.access[index].m_delete || 
                                form.access[index].m_view) {
                                form.access[index].type = true    
                            } else {
                                form.access[index].type = e.target.checked
                            }
                        }
                    });
                })
                tempAccess[index].children.map(async (itemChild: any) => {
                    itemChild.m_insert = e.target.checked

                    await form.access.map((el: any, index: number) => { 
                        if (el.menu_header == itemChild.menu_header) {
                            form.access[index].m_insert = e.target.checked ? 1 : 0

                            if (form.access[index].m_insert || 
                                form.access[index].m_update || 
                                form.access[index].m_delete || 
                                form.access[index].m_view) {
                                form.access[index].type = true    
                            } else {
                                form.access[index].type = e.target.checked
                            }
                        }
                    });
                })
                tempAccess[index].children.map(async (itemChild: any) => {
                    itemChild.m_update = e.target.checked

                    await form.access.map((el: any, index: number) => { 
                        if (el.menu_header == itemChild.menu_header) {
                            form.access[index].m_update = e.target.checked ? 1 : 0

                            if (form.access[index].m_insert || 
                                form.access[index].m_update || 
                                form.access[index].m_delete || 
                                form.access[index].m_view) {
                                form.access[index].type = true    
                            } else {
                                form.access[index].type = e.target.checked
                            }
                        }
                    });
                })
                tempAccess[index].children.map(async (itemChild: any) => {
                    itemChild.m_delete = e.target.checked

                    await form.access.map((el: any, index: number) => { 
                        if (el.menu_header == itemChild.menu_header) {
                            form.access[index].m_delete = e.target.checked ? 1 : 0

                            if (form.access[index].m_insert || 
                                form.access[index].m_update || 
                                form.access[index].m_delete || 
                                form.access[index].m_view) {
                                form.access[index].type = true    
                            } else {
                                form.access[index].type = e.target.checked
                            }
                        }
                    });
                })
                tempAccess[index].children.map(async (itemChild: any) => {
                    itemChild.m_view = e.target.checked

                    await form.access.map((el: any, index: number) => { 
                        if (el.menu_header == itemChild.menu_header) {
                            form.access[index].m_view = e.target.checked ? 1 : 0

                            if (form.access[index].m_insert || 
                                form.access[index].m_update || 
                                form.access[index].m_delete || 
                                form.access[index].m_view) {
                                form.access[index].type = true    
                            } else {
                                form.access[index].type = e.target.checked
                            }
                        }
                    });
                })
            }

            await form.access.map((el: any, index: number) => { 
                if (el.menu_header == item.menu_header) {
                    form.access[index][name] = e.target.checked ? 1 : 0
                    form.access[index].m_insert = e.target.checked ? 1 : 0
                    form.access[index].m_update = e.target.checked ? 1 : 0
                    form.access[index].m_delete = e.target.checked ? 1 : 0
                    form.access[index].m_view = e.target.checked ? 1 : 0

                    if (form.access[index].m_insert || 
                        form.access[index].m_update || 
                        form.access[index].m_delete || 
                        form.access[index].m_view) {
                        form.access[index].type = true    
                    } else {
                        form.access[index].type = e.target.checked
                    }
                }
            });
        }

        setStates({
            menuAccess: tempAccess
        })
    }

    const submitUpdate = async () => {
        const { form, userId } = states
        const data = Buffer.from(JSON.stringify({...form, id: router.query.role, userId})).toString('base64');
        router.push(router.asPath + `&submit=${data}`)
    }

    const submit = async () => {
        const { form, userId } = states
        const data = Buffer.from(JSON.stringify({...form, userId})).toString('base64');
        router.push(router.asPath + `?submit=${data}`)
    }

    let optionStatus = [
        { key: "1", name: "status", value: 1, label: "Enable" },
        { key: "0", name: "status", value: 0, label: "Disable" }
    ];

    const columns = [
        {
            title: 'Check All',
            dataIndex: 'm_check',
            key: 'm_check',
            render: (value: boolean, record: IList, index: number) => (
                <>
                    <Checkbox
                        checked={value}
                        onChange={(e) => handleCheckAll(e, {item: record, index, name: "m_check"})}
                    />
                </>
            )
        },
        {
            title: 'Menu',
            dataIndex: 'menu',
            key: 'menu',
        },
        {
            title: 'Insert',
            dataIndex: 'm_insert',
            key: 'm_insert',
            render: (value: boolean, record: IList, index: number) => (
                <>
                    <Checkbox
                        checked={value}
                        onChange={(e) => handleCheckBox(e, {item: record, index, name: "m_insert"})}
                    />
                </>
            )
        },
        {
            title: 'Update',
            dataIndex: 'm_update',
            key: 'm_update',
            render: (value: boolean, record: IList, index: number) => (
                <>
                    <Checkbox
                        checked={value}
                        onChange={(e) => handleCheckBox(e, {item: record, index, name: "m_update"})}
                    />
                </>
            )
        },
        {
            title: 'Delete',
            dataIndex: 'm_delete',
            key: 'm_delete',
            render: (value: boolean, record: IList, index: number) => (
                <>
                    <Checkbox
                        checked={value}
                        onChange={(e) => handleCheckBox(e, {item: record, index, name: "m_delete"})}
                    />
                </>
            )
        },
        {
            title: 'View',
            dataIndex: 'm_view',
            key: 'm_view',
            render: (value: boolean, record: IList, index: number) => (
                <>
                    <Checkbox
                        checked={value}
                        onChange={(e) => handleCheckBox(e, {item: record, index, name: "m_view"})}
                    />
                </>
            )
        },
        {
            title: 'Sort',
            dataIndex: 'sort',
            key: 'sort'
        },
    ];

    useEffect(() => {
        if (props.redirect) {
            const { type, message, description } = props.notif
            setSubmitNotif({type, message, description});
            router.push('/settings/role')
        }

        if (props.notif) {
            const { type, message, description } = props.notif
            Notifications(type, message, description)
            setSubmitNotif({type: "", message: "", description: ""})
            router.push({
                pathname: '/settings/role/' + router.query.type,
                query: router.query.type == "update" ? {role: router.query.role} : {}
             }, undefined, { shallow: true})
        }
    }, [props.notif])

    if (props.redirect) {
        return <></>
    }

    return (
        <>
            <PageHeader
                title="Role Management"
                extra={[
                    <Button key="1"
                        onClick={() => showConfirm({ 
                                onOk: (router.query.type == 'add' ? submit : submitUpdate) 
                            }
                        )}
                        className={'button'}
                        shape="round"
                    >
                        Save
                    </Button>
                ]}
            />
            <Card title="Add Role" >
                <Form className={"form"} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Description">
                                <Input
                                    name="description"
                                    value={states.form.description}
                                    onChange={handleChange}
                                    placeholder="Role Description"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Status">
                                <Select
                                    value={states.form.status}
                                    onChange={handleChangeSelect}
                                    options={optionStatus}
                                    className={"select"}
                                    placeholder="Choose an option"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Table
                                size="small"
                                columns={columns}
                                dataSource={states.menuAccess}
                                pagination={false}
                                // rowSelection={{ 
                                //     ...rowSelection, 
                                //     checkStrictly: true 
                                // }}
                            />
                        </Col>
                    </Row>
                </Form>
            </Card>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const types = ['add', 'update', 'delete']
    const query: any = ctx.query
    var form = {
        description: null,
        status: null,
        access: []
    }
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

    const userId = session.id;
    const trueRole = await pageCheck(session.username, '/settings/role')
    const getRole: any = await findOne({description: query.role as string, status: 0})
    
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

    var access: {access: any, rawAccess: any} = {
        access: [],
        rawAccess: []
    }

    if (query.submit) {
        var param = JSON.parse(Buffer.from(query.submit, 'base64').toString('ascii'));
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
                    redirect: true,
                    notif: {
                        type: "success",
                        message: "Success",
                        description: "Item has been Updated"
                    },
                }
            }
        }

        //delete
        if (query.type == "delete") {
            const delRole: any = await deleteRole(param);
            if (delRole == 'error' || delRole.error) {
                return {
                    props: {
                        isLoading: false,
                        redirect: true,
                        notif: {
                            type: delRole.error.type,
                            message: delRole.error.message,
                            description: delRole?.error?.description 
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
                        description: "Item has been deleted"
                    },
                }
            }
        }

        const saveRole: any = await save(param);
        if (saveRole == 'error' || saveRole.error) {
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: saveRole.error.type,
                        message: saveRole.error.message,
                        description: saveRole?.error?.description 
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
                    description: "New role has been added"
                },
            }
        }
    }

    if (query.type == 'add') {
        access = await sortMenus(1);
        form.access = access.rawAccess
    }

    if (query.type == 'update') {
        access = await menuLeftAccessV2({role: query.role})
        const detailData: any = await findOne({description: query.role as string, status: 0})
        form.description = detailData[0].description
        form.status = detailData[0].status
        form.access = access.rawAccess
    }

    return {
        props: {
            access: {
                m_insert: trueRole[0].m_insert,
                m_update: trueRole[0].m_update,
                m_delete: trueRole[0].m_delete,
                m_view: trueRole[0].m_view
            },
            isLoading: false,
            menuAccess: JSON.parse(JSON.stringify(access.access)),
            form: JSON.parse(JSON.stringify(form)),
            userId: userId,
        }
    }
}

DetailRole.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}

export default DetailRole;