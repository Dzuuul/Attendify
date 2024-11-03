import React, { useEffect, useReducer } from "react";
import type { ReactElement } from 'react'
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import useSWR, { SWRConfig } from "swr";
import dynamic from "next/dynamic";
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router';
import { PageHeader, Card, Table, Button, Input, Form, Select, DatePicker } from "antd";
import DashboardLayout from "../../components/layouts/Dashboard";
import { pageCheck } from "../../lib/helper";
import { getData } from "../api/profile/list";
import { useApp } from "../../context/AppContext";
import { IState, educationFamilyItf } from "../../interfaces/profile.interface";
import Notifications from "../../components/Notifications";
import Row from "antd/lib/row";
import Col from "antd/lib/col";
import moment from "moment";
import { findOne, findEdu, findFam } from "../api/profile/list";
import { masterMarriage } from "pages/api/master";

const Modals = dynamic(() => import('./_modal'), { loading: () => <p></p> })
const ModalCnf = dynamic(() => import('./_confirm'), { loading: () => <p></p> })

const range = (start: any, end: any) => {
    const result = [];
    for (let i = start; i < end; i++) {
        result.push(i);
    }
    return result;
}

export const disabledDateTime = () => {
    return {
        disabledHours: () => range(0, 24).splice(4, 20),
        disabledMinutes: () => range(30, 60),
        disabledSeconds: () => [55, 56],
    };
}

const Profile = (props: any, { fallback }: any) => {
    const [form] = Form.useForm()
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), props)
    const router = useRouter();
    const { statesContex, setSubmitNotif } = useApp();

    const url = `/api/profile/list?page=${states.data.currentPage}&row=${states.data.dataPerPage}&column=${states.filter.columns}&direction=${states.filter.directions}`
    const { data, error } = useSWR(url)

    const handleOpenModal = (param: any) => {
        setStates({
            [param.name]: param.value,
            typeModal: param.typeModal,
            dataModal: param.dataModal ? param.dataModal : {}
        });
    }

    const submit = async (param: any) => {
        const data = Buffer.from(JSON.stringify(param)).toString('base64');
        router.push(`/profile/add?&submit=${data}`)
    }

    const handleChangeDate = async (data: any) => {
        if (data.value !== "Invalid Date") {
            await form.setFieldsValue({
                [data.name]: moment(data.value).format("YYYY-MM-DD")
            });
        }
    }

    const saveModified = (i: any) => {
        let datas = {
            id: i?.id,
            npwp: i?.npwp,
            phone: i?.phone,
            emergency_contact: i?.emergency_contact,
            marriage_id: i?.marriage_id,
            birth: i?.birth,
            address: i?.address
        }
        const data = Buffer.from(JSON.stringify(datas)).toString('base64');
        router.push(`/profile/modify?&submit=${data}`)
    }

    useEffect(() => {
        const { type, message, description } = statesContex.submitNotif
        Notifications(type, message, description)
        setSubmitNotif({ type: "", message: "", description: "" })
    }, [])

    useEffect(() => {
        if (data) {
            setStates({
                isLoading: false,
                data: {
                    ...states.data,
                    dataPerPage: data.dataPerPage,
                    currentPage: data.currentPage,
                    totalData: data.totalData,
                    totalPage: data.totalPage,
                    list: data.data,
                    key: states.data.key ? states.data.key : ""
                }
            })
        }
    }, [data])

    !states.dataTable.education ? [] : states.dataTable.education.forEach((i: any, index: any) => {
        i.key = 'Edu' + index;
    });

    !states.dataTable.family ? [] : states.dataTable.family.forEach((i: any, index: any) => {
        i.key = 'Fam' + index;
    });

    if (error) {
        return <p>Failed to load</p>
    }

    if (!data && !states.data) {
        setStates({ isLoading: true })
    }

    return (
        <>
            <SWRConfig value={{ fallback }}>
                <PageHeader
                    title="Profile"
                    extra={[
                        states.access.m_insert == 1 ?
                            <Row key="1">
                                <Col style={{ marginRight: '1em' }}>
                                    <Button
                                        onClick={() =>
                                            setStates({
                                                userModify: !states.userModify
                                            })
                                            // handleOpenModal({
                                            //     name: "openModal",
                                            //     value: true,
                                            //     typeModal: "Add",
                                            //     inputDisabled: false,
                                            // })
                                        }
                                        className={'button'}
                                        shape="round"
                                        disabled={states.userModify}
                                    >
                                        Edit Profile
                                    </Button>
                                </Col>
                                <Col>
                                    <Button
                                        onClick={() =>
                                            handleOpenModal({
                                                name: "openModal",
                                                value: true,
                                                typeModal: "Add",
                                                inputDisabled: false,
                                            })
                                        }
                                        className={'button'}
                                        shape="round"
                                    >
                                        Change Password
                                    </Button>
                                </Col>
                            </Row>
                            : null
                    ]}
                />
                <Card
                    className="custom-card"
                >
                    <Form form={form} onFinish={saveModified} className={"form"} layout="vertical" initialValues={states.form}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="ID Employee"
                                    name="id_employee"
                                >
                                    <Input
                                        placeholder="ID Employee"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="KTP"
                                    name="ktp"
                                >
                                    <Input
                                        type="number"
                                        placeholder="Code KTP"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Company"
                                    name="companyId"
                                >
                                    <Input
                                        placeholder="Company"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
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
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Fullname"
                                    name="fullname"
                                >
                                    <Input
                                        placeholder="Fullname"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
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
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Phone Number"
                                    name="phone"
                                >
                                    <Input
                                        placeholder="Phone Number"
                                        type="number"
                                        className={"input"}
                                        readOnly={states.inputDisabled && !states.userModify}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Birthdate"
                                    name="birth"
                                >
                                    {states.inputDisabled && !states.userModify ?
                                        <Input
                                            placeholder="Birthdate"
                                            className={"input"}
                                            readOnly={states.inputDisabled && !states.userModify}
                                        />
                                        :
                                        <>
                                            <DatePicker
                                                style={{ width: "100%" }}
                                                allowClear={false}
                                                disabledTime={disabledDateTime}
                                                format="YYYY-MM-DD"
                                                defaultValue={states.form.birth ? moment(states.form.birth) : undefined}
                                                onChange={(date) =>
                                                    handleChangeDate({
                                                        name: "birth",
                                                        value: date,
                                                    })
                                                }
                                            />
                                        </>
                                    }

                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Email"
                                    name="email"
                                >
                                    <Input
                                        placeholder="Email"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
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
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Religion Status"
                                    name="religion_id"
                                >
                                    <Input
                                        placeholder="Religion"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
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
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Marriage Status"
                                    name="marriage_id"
                                >
                                    {states.inputDisabled && !states.userModify ?
                                        <Select
                                            placeholder="Marriage"
                                            className={"select"}
                                            options={states.master.marriage}
                                            open={false}
                                        />
                                        :
                                        <Select
                                            placeholder="Marriage"
                                            className={"input"}
                                            options={states.master.marriage}
                                    />}
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="District of ID Card"
                                    name="district"
                                >
                                    <Input
                                        placeholder="District"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="ID Card Address"
                                    name="address_ktp"
                                >
                                    <Input.TextArea
                                        placeholder="Address"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
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
                                        className={ states.inputDisabled && !states.userModify ? "input" : "textarea" }
                                        readOnly={states.inputDisabled && !states.userModify}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Domicile Address"
                                    name="address"
                                >
                                    <Input.TextArea
                                        placeholder="Address"
                                        className={ states.inputDisabled && !states.userModify ? "input" : "textarea" }
                                        readOnly={states.inputDisabled && !states.userModify}
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
                                        readOnly={states.inputDisabled}
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
                                        readOnly={states.inputDisabled && !states.userModify}
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
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Join Date"
                                    name="join_date"
                                >
                                    <Input
                                        placeholder="Join Date"
                                        type="date"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
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
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Department"
                                    name="dept_id"
                                >
                                    <Input
                                        placeholder="Department"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                            <Form.Item
                                label="Division"
                                name="div_id"
                            >
                                <Input
                                    placeholder="Division"
                                    className={"input"}
                                    readOnly={states.inputDisabled}
                                />
                            </Form.Item>
                        </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Job Position"
                                    name="position_id"
                                >
                                    <Input
                                        placeholder="Job Position"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Job Level"
                                    name="level_id"
                                >
                                    <Input
                                        placeholder="Job Level"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Supervisor"
                                    name="approval_id"
                                >
                                    <Input
                                        placeholder="Supervisor"
                                        className={"input"}
                                        readOnly={states.inputDisabled}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item hidden name="id">
                                    <Input type="hidden" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <Form.Item label="LIST OF EDUCATION">
                                    <Table
                                        style={{ overflowX: 'scroll' }}
                                        size="middle"
                                        pagination={false}
                                        dataSource={[...states.dataTable.education]}
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
                                    </Table>
                                </Form.Item>
                            </Col>
                        </Row>
                        <br />
                        <Row>
                            <Col span={24}>
                                <Form.Item label="LIST OF FAMILY">
                                    <Table
                                        style={{ overflowX: 'scroll' }}
                                        size="middle"
                                        pagination={false}
                                        dataSource={[...states.dataTable.family]}
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
                                    </Table>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12}>
                                <Button
                                    hidden={!states.userModify}
                                    onClick={() => {
                                        form.setFieldsValue(states.form)
                                        setStates({
                                            userModify: !states.userModify
                                        })
                                    }
                                    }
                                    className={'button'}
                                    shape="round"
                                >
                                    Cancel
                                </Button>
                            </Col>
                            <Col span={12}>
                                <Button
                                    hidden={!states.userModify}
                                    // onClick={form.submit}
                                    onClick={() =>
                                        handleOpenModal({
                                            name: "confirmModal",
                                            value: true,
                                            typeModal: "Add",
                                            inputDisabled: false,
                                        })
                                    }
                                    className={'button'}
                                    shape="round"
                                >
                                    Save
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                    {/*<Table
                        style={{overflowX: 'scroll'}}
                        loading={states.isLoading}
                        dataSource={dataSource}
                        columns={states.columns}
                        size="middle"
                        pagination={{
                            current: states.data.currentPage as number,
                            total: states.data.totalData as number,
                            pageSize: states.data.dataPerPage as number
                        }}
                        onChange={handleTableChange}
                    />*/}
                </Card>
                <Modals
                    open={states.openModal}
                    header={"Change Password"}
                    handleOpenModal={handleOpenModal}
                    submit={submit}
                    data={states.form.id}
                    inputDisabled={states.typeModal == "Add" ? false : true}
                />
                <ModalCnf
                    open={states.confirmModal}
                    header={"Password Confirmation"}
                    handleOpenModal={handleOpenModal}
                    submit={form.submit}
                    // data={states.form.id}
                    inputDisabled={false}
                />
            </SWRConfig>
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    var form = {
        id: null,
        id_employee: null,
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
        div_id: null,
    }

    var dataTable: educationFamilyItf = {
        education: [],
        family: [],
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

    const trueRole = await pageCheck(session.username, ctx.resolvedUrl)

    if (trueRole.length < 1) {
        return {
            redirect: {
                destination: "/403",
                permanent: false
            }
        }
    }

    interface IPagination {
        row: string | number
        page: string | number
        key: string
        direction: string
        column: string
        limit: number | string
    }

    const params: IPagination = {
        row: 10,
        page: 0,
        key: "",
        direction: "",
        column: "",
        limit: ""
    }

    const getList = await getData(params);
    const data = {
        list: getList.data,
        key: ""
    }

    const detailData: any = await findOne(session.emp)
    const detailEdu: any = await findEdu(session.emp)
    const detailFam: any = await findFam(session.emp)

    const birth: any = detailData[0].birthdate ? moment(detailData[0].birthdate).format("YYYY-MM-DD") : null;
    const join_date: any = detailData[0].join_date ? moment(detailData[0].join_date).format("YYYY-MM-DD") : null;

    form.id_employee = detailData[0].id_employee
    form.fullname = detailData[0].fullname
    form.position_id = detailData[0].position
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
    form.religion_id = detailData[0].religion
    form.companyId = detailData[0].company
    form.level_id = detailData[0].level
    form.approval_id = detailData[0].superior
    form.province_id = detailData[0].provincesId
    form.regency_id = detailData[0].regencysId
    form.district_id = detailData[0].districtsId
    form.id = detailData[0].id
    form.dept_id = detailData[0].department
    form.div_id = detailData[0].division

    if (detailEdu.length > 0) {
        let temp: any = []
        for (let index = 0; index < detailEdu.length; index++) {
            const element = detailEdu[index];
            temp = {
                id: element.id,
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

    const mstMarriage: any = await masterMarriage()

    return {
        props: {
            fallback: {
                '/api/profile/list': JSON.parse(JSON.stringify(data))
            },
            data: JSON.parse(JSON.stringify(data)),
            master: {
                marriage: JSON.parse(JSON.stringify(mstMarriage))
            },
            columns: [],
            access: {
                m_insert: trueRole[0].m_insert,
                m_update: trueRole[0].m_update,
                m_delete: trueRole[0].m_delete,
                m_view: trueRole[0].m_view
            },
            isLoading: false,
            openModal: false,
            confirmModal: false,
            typeModal: "",
            dataModal: {},
            filter: {
                key: "",
                directions: "",
                columns: ""
            },
            dataTable: JSON.parse(JSON.stringify(dataTable)),
            form: JSON.parse(JSON.stringify(form)),
            inputDisabled: true,
            userModify: false,
        }
    }
}

export default Profile;

Profile.getLayout = function getLayout(page: ReactElement) {
    return (
        <DashboardLayout>{page}</DashboardLayout>
    )
}