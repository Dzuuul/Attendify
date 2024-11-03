import React, { useReducer, useEffect } from "react";
import Modal from "antd/lib/modal";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Col from "antd/lib/col";
import Input from "antd/lib/input";
import Row from "antd/lib/row";
import Space from "antd/lib/space";
import Select from "antd/lib/select";
import { modalState } from "../../../interfaces/request_type.interface";
import moment from "moment";

let initialState = {
    data: [],
    isLoading: true,
    form: {
        description: "",
        tipe: null,
        need_apprv: null,
        day_limit: 0,
        desc_index: "",
        status: "",
        id: undefined,
    },
    inputDisabled: false,
};

const Modals = (props: any) => {
    const [ formModal ] = Form.useForm()
    const [states, setStates] = useReducer((state: modalState, newState: Partial<modalState>) => ({ ...state, ...newState }), initialState);

    const close = () => {
        props.handleOpenModal({ name: "openModal", value: false });
        setStates(initialState)
    };
    
    useEffect(() => {
        setStates({
            inputDisabled: props.inputDisabled,
        })
    }, [states.inputDisabled, props.inputDisabled])

    useEffect(() => {
        const { data } = props
        setStates({
            form: {
                ...states.form,
                ...data
            }
        })
    }, [props.data])

    useEffect(() => {
        formModal.setFieldsValue(states.form)
    }, [states.form])

    const submit = async (values: any) => {
        props.submit({ ...values })
    }

    let optionStatus = [
        { key: "1", name: "status", value: 1, label: "ENABLE" },
        { key: "0", name: "status", value: 0, label: "DISABLE" }
    ];

    let optionTipe = [
        { key: "1", name: "tipe", value: 1, label: "HADIR" },
        { key: "2", name: "tipe", value: 2, label: "TIDAK HADIR" },
        { key: "3", name: "tipe", value: 3, label: "TIDAK POTONG CUTI" }
    ];

    let optionApproval = [
        { key: "1", name: "need_apprv", value: 1, label: "YES" },
        { key: "0", name: "need_apprv", value: 0, label: "NO" }
    ];
    
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
                initialValues={states.form}
            >
                <Col span={24}>
                    <Form.Item 
                        label="Description" 
                        name="description"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Input
                            placeholder="Description"
                            className={"input"}
                        />
                    </Form.Item>
                </Col>
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item 
                            label="Type" 
                            name="tipe"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Select
                                placeholder="Choose an option"
                                options={optionTipe}
                                className={"select"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item 
                            label="Need Approval" 
                            name="need_apprv"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Select
                                placeholder="Choose an option"
                                options={optionApproval}
                                className={"select"}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item 
                            label="Day Limit" 
                            name="day_limit"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Input
                                type="number"
                                placeholder="Day Limit"
                                className={"input"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item 
                            label="Initial" 
                            name="desc_index"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Input
                                placeholder="Initial"
                                className={"input"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item 
                            label="Status" 
                            name="status"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Select
                                placeholder="Choose an option"
                                options={optionStatus}
                                className={"select"}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Col span={12}>
                    <Form.Item hidden name="id">
                        <Input type="hidden" />
                    </Form.Item>
                </Col>
            </Form>
        </Modal>
    )
}

export default React.memo(Modals);