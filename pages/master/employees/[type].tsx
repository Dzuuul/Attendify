import React, { useReducer, useEffect, useState } from "react";
import type { ReactElement } from 'react'
import { GetServerSideProps } from 'next'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from 'next/router';
import { IStateType, educationFamilyItf, IInvReason } from "../../../interfaces/employees.interface";

import { PageHeader, Table, Button, Card, Form, Row, Col, Input, Select, InputNumber } from "antd"

import DashboardLayout from "../../../components/layouts/Dashboard";
import Notifications from "../../../components/Notifications";

import { pageCheck } from "../../../lib/helper";
import { save, edit, findOne, deleteEmployee, findEdu, findFam, getNewEmpId, getLastId } from "../../api/master/employees/list";
import { sortMenus, menuLeftAccessV2 } from "../../api/menu/list";
import { showConfirm } from "../../../components/modals/ModalAlert";
import { useApp } from "../../../context/AppContext";
import { masterDepartment, masterDivision, masterMarriage, masterRelation, masterCompany, masterReligion, masterPosition, masterLevel, masterEmployee, masterEducation, masterShift } from "../../api/master/index";
import AddItem from "./_additem";
import moment from "moment";

const formatNumber = (number: number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const { Option } = Select;

const DetailEmployee = (props: any) => {
    const [ form ] = Form.useForm()
    const router = useRouter();
    const { setSubmitNotif } = useApp();
    const [container, setContainer] = useState()
    const [states, setStates] = useReducer((state: IStateType, newState: Partial<IStateType>) => ({ ...state, ...newState }), props)

    const handleChangeSelect = (value: string, option: any) => {
        const name = option.name
        setStates({
            form: {
                ...states.form,
                [name]: value
            }
        });
    };
    
    const handleEnter = (data: any) => {
        setStates({ 
            form: {
                ...states.form,
                ktp: data.data 
            }
        })
        handleSearchKtp(data.data)
    }
    
    const handleSearchKtp = async (data: any) => {
        const res = await getSearchKtp(data)
        if (res.status !== 404) {
            const region = res.region
            const date = res.date
            setStates({
                form: {
                    ...states.form,
                    regionCode: parseInt(region.districtCode),
                    province_id: parseInt(region.provinceCode),
                    district_id: parseInt(region.districtCode),
                    regency_id: parseInt(region.regencyCode),
                    province: region.province,
                    regency: region.regency,
                    district: region.district,
                    age: date.age,
                    gender: date.gender,
                    birth: date.lahir,
                    ktp: data
                }
            })
        }
    }

    useEffect(() => {
        let data = states.form 
        if (router.query.type != "delete") {
            form.setFieldsValue({
                regionCode:data.regionCode,
                province_id:data.province_id,
                district_id:data.district_id,
                regency_id:data.regency_id,
                province: data.province,
                regency: data.regency,
                district: data.district,
                age: data.age,
                gender: data.gender,
                birth: data.birth,
                ktp: data.ktp
            })
        }      
    }, [form, states.form])

    useEffect(() => {
        form.setFieldsValue(states.form)
    }, [form, states.form])
    
    const handleOpenModal = (e: any) => {
        if (e.mode === "edit") {
            setStates({
                [e.name]: e.value,
                editList: e.data,
                modalFor: e.modalFor,
                relationship: states.master.relationship,
            });
        } else {
            if(e.name === "modalDupes") {
                if(e.isValid === true) {
                    setStates({
                        entryCondition: {
                            duplicateImg: [],
                            isValid: '1',
                            isDuplicate: 0,
                            replyId: 0,
                            invalidId: 0,
                            invalidReason: "",
                        }
                    })
                }
            }
            setStates({
                [e.name]: e.value,
                editList: "",
                modalFor: e.modalFor,
                relationship: states.master.relationship,
            });
        }
    };

    const [disable, setDisable] = React.useState(false);
    
    const handleProduct = async (data: any, modalFor: string, action: string) => {
        setStates({
            isChecked: false,
        });
        let { dataTable } = states;
        
        if (data.action === "add") {
            if (data.modalFor === "edu") {
                dataTable.education.push(data.data);
            }
            
            if (data.modalFor === "fam") {
                dataTable.family.push(data.data);
            }
        }
        
        if (data.action === "edit") {
            if (modalFor === "fam") {
                dataTable.family.splice(data.key, 1);
                dataTable.family.push(data.data);
            }
            
            if (modalFor === "edu") {
                dataTable.education.splice(data.key, 1);
                dataTable.education.push(data.data);
            }
        }
        
        setStates({
            dataTable,
        });

        if (action === "delete") {
            if (router.query.type == "update") {
                if (modalFor === "fam") {
                    let family = [...states.dataTable.family];
                    let fam = {...family[data.data.key]};
                    fam.type = "delete";
                    family[data.data.key] = fam;

                    setStates({
                        ...states, 
                        dataTable: {
                            ...states.dataTable,
                            family
                        }
                    });
                    //setDisable(true)
                }

                if (modalFor === "edu") {
                    let education = [...states.dataTable.education];
                    let edu = {...education[data.data.key]};
                    edu.type = "delete";
                    education[data.data.key] = edu;

                    setStates({
                        ...states, 
                        dataTable: {
                            ...states.dataTable,
                            education
                        }
                    });
                    //setDisable(true)
                }
            } else {
                if (modalFor === "fam") {
                    dataTable.family.splice(data.data.key, 1);
                }
                
                if (modalFor === "edu") {
                    dataTable.education.splice(data.data.key, 1);
                }
                
                setStates({
                    dataTable,
                });
            }                
        }
        document.getElementById("buttonAddItem")?.focus();
    };

    useEffect(() => {
        setContainer(document.getElementById("containerImage") as any)
    }, [])
    
    
    const submitAdd = async (vl: any) => {
        const { dataTable, userId } = states
        let status = 1;
        if (vl.resign_date === "Invalid date") {
            vl.resign_date = ""
        }
        if (vl.resign_date) {
            status = 0;
        }
        
        const data = Buffer.from(JSON.stringify({...vl, ...dataTable, userId, status})).toString('base64');
        router.push(router.asPath + `?submit=${data}`)
    }
    const submitUpdate = async (vl: any) => {
        const { dataTable, userId } = states
        let status = 1;
        if (vl.resign_date === "Invalid date") {
            vl.resign_date = ""
        }
        if (vl.resign_date) {
            status = 0;
        }
        
        const data = Buffer.from(JSON.stringify({...vl, ...dataTable, id: router.query.id, userId, status})).toString('base64');
        router.push(router.asPath + `&submit=${data}`)
    }
    
    const submit = async (values: any) => {
        showConfirm({
            onOk: (router.query.type == 'add' ? () => submitAdd(values) : () => submitUpdate(values)) 
        })    
    }
    
    useEffect(() => {
        if (props.redirect) {
            const { type, message, description } = props.notif
            setSubmitNotif({type, message, description});
            router.push('/master/employees')
        }
        
        if (props.notif) {
            const { type, message, description } = props.notif
            Notifications(type, message, description)
            setSubmitNotif({type: "", message: "", description: ""})
            router.push({
                pathname: '/master/employees/' + router.query.type,
                query: router.query.type == "update" ? {id: router.query.id} : {}
            }, undefined, { shallow: true})
        }
    }, [props.notif])
    
    if (props.redirect) {
        return <></>
    }
    
    !states.dataTable.education ? [] : states.dataTable.education.forEach((i: any, index: any) => {
        i.key = index;
    });

    !states.dataTable.family ? [] : states.dataTable.family.forEach((i: any, index: any) => {
        i.key = index;
    });

    return (
        <>
            <PageHeader
                title="Employees Management"
                extra={[
                    <Button key="1"
                        onClick={() => form.submit()}
                        className={'button'}
                        shape="round"
                    >
                        Save
                    </Button>
                ]}
            />
            <Card title={router.query.type == 'add' ? "Add Employee" : "Edit Employee"} >
                <Form form={form} className={"form"} layout="vertical" onFinish={submit}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                label="ID Employee"
                                name="id_employee"
                            >
                                <Input
                                    placeholder="ID Employee" 
                                    className={"input"}
                                    disabled={true}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="KTP"
                                name="ktp"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Input
                                    type="number"
                                    placeholder="Code KTP" 
                                    className={"input"}
                                    onPressEnter={(data: any) => handleEnter({
                                    data: data.target.value,
                                    name: "ktp"
                                    })}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Company"
                                name="companyId"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    options={states.master.company}
                                    className={"select"}
                                    placeholder="Choose an option"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Age"
                                name="age"
                            >
                                <Input
                                    placeholder="Age"
                                    readOnly
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Fullname"
                                name="fullname"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Input
                                    placeholder="Fullname"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Gender"
                                name="gender"
                            >
                                <Input 
                                placeholder="Gender"
                                readOnly
                                className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Phone Number"
                                name="phone"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Input
                                    placeholder="Phone Number"
                                    type="number"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Birthdate"
                                name="birth"
                            >
                                <Input
                                    placeholder="Birthdate"
                                    readOnly
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Input
                                    placeholder="Email"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Province of ID Card"
                                name="province" 
                            >
                                <Input 
                                    placeholder="Province" 
                                    readOnly
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Religion Status"
                                name="religion_id"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    options={states.master.religion}
                                    className={"select"}
                                    placeholder="Choose an option"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="City of ID Card"
                                name="regency" 
                            >
                                <Input 
                                    placeholder="City" 
                                    readOnly
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Marriage Status"
                                name="marriage_id"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    options={states.master.marriage}
                                    className={"select"}
                                    placeholder="Choose an option"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="District of ID Card"
                                name="district"
                            >
                                <Input 
                                    placeholder="District" 
                                    readOnly
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="ID Card Address"
                                name="address_ktp"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Input.TextArea
                                    placeholder="Address"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Number of NPWP"
                                name="npwp"
                            >
                                <Input
                                    placeholder="Number of NPWP"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Domicile Address"
                                name="address"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Input.TextArea
                                    placeholder="Address"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Number of BPJS Kesehatan"
                                name="bpjskes"
                            >
                                <Input
                                    placeholder="Number of BPJS Kesehatan"
                                    type="number"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Emergency Contact"
                                name="emergency_contact"
                            >
                                <Input
                                    placeholder="Emergency Contact"
                                    type="number"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Number of BPJS Ketenagakerjaan"
                                name="bpjsket"
                            >
                                <Input
                                    placeholder="Number of BPJS Ketenagakerjaan"
                                    type="number"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Join Date"
                                name="join_date"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Input
                                    placeholder="Join Date"
                                    type="date"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Resign Date"
                                name="resign_date"
                            >
                                <Input
                                    placeholder="Resign Date"
                                    type="date"
                                    className={"input"}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Department"
                                name="dept_id"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    options={states.master.department}
                                    className={"select"}
                                    placeholder="Choose an option"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Division"
                                name="div_id"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    options={states.master.division}
                                    className={"select"}
                                    placeholder="Choose an option"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Job Position"
                                name="position_id"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    options={states.master.position}
                                    className={"select"}
                                    placeholder="Choose an option"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Job Level"
                                name="level_id"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    options={states.master.level}
                                    className={"select"}
                                    placeholder="Choose an option"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Supervisor"
                                name="approval_id"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    showSearch
                                    style={{ width: '100%' }}
                                    placeholder="Choose an option"
                                    className={"select"}
                                    optionFilterProp="children"
                                    filterOption={(input: any, option: any) =>  
                                        option.props.children.toUpperCase().indexOf(input.toUpperCase()) >= 0 || option.props.value.toString().toUpperCase().indexOf(input.toUpperCase()) >= 0
                                    }
                                >
                                    {states.master.employee.map((p: any) => <Option key={p.key.toString()} value={p.value}>{p.label}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Shift"
                                name="shift_id"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <Select
                                    options={states.master.shift}
                                    className={"select"}
                                    placeholder="Choose an option"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Saldo Cuti"
                                name="saldo_cuti"
                                rules={[
                                    {
                                      validator(_, value) {
                                        if (value < 0) {
                                          return Promise.reject("Cannot be less than 1");
                                        }
                                        if (value > 12) {
                                          return Promise.reject("Cannot be more than 12");
                                        }
                                        return Promise.resolve();
                                      },
                                    },
                                ]}
                            >
                                <Input
                                    type="number"
                                    className={"input"}
                                    placeholder="Saldo Cuti"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Plafon Pengobatan"
                                name="saldo_pengobatan"
                            >
                                <InputNumber
                                    style={{ width:`100%` }}
                                    className={"input"}
                                    formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value!.replace(/\Rp\s?|(,*)/g, '')}
                                    placeholder="Plafon Pengobatan"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item hidden name="regionCode">
                                <Input type="hidden" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item hidden name="province_id">
                                <Input type="hidden" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item hidden name="district_id">
                                <Input type="hidden" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item hidden name="regency_id">
                                <Input type="hidden" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <Form.Item label="LIST OF EDUCATION">
                                <Button
                                    style={{marginBottom: '2em'}}
                                    onClick={() =>
                                        handleOpenModal({ name: "modalAdd", value: true, modalFor: "edu" })
                                    }
                                    tabIndex={17}
                                >
                                    Add Education
                                </Button>
                                <Table
                                    size="middle"
                                    pagination={false}
                                    dataSource={[...states.dataTable.education.filter(item => item.type != "delete")]}
                                >
                                    <Table.Column 
                                        title="Education" 
                                        dataIndex="text_edu" 
                                        key="text_edu"
                                    />
                                    <Table.Column 
                                        title="School" 
                                        dataIndex="schoolModal" 
                                        key="schoolModal" 
                                    />
                                    <Table.Column 
                                        title="Major" 
                                        dataIndex="majorModal" 
                                        key="majorModal" 
                                    />
                                    <Table.Column 
                                        title="From (year)" 
                                        dataIndex="fromModal" 
                                        key="fromModal" 
                                    />
                                    <Table.Column 
                                        title="To (year)" 
                                        dataIndex="toModal" 
                                        key="toModal" 
                                    />
                                    <Table.Column
                                        title="Action"
                                        key="action"
                                        render={(text, record) => (
                                            <Button.Group>
                                                <Button
                                                    onClick={() =>
                                                        handleOpenModal({
                                                            name: "modalAdd",
                                                            mode: "edit",
                                                            data: record,
                                                            value: true,
                                                            modalFor: "edu",
                                                        })
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    disabled={disable}
                                                    onClick={() => handleProduct({ data: record}, "edu", "delete")}
                                                >
                                                    Delete
                                                </Button>
                                            </Button.Group>
                                        )}
                                    />
                                </Table>
                            </Form.Item>
                        </Col>
                    </Row>
                    <AddItem
                        header={
                            states.modalType == "Add" ? "Add Item" : states.modalType == "Edit" ? "Edit Item" : ""
                        }
                        open={states.modalAdd}
                        handleOpenModal={handleOpenModal}
                        handleAddItem={handleProduct}
                        editList={states.editList}
                        dataTable={states.dataTable}
                        modalFor={states.modalFor}
                        relationship={states.master.relationship}
                        education={states.master.education}
                    />
                    <Row>
                        <Col span={24}>
                            <Form.Item label="LIST OF FAMILY">
                                <Button
                                    style={{marginBottom: '2em'}}
                                    onClick={() =>
                                        handleOpenModal({ name: "modalAdd", value: true, modalFor: "fam" })
                                    }
                                    tabIndex={17}
                                >
                                    Add Family
                                </Button>
                                <Table
                                    size="middle"
                                    pagination={false}
                                    dataSource={[...states.dataTable.family.filter(item => item.type != "delete")]}
                                >
                                    <Table.Column 
                                        title="Name" 
                                        dataIndex="nameModal" 
                                        key="nameModal" 
                                    />
                                    <Table.Column 
                                        title="Relationship" 
                                        dataIndex="name" 
                                        key="name" 
                                    />
                                    <Table.Column 
                                        title="ID Card" 
                                        dataIndex="idcardModal" 
                                        key="idcardModal" 
                                    />
                                    <Table.Column 
                                        title="Gender" 
                                        dataIndex="genderModal" 
                                        key="genderModal" 
                                    />
                                    <Table.Column 
                                        title="Birthdate" 
                                        dataIndex="birthdateModal" 
                                        key="birthdateModal" 
                                    />
                                    <Table.Column
                                        title="Action"
                                        key="action"
                                        render={(text, record, index: number) => (
                                            <Button.Group>
                                                <Button
                                                    onClick={() =>
                                                        handleOpenModal({
                                                            name: "modalAdd",
                                                            mode: "edit",
                                                            data: record,
                                                            value: true,
                                                            modalFor: "fam",
                                                            idxData: index
                                                        })
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    onClick={() => handleProduct({ data: record}, "fam", "delete")}
                                                >
                                                    Delete
                                                </Button>
                                            </Button.Group>
                                        )}
                                    />
                                </Table>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </>
    )
}
            
const getSearchKtp = async (data: any) => {
    let res = await fetch(`/api/ktp/${data}`)
    if (res.status !== 404) {
        let dataList = await res.json()
        return dataList
    } else {
        return alert("Error 404")
    }
}
            
export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const types = ['add', 'update', 'modify', 'delete']
    const query: any = ctx.query
    const id: any = await getNewEmpId()
    const last: any = await getLastId(id[0].lastid)
    const num: number = parseInt(last[0].id_employee.substr(3)) + 1;
    const nextid: string = 'MIS' + num.toString().padStart(3, '0');
    var form = {
        id_employee: nextid,
        fullname: null,
        position_id: null,
        email: null,
        phone: null,
        ktp: null,
        emergency_contact: null,
        address: null,
        address_ktp: null,
        regionCode: null,
        province_id: null,
        regency_id: null,
        district_id: null,
        province: null,
        regency: null,
        district: null,
        age: null,
        gender: null,
        birth: null,
        npwp: null,
        bpjskes: null,
        bpjsket: null,
        join_date: null,
        marriage_id: null,
        religion_id: null,
        level_id: null,
        companyId: null,
        approval_id: null,
        dept_id: null,
        resign_date: null,
        shift_id: null,
        div_id: null,
        saldo_cuti: null,
        saldo_pengobatan: null,
    }
    
    var dataTable: educationFamilyItf = {
        education: [],
        family: [],
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
    const trueRole = await pageCheck(session.username, '/master/employees')
    //const getRole: any = await findOne({description: query.role as string, status: 0})

    if (trueRole.length < 1 || 
        (query.type == "add" && trueRole[0].m_insert == 0) ||
        (query.type == "delete" && trueRole[0].m_delete == 0) ||
        ((query.type == "modify" || query.type == "update") && trueRole[0].m_update == 0)
    ) {
        return {
            redirect: {
                destination: "/403",
                permanent: false
            }
        }
    }
    
    const deptMaster = await masterDepartment();
    const divMaster = await masterDivision();
    const marriageMaster = await masterMarriage();
    const relationMaster = await masterRelation() as IInvReason[];
    const compMaster = await masterCompany() as IInvReason;
    const religionMaster = await masterReligion() as IInvReason;
    const positionMaster = await masterPosition() as IInvReason;
    const levelMaster = await masterLevel() as IInvReason;
    const employeeMaster = await masterEmployee() as IInvReason;
    const educationMaster = await masterEducation() as IInvReason;
    const shiftMaster = await masterShift() as IInvReason;
    
    var access: {access: any, rawAccess: any} = {
        access: [],
        rawAccess: []
    }
    
    if (query.submit) {
        var param = JSON.parse(Buffer.from(query.submit, 'base64').toString('ascii'));
        if (query.type == 'modify') {
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
            const delEmployee: any = await deleteEmployee(param);
            if (delEmployee == 'error' || delEmployee.error) {
                return {
                    props: {
                        isLoading: false,
                        redirect: true,
                        notif: {
                            type: delEmployee.error.type,
                            message: delEmployee.error.message,
                            description: delEmployee?.error?.description 
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
        
        //add
        const saveEmployee: any = await save(param);
        if (saveEmployee == 'error' || saveEmployee.error) {
            return {
                props: {
                    isLoading: false,
                    notif: {
                        type: saveEmployee.error.type,
                        message: saveEmployee.error.message,
                        description: saveEmployee?.error?.description 
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
                    description: "New employee has been added"
                },
            }
        }
    }
    
    if (query.type == 'add') {
        access = await sortMenus(1);
        //form.access = access.rawAccess
    }
    
    if (query.type == 'modify') {
        if(query.id === undefined) {
            return {
                redirect: {
                    destination: "/master/employees",
                    permanent: false
                }
            }
        }
        const detailData: any = await findOne(query.id)
        const detailEdu: any = await findEdu(query.id)
        const detailFam: any = await findFam(query.id)

        const birth: any = detailData[0].birthdate ? moment(detailData[0].birthdate).format("YYYY-MM-DD") : null;
        const join_date: any = detailData[0].join_date ? moment(detailData[0].join_date).format("YYYY-MM-DD") : null;
        const resign_date: any = detailData[0].resign_date ? moment(detailData[0].resign_date).format("YYYY-MM-DD") : null;
        
        form.id_employee = detailData[0].id_employee
        form.fullname = detailData[0].fullname
        form.position_id = detailData[0].positionId
        form.email = detailData[0].email
        form.phone = detailData[0].phone
        form.ktp = detailData[0].ktp
        form.emergency_contact = detailData[0].emergency_contact
        form.address = detailData[0].address
        form.address_ktp = detailData[0].address_ktp
        form.province = detailData[0].province
        form.regency = detailData[0].regency
        form.district = detailData[0].district
        form.age = detailData[0].age
        form.gender = detailData[0].gender
        form.birth = birth
        form.npwp = detailData[0].npwp
        form.bpjskes = detailData[0].bpjskes
        form.bpjsket = detailData[0].bpjsket
        form.join_date = join_date
        form.marriage_id = detailData[0].marriageId
        form.religion_id = detailData[0].religionId
        form.companyId = detailData[0].companyId
        form.level_id = detailData[0].levelId
        form.approval_id = detailData[0].superiorId
        form.province_id = detailData[0].provincesId
        form.regency_id = detailData[0].regencysId
        form.district_id = detailData[0].districtsId
        form.dept_id = detailData[0].deptId
        form.resign_date = resign_date
        form.shift_id = detailData[0].shiftId
        form.div_id = detailData[0].divId
        form.saldo_cuti = detailData[0].saldo_cuti
        form.saldo_pengobatan = detailData[0].saldo_pengobatan
        
        if (detailEdu.length > 0) {
            let temp: any = []
            for (let index = 0; index < detailEdu.length; index++) {
                const element = detailEdu[index];
                temp = {
                    id: element.id,
                    educationId: element.educationId,
                    text_edu: element.text_edu,
                    schoolModal: element.school,
                    majorModal: element.major,
                    fromModal: element.start_year,
                    toModal: element.end_year,
                    type: "",
                };
                dataTable.education.push(temp)
            }
        }
        
        if (detailFam.length > 0) {
            let temp: any = []
            for (let index = 0; index < detailFam.length; index++) {
                const element = detailFam[index]
                temp = {
                    id: element.id,
                    name: element.name,
                    nameModal: element.namemodal,
                    relation: element.relation,
                    idcardModal: element.idcard,
                    genderModal: element.gender,
                    birthdateModal: moment(element.birthdate).format("YYYY-MM-DD"),
                    type: "",
                };
                dataTable.family.push(temp)
            }
        }
    }
    
    return {
        props: {
            master: {
                department: JSON.parse(JSON.stringify(deptMaster)),
                division: JSON.parse(JSON.stringify(divMaster)),
                marriage: JSON.parse(JSON.stringify(marriageMaster)),
                relationship: JSON.parse(JSON.stringify(relationMaster)),
                company: JSON.parse(JSON.stringify(compMaster)),
                religion: JSON.parse(JSON.stringify(religionMaster)),
                position: JSON.parse(JSON.stringify(positionMaster)),
                level: JSON.parse(JSON.stringify(levelMaster)),
                employee: JSON.parse(JSON.stringify(employeeMaster)),
                education: JSON.parse(JSON.stringify(educationMaster)),
                shift: JSON.parse(JSON.stringify(shiftMaster)),
            },
            access: {
                m_insert: trueRole[0].m_insert,
                m_update: trueRole[0].m_update,
                m_delete: trueRole[0].m_delete,
                m_view: trueRole[0].m_view
            },
            modalAdd: false,
            modalReject: false,
            modalDupes: false,
            entryCondition: {
                duplicateImg: []
            },
            whichModal: "",
            modalType: "",
            modalAddItem: "",
            dataTable: JSON.parse(JSON.stringify(dataTable)),
            editList: "",
            modalFor: "",
            isChecked: false,
            isLoading: false,
            form: JSON.parse(JSON.stringify(form)),
            userId,
        }
    }
}

DetailEmployee.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}

export default DetailEmployee;