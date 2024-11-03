import React, { useReducer, useRef, useEffect } from "react";
import { Modal, Button, Row, Form, Select, Col, Space, Input } from "antd";
import moment from "moment";

interface IState {
    startDate: any
    endDate: any
}

let initialState = {
    startDate: moment().startOf('month').format("YYYY-MM-DD"),
    endDate: moment().endOf('month').format("YYYY-MM-DD"),
};

const Modals = React.memo((props: any) => {
    const [ formModal ] = Form.useForm()
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), initialState)
    
    const handleSubmit = async (values: any) => {
        props.handleFilter({ ...values })
    }

    const handleReset = () => {
        props.resetFilter();
        setStates(initialState);
    }
    
    useEffect(() => {
        formModal.setFieldsValue(props.dataModal)
    }, [formModal, props.dataModal])

    const close = () => {
        props.handleOpenModal({ name: "openModal", value: false });
    };

    return (
        <Modal
            destroyOnClose
            title="Filter Request Attendance"
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
                        >
                            <Input
                                type="date"
                                className={"input"}
                                placeholder="End Date"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
})

Modals.displayName = "FilterModal"
export default Modals
