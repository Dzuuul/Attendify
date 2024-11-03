import React, { useReducer, useRef, useEffect } from "react";
import { Modal, Button, Row, Form, Select, Col, Space, Input } from "antd";

interface IState {
    startDate?: any;
    endDate?: any;
    status: string | number;
}

let initialState = {
    startDate: '',
    endDate: '',
    status: '',
};

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

const Modals = React.memo((props: any) => {
    const [formModal] = Form.useForm()
    const prevProps = useRef(props)
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), initialState)

    useEffect(() => {
        formModal.setFieldsValue(states)
    }, [formModal, states])

    const handleSubmit = async (values: any) => {
        props.handleFilter({ ...values })
    }

    const handleReset = () => {
        props.resetFilter();
        setStates(initialState);
    }

    const close = () => {
        props.handleOpenModal({ name: "openFilter", value: false });
    };

    let optionStatus = [
        { key: "1", name: "status", value: '', label: "All" },
        { key: "2", name: "status", value: 0, label: "Rejected" },
        { key: "3", name: "status", value: 1, label: "Approved" },
        { key: "4", name: "status", value: 'null', label: "Not Approved" }
    ];

    return (
        <Modal
            destroyOnClose
            title="Filter Time Off"
            centered
            onCancel={close}
            className={"modal"}
            footer={
                <Space size={0}>
                    <Button
                        onClick={() => formModal.submit()}
                        style={{ borderBottomLeftRadius: 8 }}
                    >
                        Save
                    </Button>
                    <Button
                        onClick={handleReset}
                        style={{ backgroundColor: "#252733", borderBottomRightRadius: 8 }}
                    >
                        Reset
                    </Button>
                </Space>
            }
            visible={props.open}
        >
            <Form
                form={formModal}
                className={"form"}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item 
                            label="Start Date" 
                            name="startDate"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Input
                                type="date"
                                className={"input"}
                                placeholder="Start Date"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item 
                            label="End Date" 
                            name="endDate"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Input
                                type="date"
                                className={"input"}
                                placeholder="End Date"
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Col span={24}>
                    <Form.Item 
                        label="Status"
                        name="status"
                    >
                        <Select
                            className={"select"}
                            placeholder="Choose an option"
                            options={optionStatus}
                        />
                    </Form.Item>
                </Col>
            </Form>
        </Modal>
    );
})

Modals.displayName = "FilterModal"
export default Modals
