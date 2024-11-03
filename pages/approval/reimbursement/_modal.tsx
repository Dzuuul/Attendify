import React, { useReducer, useEffect } from "react";
import Modal from "antd/lib/modal";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Col from "antd/lib/col";
import Input from "antd/lib/input";
import Row from "antd/lib/row";
import Space from "antd/lib/space";
import Select from "antd/lib/select";
import { modalState } from "../../../interfaces/approval_reimbursement.interface";

let initialState = {
    isLoading: true,
    form: {
        requestId: "",
        requestTypeId: "",
        id: "",
    },
    inputDisabled: true
};

const Modals = (props: any) => {
    const [ formModal ] = Form.useForm()
    const [states, setStates] = useReducer((state: modalState, newState: Partial<modalState>) => ({ ...state, ...newState }), initialState);

    const close = () => {
        props.handleOpenModal({ name: "modalReject", value: false });
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
                <Col span={24}>
                    <Form.Item 
                        label="Reason Reject" 
                        name="reject"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Reason Reject"
                            className={"input"}
                        />
                    </Form.Item>
                </Col>
            </Form>
        </Modal>
    )
}

export default React.memo(Modals);