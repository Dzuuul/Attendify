import React, { useEffect, useReducer } from "react";
import { Modal, Button, Row, Form, Select, Input, Col, Space } from "antd";
import { ConsoleSqlOutlined } from "@ant-design/icons";
import { string } from "prop-types";
import { AddItem } from "../../../interfaces/employees.interface";
import { showConfirm } from "../../../components/modals/ModalAlert";

let initState = {
    relationship: [],
    mst_education: [],
    key: '',
    textContent: '',
    text_edu: '',
    modalFor: '',
    dataTable: {
        education: {
            id: 0,
            schoolModal: '',
            majorModal: '',
            fromModal: 0,
            toModal: 0,
        },
        family: {
            id: 0,
            nameModal: "",
            relation: "",
            idcardModal: 0,
            genderModal: "",
            birthdateModal: "",
        }
    }
} as AddItem

const ModalAddItem = (props: any) => {
    const [ formModal ] = Form.useForm()
    const [states, setStates] = useReducer((state: AddItem, newState: Partial<AddItem>) => ({ ...state, ...newState }), props);
    
    const close = () => {
        props.handleOpenModal({ name: "modalAdd", value: false });
        setStates(initState);
    };

    useEffect(() => {
        formModal.setFieldsValue({
            textContent: states.textContent,
        })
    }, [formModal, states.textContent])

    useEffect(() => {
        formModal.setFieldsValue({
            text_edu: states.text_edu,
        })
    }, [formModal, states.text_edu])

    useEffect(() => {
        let data = states.dataTable.family        
        formModal.setFieldsValue({
            birthdateModal: data.birthdateModal,
            genderModal: data.genderModal,
        })
    }, [formModal, states.dataTable])
   
    useEffect(() => {
        const { relationship } = props
        if (relationship) {
            setStates({
                relationship
            })
        }
    }, [props.relationship])
    
    useEffect(() => {
        const { modalFor } = props
        if (modalFor) {
            setStates({
                modalFor
            })
        }
    }, [props.modalFor])
    
    useEffect(() => {
        let relationData = props.relationship;
        let selectedRelation: any = relationData.find(
            (e: any) => e.value === props.editList.relation
        );
        let educationData = props.education;
        let selectedEducation: any = educationData.find(
            (e: any) => e.value === props.editList.education
        );
        formModal.setFieldsValue(props.editList)
        formModal.setFieldsValue({
            textContent: selectedRelation === undefined ? "" : selectedRelation.label,
        })
        formModal.setFieldsValue({
            text_edu: selectedEducation === undefined ? "" : selectedEducation.label,
        })
    }, [formModal, props.editList])

    const handleChangeSelect = (name: any, e: any, value: any, text: any) => {
        setStates({
            [name]: value
        })
        if(e === "cat") {
            if (props.modalFor == "fam") {
                props.relationship(value)
                setStates({
                    dataTable: {
                        ...states.dataTable,
                        family: {
                            ...states.dataTable.family,
                            relation: '',
                        }
                    }
                })
                return
            }

            if (props.modalFor == "edu") {
                props.education(value)
                setStates({
                    dataTable: {
                        ...states.dataTable,
                        education: {
                            ...states.dataTable.education,
                            educationId: 0,
                        }
                    }
                })
                return
            }
        } else {
            if (props.modalFor == "fam") {
                let relationData = props.relationship;
                let selectedRelation: any = relationData.find(
                    (e: any) => e.value === value
                );
                
                setStates({
                    textContent: selectedRelation === undefined ? "" : selectedRelation.label
                });
                return
            }

            if (props.modalFor == "edu") {
                let educationData = props.education;
                let selectedEducation: any = educationData.find(
                    (e: any) => e.value === value
                );
                
                setStates({
                    text_edu: selectedEducation === undefined ? "" : selectedEducation.label
                });
                return
            }
        }
    }
        
    const handleEnter = (data: any) => {
        if (data.data.length < 16 || data.data.length > 16) {
            return alert("Please fill correct ID Card.")
        }
        if (data.data.length === 16) {            
            handleSearchKtp(data.data)
        }
    }
    
    const handleSearchKtp = async (data: any) => {
        const res = await getSearchKtp(data)
        if (res.status !== 404) {
            const date = res.date
            setStates({
                dataTable: {
                    ...states.dataTable,
                    family: {
                        ...states.dataTable.family,
                        idcardModal : data,
                        genderModal: date.gender,
                        birthdateModal: date.lahir,
                    }
                }
            })
        }
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

    const submit = async (values: any) => {
        if (props.modalFor == "edu") {
            let {
                id,
                educationId,
                text_edu,
                schoolModal,
                majorModal,
                fromModal,
                toModal,
            } = values

            let datas = {
                action: props.editList ? "edit" : "add",
                modalFor: props.modalFor,
                key: props.editList ? props.editList.key : 0,
                data: {
                    id: props.editList ? id : 0,
                    educationId: educationId,
                    text_edu: text_edu,
                    schoolModal: schoolModal,
                    majorModal: majorModal,
                    fromModal: fromModal,
                    toModal: toModal,
                    type: props.editList ? "edit" : "add",
                },
            };

            let datas2 = {
                action: props.editList ? "edit" : "add",
                modalFor: props.modalFor,
                key: props.editList ? props.editList.key : 0,
                data: {
                    id: props.editList ? id : 0,
                    educationId: educationId,
                    text_edu: text_edu,
                    schoolModal: schoolModal,
                    majorModal: majorModal,
                    fromModal: fromModal,
                    toModal: toModal,
                    type: props.editList ? "edit" : "add",
                },
            };
            if (schoolModal === "" || majorModal === "" || fromModal === 0 || toModal === 0) {
                return alert("Please Fill All Field");
            } else {
                props.editList ? props.handleAddItem(datas, props.modalFor) : props.handleAddItem(datas2, props.modalFor),
                close();
                return
            }
        }  

        if (props.modalFor == "fam") {
            let {
                id,
                nameModal,
                relation,
                idcardModal,
                genderModal,
                birthdateModal,
                textContent,
            } = values

            let datas = {
                action: props.editList ? "edit" : "add",
                modalFor: props.modalFor,
                key: props.editList ? props.editList.key : 0,
                data: {
                    id: props.editList ? id : 0,
                    nameModal: nameModal,
                    relation: relation,
                    idcardModal: idcardModal,
                    genderModal: genderModal,
                    birthdateModal: birthdateModal,
                    name: textContent,
                    type: props.editList ? "edit" : "add",
                },
            };

            let datas2 = {
                action: props.editList ? "edit" : "add",
                modalFor: props.modalFor,
                key: props.editList ? props.editList.key : 0,
                data: {
                    id: props.editList ? id : 0,
                    name: textContent,
                    nameModal: nameModal,
                    relation: relation,
                    idcardModal: idcardModal,
                    genderModal: genderModal,
                    birthdateModal: birthdateModal,
                    type: props.editList ? "edit" : "add",
                },
            };
            if (nameModal === "" || relation === "" || idcardModal === 0 || genderModal === ""  || birthdateModal === "") {
                alert("Please Fill All Field");
            } else {
                props.editList ? props.handleAddItem(datas, props.modalFor) : props.handleAddItem(datas2, props.modalFor),
                close();
            }
        }  
    }

    let formEducation: JSX.Element = (
        <>
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item 
                        label="Education"
                        name="educationId"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Select
                            className={"select"}
                            placeholder="- Select -"
                            options={props.education}
                            showSearch
                            onChange={(e, { value, text }: any) =>
                                handleChangeSelect("education", "educationId", value, e)
                            }
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item 
                        label="School Name"
                        name="schoolModal"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Input
                            placeholder="School Name"
                            className={"input"}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label="Major"
                        name="majorModal"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Input
                            placeholder="Major"
                            className={"input"}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label="From (year)"
                        name="fromModal"
                        rules={[
                            {
                              required: true,
                              message: "Required, cannot be empty!",
                            },
                            () => ({
                              validator(_, value) {
                                if (!value) {
                                  return Promise.reject();
                                }
                                if (value < 1000) {
                                  return Promise.reject("Please check again your input data");
                                }
                                return Promise.resolve();
                              },
                            }),
                        ]}
                    >
                        <Input
                            placeholder="Start (Year)"
                            type="number"
                            className={"input"}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label="To (year)"
                        name="toModal"
                        rules={[
                            {
                              required: true,
                              message: "Required, cannot be empty!",
                            },
                            () => ({
                              validator(_, value) {
                                if (!value) {
                                  return Promise.reject();
                                }
                                if (value < 1000) {
                                  return Promise.reject("Please check again your input data");
                                }
                                return Promise.resolve();
                              },
                            }),
                        ]}
                    >
                        <Input
                            placeholder="End (Year)"
                            type="number"
                            className={"input"}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item hidden name="id">
                        <Input type="hidden" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item hidden name="text_edu">
                        <Input type="hidden" />
                    </Form.Item>
                </Col>
            </Row>
        </>
    )
            
    let formFamily: JSX.Element = (
        <>
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item
                        label="Name" 
                        name="nameModal"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Input
                            className={"input"}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item 
                        label="Relationship"
                        name="relation"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Select
                            className={"select"}
                            placeholder="- Select -"
                            options={props.relationship}
                            showSearch
                            onChange={(e, { value, text }: any) =>
                                handleChangeSelect("relation", "relationship", value, e)
                            }
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label="ID Card"
                        name="idcardModal"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Input
                            type="number"
                            placeholder="Code KTP"
                            className={"input"}
                            onPressEnter={(data: any) => handleEnter({
                                data: data.target.value || states.dataTable.family.idcardModal,
                                name: "idcardModal"
                            })}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label="Gender"
                        name="genderModal"
                    >
                        <Input 
                            placeholder="Gender" 
                            readOnly
                            className={"input"}
                        />
                    </Form.Item>
                    </Col>
                <Col span={24}>
                    <Form.Item
                        label="Birthdate"
                        name="birthdateModal"
                    >
                        <Input
                            placeholder="Birthdate"
                            readOnly
                            className={"input"}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item hidden name="textContent">
                        <Input type="hidden" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item hidden name="id">
                        <Input type="hidden" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item hidden name="key">
                        <Input type="hidden" />
                    </Form.Item>
                </Col>
            </Row>
        </>
    )
            
    return (
        <Modal
            destroyOnClose
            title={props.header}
            className={"modal"}
            onCancel={close}
            centered
            footer={
                <Space size={0}>
                    <Button
                        onClick={() => formModal.submit()}
                        style={{ borderBottomLeftRadius: 8 }}
                    >
                        Save
                    </Button>
                    <Button
                        onClick={close}
                        style={{ backgroundColor: "#252733", borderBottomRightRadius: 8 }}
                    >
                        Cancel
                    </Button>
                </Space>
            }
            visible={props.open}
        >
            <Form
                form={formModal}
                className={"form"}
                layout="vertical"
                onFinish={submit}
                initialValues={states.dataTable}
                preserve={false}>
                {props.modalFor == "edu" ? (
                    formEducation
                ) : props.modalFor == "fam" ? (
                    formFamily
                ) : (
                    null
                )}
            </Form>
        </Modal>
    );
}

export default ModalAddItem;
                        