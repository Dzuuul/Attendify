import React, { useReducer, useEffect } from "react";
import { OptionData, OptionGroupData, OptionsType } from "rc-select/lib/interface"
import Modal from "antd/lib/modal";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Col from "antd/lib/col";
import Input from "antd/lib/input";
import Row from "antd/lib/row";
import Select from "antd/lib/select";
import Space from "antd/lib/space";
import { modalState } from "../../../interfaces/marriage_status.interface"

let initialState = {
    data: [],
    isLoading: true,
    form: {
        description: "",
        status: "",
        id: undefined
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
        formModal.setFieldsValue(props.data)
    }, [formModal, props.data])

    useEffect(() => {
        formModal.setFieldsValue(states.form)
    }, [formModal, states.form])

    let optionStatus = [
        { key: "1", name: "status", value: 1, label: "Enable" },
        { key: "0", name: "status", value: 0, label: "Disable" }
    ];

    const submit = async (values: any) => {
        props.submit({ ...values })
    }

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
                <Row gutter={12}>
                    <Col span={12}>
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
                    <Col span={12}>
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
                    <Col span={12}>
                        <Form.Item hidden name="id">
                            <Input type="hidden" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

export default React.memo(Modals);