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
import { modalState } from "../../../interfaces/department.interface"

let initialState = {
    data: [],
    isLoading: true,
    oldId: "",
    master: {
        employee: [],
    },
    form: {
        description: "",
        head: null,
        status: "",
        id: undefined
    }
};


const Modals = (props: any) => {
    const [ formModal ] = Form.useForm()
    const [states, setStates] = useReducer((state: modalState, newState: Partial<modalState>) => ({ ...state, ...newState }), initialState);

    const close = () => {
        props.handleOpenModal({ name: "openModal", value: false });
        setStates(initialState)
    };

    useEffect(() => {
        const { master } = props
        setStates({
            master: {
                ...states.master,
                employee: master.employee
            }
        })
    }, [props.master])

    const submit = async (values: any) => {
        props.submit({ ...values })
    }

    let optionStatus = [
        { key: "1", name: "status", value: 1, label: "Enable" },
        { key: "0", name: "status", value: 0, label: "Disable" }
    ];

    useEffect(() => {
        formModal.setFieldsValue(props.data)
    }, [formModal, props.data])

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

                    >Cancel</Button>
                </Space>
            }
            visible={props.open}
        >
            <Form 
                form={formModal}
                className={"form"}
                layout="vertical"
                onFinish={submit}
            >
                <Col span={24}>
                    <Form.Item 
                        label="Description"
                        name="description"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Input
                            type="text"
                            placeholder="Description"
                            className={"input"}
                        />
                    </Form.Item>
                </Col>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item 
                            label="Head Department" 
                            name="head"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Select
                                options={states.master.employee}
                                className={"select"}
                                placeholder="Choose an option"
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
                                options={optionStatus}
                                className={"select"}
                                placeholder="Choose an option"
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

// export default Modals;
export default React.memo(Modals);