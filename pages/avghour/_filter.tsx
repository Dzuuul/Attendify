import React, { useReducer, useRef, useEffect } from "react";
import { Modal, Button, Row, Form, Select, Col, Space, DatePicker } from "antd";
import moment from "moment";

interface IState {
    startDate?: any;
    endDate?: any;
    day?: any;
    week?: any;
    month?: any;
    department: string | null
    company: string | null
    master: {
        dept: any
        comp: any
    }
}

let initialState = {
    startDate: '',
    endDate: '',
    day: moment(),
    week: moment(),
    month: moment(),
    department: null,
    company: null,
    master: {
        dept: [],
        comp: []
    }
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
        const { company, department } = props.master
        setStates({
            master: {
                ...states.master,
                dept: department,
                comp: company
            }
        })
    }, [props.master])

    useEffect(() => {
        setStates({
            department: props.data.department ? props.data.department : null,
            company: props.data.company ? props.data.company : null
        })
    }, [props.data])

    useEffect(() => {
        formModal.setFieldsValue(states)
    }, [formModal, states])

    const handleSubmit = async (values: any) => {
        values.month = states.month
        props.handleFilter({ ...values })
    }

    const handleReset = () => {
        props.resetFilter();
        setStates(initialState);
    }

    const handleChangeDate = async (data: any) => {
        if (data.value !== "Invalid Date") {
            await setStates({
                [data.name]: data.value,
            });
        } else {
            await setStates({
                [data.name]: "",
            });
        }
    }

    const close = () => {
        props.handleOpenModal({ name: "modalFilter", value: false });
    };

    return (
        <Modal
            destroyOnClose
            title="Filter Month"
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
                <Col span={24}>
                    <Form.Item
                        label={props.mode === "daily" ? "Date" : props.mode === "weekly" ? "Week" : "Month"}
                        name={props.mode === "weekly" ? 'week' : props.mode === "monthly" ? 'month' : 'day'}
                    >
                        {props.mode === "monthly" ? (
                            <DatePicker
                                allowClear={false}
                                picker={'month'}
                                style={{ width: "100%" }}
                                name="month"
                                onChange={(date) =>
                                    handleChangeDate({
                                        name: "month",
                                        value: date,
                                    })
                                }
                                defaultValue={states.month === "" ? undefined : moment(states.month).startOf('month')}
                                className={"select"}
                            />
                        ) : (
                            <DatePicker
                                allowClear={false}
                                style={{ width: "100%" }}
                                picker={props.mode === "weekly" ? 'week' : props.mode === "monthly" ? 'month' : 'date'}
                                onChange={(date) =>
                                    handleChangeDate({
                                        name: props.mode === "weekly" ? 'week' : 'day',
                                        value: date,
                                    })
                                }
                            />
                        )}


                    </Form.Item>
                </Col>
            </Form>
        </Modal>
    );
})

Modals.displayName = "FilterModal"
export default Modals
