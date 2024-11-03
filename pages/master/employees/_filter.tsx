import React, { useReducer, useRef, useEffect } from "react";
import { Modal, Button, Row, Form, Select, Col, Space } from "antd";

interface IState {
    department: string | null
    company: string | null
    master: {
        department: any
        company: any
    }
}

let initialState = {
    department: null,
    company: null,
    master: {
        department: [],
        company: []
    },
};

const Modals = React.memo((props: any) => {
    const [ formModal ] = Form.useForm()
    const prevProps = useRef(props)
    const [states, setStates] = useReducer((state: IState, newState: Partial<IState>) => ({ ...state, ...newState }), initialState)
    
    const handleSubmit = async (values: any) => {
        if (values.department == undefined) {
            values.department = null;
        }
        if (values.company == undefined) {
            values.company = null;
        }
        props.handleFilter({ ...values })
    }

    const handleReset = () => {
        props.resetFilter();
        setStates(initialState);
    }

    useEffect(() => {
        if (!props.dataModal.company) {
            props.dataModal.company = null
        }
        if (!props.dataModal.department) {
            props.dataModal.department = null
        }
        
        formModal.setFieldsValue(props.dataModal)
    }, [formModal, props.dataModal])

    const masterData = async () => {
        const { dept, company } = props.master 
        setStates({
            master: {
                department: dept,
                company: company
            }
        });
    };
        
    useEffect(() => {
        if (props.master) {
            masterData();
        }
    }, [props]);

    const close = () => {
        props.handleOpenModal({ name: "openModal", value: false });
    };

    let optionStatus = [
        { key: "", name: "status", value: "", label: "ALL" },
        { key: "1", name: "status", value: 1, label: "ACTIVE" },
        { key: "0", name: "status", value: 0, label: "INACTIVE" }
    ];

    return (
        <Modal
            destroyOnClose
            title="Filter Employee"
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
                            label="Department" 
                            name="department"
                        >
                            <Select
                                options={states.master.department}
                                className={"select"}
                                placeholder="Choose an option"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item 
                            label="Company" 
                            name="company"
                        >
                            <Select
                                options={states.master.company}
                                className={"select"}
                                placeholder="Choose an option"
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
                            options={optionStatus}
                            className={"select"}
                            placeholder="Choose an option"
                        />
                    </Form.Item>
                </Col>
            </Form>
        </Modal>
    );
})

Modals.displayName = "FilterModal"
export default Modals
