import React, { useEffect, useReducer } from "react";
import Modal from "antd/lib/modal";
import { Button, Form, Col, Input, Row, Space, Typography, Select } from "antd";
import { DatePicker } from "antd";
import { modalStateAdd } from "../../../interfaces/approval_timeoff.interface";
import moment from "moment";
import { calcWrkD } from ".";

const { Option } = Select;

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

let initialState = {
    loading: false,
    master: {
        comp: [],
        emp: [],
        timeoff: []
    },
};

const ModalAdd = (props: any) => {
    const [states, setStates] = useReducer((state: modalStateAdd, newState: Partial<modalStateAdd>) => ({ ...state, ...newState }), initialState)
    const [formModal] = Form.useForm()
    const close = () => {
        props.handleOpenAdd({ name: "openAdd", value: false });
        formModal.resetFields();
        setStates({
            master: {
                ...states.master,
                comp: props.master.comp,
                emp: props.master.emp,
                timeoff: props.master.timeoff
            }
        });
    };

    useEffect(() => {
        setStates({
            master: {
                ...states.master,
                comp: props.master.comp,
                emp: props.master.emp,
                timeoff: props.master.timeoff
            }
        });
    }, [props.master])

    const findEmployees = async () => {
        const companyId: number = formModal.getFieldValue("company");
        let res = await fetch(`/api/master/find_emps?&param=${companyId}`)
        if (res.status !== 404) {
            let dataList = await res.json()
            setStates({
                master: {
                    ...states.master,
                    emp: dataList
                }
            });
            return
        } else {
            return alert("Error 404")
        }
    }

    const remainingLeave = async () => {
        const employeeId: number = formModal.getFieldValue("employee");
        let res = await fetch(`/api/master/find_remLeave?&param=${employeeId}`)
        if (res.status !== 404) {
            let dataList = await res.json()
            const data: number = dataList ? dataList[0].saldo_cuti : 0;

            formModal.setFieldsValue({
                remLeave: data,
            })
            return
        } else {
            return alert("Error 404")
        }
    }

    const submit = async (data: any) => {
        while (data.end.isBefore(data.start)) {
            Modal.warning({
                title: 'Warning',
                content: 'End date cannot be greater than start date!',
            });
            return
        }
        setStates({
            loading: true
        })
        let param = {
            emp: data.employee,
            TOType: data.timeoff,
            start: moment(data.start).format("YYYY-MM-DD"),
            end: moment(data.end).format("YYYY-MM-DD"),
            desc: data.description
        }

        const getData = await getTypeDet(param.TOType)
        const dayLimit = getData.dayLimit;
        const tipe = getData.tipe;
        const srt = moment(param.start)
        const nd = moment(param.end)
        const dayReq = calcWrkD(srt, nd, props.holidays)

        if (tipe === 2) {
            if (dayReq > data.remLeave) {
                Modal.warning({
                    title: 'Warning',
                    content: 'Request date more than remaining leave balance!',
                });
                return
            }
        }

        if (dayLimit > 0) {
            if (dayReq > dayLimit) {
                Modal.warning({
                    title: 'Warning',
                    content: 'Request date more than limit allowed!',
                });
                return
            }
        }

        console.log(props);
        return props.handleAdd(param);
    }

    const getTypeDet = async (data: any) => {
        let res = await fetch(`/api/attendance/${data}`)
        if (res.status !== 404) {
            let day_limit = await res.json()
            return day_limit
        } else {
            return alert("Error 404")
        }
    }

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
                        key={"999"}
                        loading={states.loading}
                        onClick={() => formModal.submit()}
                        style={{ borderBottomLeftRadius: 8 }}
                    >
                        Save
                    </Button>
                    <Button
                        key={"998"}
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
                title={"Request Time Off"}
                className={"form"}
                layout="vertical"
                onFinish={submit}
            >
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item
                            label="Company"
                            name="company"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}

                        >
                            <Select
                                placeholder="Choose an option"
                                options={states.master.comp}
                                className={"select"}
                                onChange={findEmployees}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Employee"
                            name="employee"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}

                        >
                            <Select
                                showSearch
                                style={{ width: '100%' }}
                                placeholder="Choose an option"
                                className={"select"}
                                optionFilterProp="children"
                                filterOption={(input: any, option: any) =>
                                    option.props.children.toUpperCase().indexOf(input.toUpperCase()) >= 0 || option.props.value.toString().toUpperCase().indexOf(input.toUpperCase()) >= 0
                                }
                                onChange={remainingLeave}
                            >
                                {states.master.emp.map((p: any) => <Option key={p.key.toString()} value={p.value}>{p.label}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="Remaining Leave"
                            name="remLeave"
                        >
                            <Input
                                placeholder="Remaining Leave"
                                className={"input"}
                                readOnly
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="Time-off Type"
                            name="timeoff"
                        >
                            <Select
                                placeholder="Choose an option"
                                options={states.master.timeoff}
                                className={"select"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Start from"
                            name="start"
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                format="DD-MM-YYYY"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Until"
                            name="end"
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                format="DD-MM-YYYY"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label="Description"
                            name="description"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Input.TextArea
                                rows={4}
                                placeholder="Description"
                                className={"input"}
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

export default React.memo(ModalAdd);