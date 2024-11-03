import Modal from "antd/lib/modal"
import Form from "antd/lib/form";
import Input from "antd/lib/input"
import Space from "antd/lib/space"
import Button from "antd/lib/button"
import Select from "antd/lib/select"
import React, { useReducer, useState, useEffect } from "react"
import moment from "moment"
import { DatePicker, DatePickerProps, TimePicker } from "antd"
import Col from "antd/lib/col";
import Row from "antd/lib/row";
import { modalState } from "interfaces/attendance.interface";

let initialState = {
    start: null,
    end: null,
    offType: 0,
    desc: "",
    showTime: false,
    master: {
        typeAtt: []
    },
};

const ModalCheckIO = (props: any) => {
    const [ formModal ] = Form.useForm();
    const [ isSubmitted, setSubmitted] = useState(false);
    const [loadings, setLoadings] = useState<boolean[]>([]);
    const [states, setStates] = useReducer((state: modalState, newState: Partial<modalState>) => ({ ...state, ...newState }), initialState);

    const submit = async (values: any) => {
        while (values.end.isBefore(values.start)) {
            Modal.warning({
                title: 'Warning',
                content: 'End date cannot be greater than start date!',
            });
            return
        }

        const param = {
            start: moment(values.start).format("YYYY-MM-DD"),
            end: moment(values.end).format("YYYY-MM-DD")
        }

        const srt = moment(values.start);
        const nd = moment(values.end);
        const dayReq = nd.diff(srt, "days");

        if (dayReq > 0) {
            Modal.warning({
                title: 'Warning',
                content: 'You can request this type just for one day.',
            });
            return
        }
        
        const checkAtt: any = await checkAttendance(param.start, param.end)
        if (checkAtt.length > 0) {
            Modal.warning({
                title: 'Warning',
                content: 'You have been attended on the same date! Please check again your request date.',
            });
            return
        }

        const checkValidation: any = await checkRequest(values.start, values.end, values.type)
        if (checkValidation.length > 0) {
            Modal.warning({
                title: 'Warning',
                content: 'You have been request attendance with the same date!',
            });
            return
        }

        enterLoading(2);
        setSubmitted(true);
        props.submitReq(values);
    }

    const checkRequest = async (start: string, end: string, type: number) => {
        let res = await fetch(`/api/attendance/checkRequest?&check=request&start=${start}&end=${end}&type=${type}`)
        if (res.status !== 404) {
            let data = await res.json()
            return data
        } else {
            return alert("Error 404")
        }
    }

    const checkAttendance = async (start: string, end: string) => {
        let res = await fetch(`/api/attendance/checkRequest?&check=attendance&start=${start}&end=${end}`)
        if (res.status !== 404) {
            let data = await res.json()
            return data
        } else {
            return alert("Error 404")
        }
    }

    useEffect(() => {
        setStates({
            master: {
                ...states.master,
                typeAtt: props.typeAtt
            }
        })
    }, [props])

    const disabledDate: DatePickerProps['disabledDate'] = current => {
        let startDate = moment().subtract(1,'months').startOf('month');
        let endDate = moment();
        let startCheck = true;
        let endCheck = true;

        if (startDate) {
            startCheck = current && current < moment(startDate, 'YYYY-MM-DD');
        }
        if (endDate) {
            endCheck = current && current > moment(endDate, 'YYYY-MM-DD');
        }
        return (startDate && startCheck) || (endDate && endCheck);
    };

    const enterLoading = (index: number) => {
        setLoadings(prevLoadings => {
            const newLoadings = [...prevLoadings];
            newLoadings[index] = true;
            return newLoadings;
        });

        setTimeout(() => {
            setLoadings(prevLoadings => {
                const newLoadings = [...prevLoadings];
                newLoadings[index] = false;
                return newLoadings;
            });
        }, 500000);
    };

    return (
        <Modal
            visible={props.open}
            title={"Request Attendance"}
            centered
            className={"modal"}
            onCancel={props.close}
            footer={
                <Space size={0}>
                    <Button
                        onClick={() => formModal.submit()}
                        style={{ borderBottomLeftRadius: 8 }}
                        disabled={ isSubmitted }
                        loading={loadings[2]}
                    >
                        Request
                    </Button>
                </Space>
            }
        >
            <Form 
                form={formModal}
                className={"form"}
                layout="vertical"
                onFinish={submit}
            >
                <Col span={24}>
                    <p style={{margin: '0 0 1em 0'}}>{props.empName}</p>
                    <p style={{margin: '0 0 1em 0'}}>{props.compName}</p>
                    <Form.Item 
                        label="Attendance Type" 
                        name="type"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Select
                            options={states.master.typeAtt}
                            className={"select"}
                            placeholder="Choose an option"
                        />
                    </Form.Item>
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item 
                                label="Start From" 
                                name="start"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <DatePicker
                                    className={"input"}
                                    style={{ width: "100%" }}
                                    disabledDate={disabledDate}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Time" 
                                name="start_time"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <TimePicker
                                    className={"input"}
                                    format="HH:mm"
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={12}>
                        <Form.Item 
                                label="Until" 
                                name="end"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <DatePicker
                                    className={"input"}
                                    style={{ width: "100%" }}
                                    disabledDate={disabledDate}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Time" 
                                name="end_time"
                                rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                            >
                                <TimePicker
                                    className={"input"}
                                    format="HH:mm"
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item 
                        label="Description" 
                        name="desc"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Input
                            placeholder="Description"
                            className={"input"}
                        />
                    </Form.Item>
                </Col>
            </Form>
        </Modal>)
}

export default ModalCheckIO