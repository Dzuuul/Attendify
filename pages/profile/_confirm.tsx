import React, { useReducer, useEffect } from "react";
import { Popconfirm, Modal, Button, Form, Col, Input, Row, Space, message } from 'antd';
import { modalState } from "../../interfaces/profile.interface"

let initialState = {
    data: [],
    isLoading: true,
    form: {
        old_pass: "",
        new_pass: "",
        id: 0,
    },
    status: null,
    inputDisabled: false,
};


const Modals = (props: any) => {
    const [ formModal ] = Form.useForm()
    const [states, setStates] = useReducer((state: modalState, newState: Partial<modalState>) => ({ ...state, ...newState }), initialState);

    const close = () => {
        props.handleOpenModal({ name: "confirmModal", value: false });
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
                id: data
            }
        })
        formModal.setFieldsValue(props.data)
    }, [formModal, props.data])

    useEffect(() => {
        formModal.setFieldsValue(states.form)
    }, [formModal, states.form])

    const submit = async (values: any) => {
        if (states.status == false) {
            formModal.setFields([
                {
                  name: 'old_pass',
                  errors: ['Wrong Password'],
                },
            ]);
            return
        }
        props.submit({ ...values })
    }

    const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
        e.preventDefault()
        const { value } = e.currentTarget
        if (value.length === 8) {
            handleVerifyPass(value);
        }
    };

    const handleVerifyPass = async (data: any) => {
        const res = await verifyOldPass(data)
        setStates({
            status: res
        })
        if (res == false) {
            formModal.setFields([
                {
                  name: 'old_pass',
                  errors: ['Wrong Password'],
                },
            ]);
            return
        }
        return
    }
    
    const verifyOldPass = async (data: any) => {
        let res = await fetch(`/api/change_password/${data}`)
        if (res.status !== 404) {
            let dataList = await res.json()
            return dataList
        } else {
            return alert("Error 404")
        }
    }

    //const confirm = () => {
    //    message.info('Clicked on Yes.');
    //};

    return (
        <Modal
            destroyOnClose
            title={props.header}
            className={"modal"}
            onCancel={close}
            centered
            footer={
                <Space size={0}>
                    {/*<Popconfirm placement="top" title={"Are you sure want to change password?"} onConfirm={confirm} okText="Yes" cancelText="No">*/}
                        <Button
                            onClick={() => formModal.submit()}
                            style={{ borderBottomLeftRadius: 8 }}
                            >
                            Save
                        </Button>
                    {/*</Popconfirm>*/}
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
                    <Col span={24}>
                        <Form.Item 
                            label="Input your current password" 
                            name="old_pass"
                            rules={[
                                {
                                  required: true,
                                  message: "Required, cannot be empty!",
                                }
                            ]}
                        >
                            <Input.Password
                                placeholder="Current Password"
                                type="password"
                                maxLength={8}
                                className={"input"}
                                onChange={handleChange}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

export default React.memo(Modals);