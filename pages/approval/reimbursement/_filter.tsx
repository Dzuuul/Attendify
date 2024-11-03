import React, { useReducer, useRef, useEffect } from "react";
import { Modal, Button, Row, Form, Select, Col, Space, Input } from "antd";
import moment from "moment";

const { Option } = Select

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

    let optionsStatus = [
        { key: "1", name: "isApproved", value: '', label: "All" },
        { key: "2", name: "isApproved", value: 0, label: "Rejected" },
        { key: "3", name: "isApproved", value: 1, label: "Approved" },
        { key: "4", name: "isApproved", value: 2, label: "Reimbursement Ready" },
        { key: "5", name: "isApproved", value: 3, label: "Confirmed By Requester" },
        { key: "6", name: "isApproved", value: 4, label: "Completed" },
        { key: "7", name: "isApproved", value: 5, label: "Processed" },
        { key: "8", name: "isApproved", value: 6, label: "Need Approval" },
      ];

    return (
        <Modal
            destroyOnClose
            title={props.header}
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
                    <Col span={24}>
                    <Form.Item 
                        label="Status"
                        name="isApproved"
                    >
                      <Select
                        // name="status"
                        className={"select"}
                        placeholder="Choose an option"
                      >
                        {optionsStatus.map((item: any, idx: number) => (
                            <Option key={idx} value={item.value}>{item.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
})

Modals.displayName = "FilterModal"
export default Modals
