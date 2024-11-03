import React, { useReducer, useEffect } from "react";
import {Modal, Button, Form, Col, Input, Row, Select, Space} from "antd";
import { modalState } from "../../../interfaces/approval_joint_leave.interface"

let initialState = {
    data: [],
    isLoading: true,
    oldId: "",
    master: {
        users: [],
        employee: [],
    },
    form: {
        userId: null,
        approvalId: null,
        status: null,
        id: undefined
    }
};


const Modals = (props: any) => {
    const [ formModal ] = Form.useForm()
    const [states, setStates] = useReducer((state: modalState, newState: Partial<modalState>) => ({ ...state, ...newState }), initialState);
    const children: any = [];

    const close = () => {
        props.handleOpenModal({ name: "openModal", value: false });
        setStates(initialState)
    };

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
        const { master } = props
        setStates({
            master: {
                ...states.master,
                users: master.users,
                employee: master.employee
            }
        })
    }, [props])

    const onSearch = (value: string) => {
        console.log('search:', value);
    };

    const filterOption = (inputValue: any, option: any) => {
        const { label, value } = option;
        const otherKey = states.master.users.filter(
        //   (opt: any) => opt.label === label.toUpperCase() && opt.value.toString().includes(inputValue)
          (opt: any) => opt.label === label.toUpperCase()
        );
        return value.toString().includes(inputValue) || otherKey.length > 0;
    };

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
                        label="Username"
                        name="userId"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Select
                            showSearch
                            onSearch={onSearch}
                            filterOption={filterOption}
                            // filterOption={(inputValue, option) =>
                            //     option?.children.join('').toLowerCase().includes(inputValue.toLowerCase())
                            // }
                            options={states.master.users}
                            className={"select"}
                            placeholder="Choose an option"
                        >
                            {/* {states.master.users.includes("ALL") ? "ALL" : children} */}
                            {/* {states.master.users.map((options: any) => (
                                <Option key={options.value}>{options.label}</Option>
                            ))} */}
                        </Select>
                    </Form.Item>
                </Col>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item 
                            label="Approval" 
                            name="approvalId"
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