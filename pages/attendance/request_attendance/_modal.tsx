import React, { useReducer, useEffect } from "react";
import Modal from "antd/lib/modal";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Col from "antd/lib/col";
import Input from "antd/lib/input";
import Row from "antd/lib/row";
import { List } from 'antd';
import Space from "antd/lib/space";
import { modalState } from "../../../interfaces/request_attendance.interface"
import moment from "moment";

let initialState = {
    data: [],
    isLoading: true,
    form: {
        type: "",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        description: "",
        id: undefined
    }
};

const Modals = (props: any) => {
    const [ formModal ] = Form.useForm()
    const [states, setStates] = useReducer((state: modalState, newState: Partial<modalState>) => ({ ...state, ...newState }), initialState);

    const close = () => {
        props.handleOpenView({ name: "openView", value: false });
        setStates(initialState)
    };

    useEffect(() => {
        const { dataView } = props
        setStates({
            form: {
                ...states.form,
                type: dataView.type,
                start_date: moment(props.dataView.start_date).format('DD-MM-YYYY'),
                end_date: moment(props.dataView.end_date).format('DD-MM-YYYY'),
                start_time: moment(props.dataView.start_time, 'HH:mm:ss').format('HH:mm'),
                end_time: moment(props.dataView.end_time, 'HH:mm:ss').format('HH:mm'),
                description: dataView.description,
                need_approve: dataView.need_approve,
                status_approve: dataView.status_approve,
                reject: dataView.reject
            }
        })
    }, [props.dataView])

    useEffect(() => {
        const { form } = states
        formModal.setFieldsValue(form)
    }, [formModal, states.form])

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
                        onClick={close}
                        style={{ backgroundColor: "#252733", borderBottomRightRadius: 8 }}

                    >Close</Button>
                </Space>
            }
            visible={props.open}
        >
            <Form 
                form={formModal}
                className={"form"}
                layout="vertical"
            >
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item 
                            label="Request Type" 
                            name="type"
                        >
                            <Input
                                className={"input"}
                                readOnly
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item 
                            label="Start Date" 
                            name="start_date"
                        >
                            <Input
                                className={"input"}
                                readOnly
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item 
                            label="End Date" 
                            name="end_date"
                        >
                            <Input
                                className={"input"}
                                readOnly
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item 
                            label="Start Time" 
                            name="start_time"
                        >
                            <Input
                                className={"input"}
                                readOnly
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item 
                            label="End Time" 
                            name="end_time"
                        >
                            <Input
                                className={"input"}
                                readOnly
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Col span={24}>
                    <Form.Item 
                        label="Request Description" 
                        name="description"
                    >
                        <Input
                            className={"input"}
                            readOnly
                        />
                    </Form.Item>
                </Col>
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item 
                            label="Approval From" 
                            name="need_approve"
                        >
                            <List
                                size="small"
                                dataSource={states.form.need_approve}
                                renderItem={item => <List.Item>{item as String}</List.Item>}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item 
                            label="Status Approval" 
                            name="status_approve"
                        >
                            <List
                                size="small"
                                dataSource={states.form.status_approve}
                                renderItem={status => <List.Item>{status as String}</List.Item>}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Col span={24}>
                    <Form.Item 
                        label="Reason Reject" 
                        name="reject"
                    >
                        <Input.TextArea
                            rows={4}
                            className={"input"}
                            readOnly
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item hidden name="id">
                        <Input type="hidden" />
                    </Form.Item>
                    <Form.Item hidden name="order">
                        <Input type="hidden" />
                    </Form.Item>
                </Col>
            </Form>
        </Modal>
    )
}

// export default Modals;
export default React.memo(Modals);