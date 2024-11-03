import React, { useReducer, useEffect } from "react";
import Modal from "antd/lib/modal";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Col from "antd/lib/col";
import Input from "antd/lib/input";
import Row from "antd/lib/row";
import { List } from 'antd';
import Space from "antd/lib/space";
import { modalState } from "../../../interfaces/reimbursement.interface"
import moment from "moment";

function txtShrtr(text: string, length: number) {
    if (text == null) {
        return "";
    }
    if (text.length <= length) {
        return text;
    }
    text = text.substring(0, length);
    let last = text.lastIndexOf(" ");
    text = text.substring(0, last);
    return text + "...";
  }

let initialState = {
    data: [],
    isLoading: true,
    items: [],
    form: {
        type: "",
        title: '',
        amount: 0,
        receipt_date: "",
        description: "",
        id: undefined
    }
};

const Modals = (props: any) => {
    const [formModal] = Form.useForm()
    const [states, setStates] = useReducer((state: modalState, newState: Partial<modalState>) => ({ ...state, ...newState }), initialState);

    const close = () => {
        props.handleOpenView({ name: "openView", value: false });
        setStates(initialState)
    };

    useEffect(() => {
        const { data } = props
        setStates({
            form: {
                ...states.form,
                type: data.type,
                title: data.title,
                receipt_date: moment(props.data.receipt_date).format('DD-MM-YYYY'),
                description: data.description,
                amount: data.amount,
                need_approve: data.need_approve,
                status_approve: data.status_approve,
                reject: data.reject
            }
        })
    }, [props.data])

    useEffect(() => {
        const { form } = states
        formModal.setFieldsValue(form)
    }, [formModal, states.form])
let amont = states.form.amount
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
                    <Col span={12}>
                        <Form.Item
                            label="Reimburse Type"
                            name="type"
                        >
                            <Input
                                className={"input"}
                                readOnly
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Reimburse Name"
                            name="title"
                        >
                            <Input
                                className={"input"}
                                readOnly
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                    <Form.Item
                        label="Reimburse Description"
                        name="description"
                    >
                        <Input
                            className={"input"}
                            readOnly
                        />
                    </Form.Item>
                </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Purchase Date"
                            name="receipt_date"
                        >
                            <Input
                                className={"input"}
                                readOnly
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="Reimburse Amount"
                            name="amount"
                        >
                            <Input
                                className={"input"}
                                readOnly
                            />
                        </Form.Item>
                    </Col>
                
                
                </Row>
                <Row gutter={24}>
                    <Col span={15}>
                        <Form.Item
                            label="Approval From"
                            name="need_approve"
                        >
                            <List
                                size="small"
                                dataSource={states.form.need_approve}
                                renderItem={item => <List.Item>{txtShrtr(item as string, 18)}</List.Item>}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={9}>
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