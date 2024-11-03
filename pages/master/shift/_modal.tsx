import React, { useEffect } from "react";
import { Modal, Button, Form, Col, Input, Row, Space, Select } from 'antd';
import moment from "moment";

const Modals = (props: any) => {
    const [ formModal ] = Form.useForm()

    const close = () => {
        props.handleOpenModal({ name: "openModal", value: false });
        formModal.resetFields()
    };

    useEffect(() => {
        const { data } = props
        if (data) {
            data.date = moment(data.date).format('YYYY-MM-DD');
        }
        
        formModal.setFieldsValue(props.data)
    }, [formModal, props.data])

    const submit = async (values: any) => {
        props.submit({ ...values })
    }

    let optionStatus = [
        { key: "1", name: "status", value: 1, label: "ENABLE" },
        { key: "0", name: "status", value: 0, label: "DISABLE" }
    ];

    let optionShift = [
        { key: "1", name: "normal_shift", value: 1, label: "YES" },
        { key: "0", name: "normal_shift", value: 0, label: "NO" }
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
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item 
                            label="Normal Shift" 
                            name="normal_shift"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Select
                                placeholder="Choose an option"
                                options={optionShift}
                                className={"select"}
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