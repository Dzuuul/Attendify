import React, { useEffect, useState } from "react"
import moment from "moment"
import { DatePicker, Form, Modal, Input, Space, Button, Select, Col } from "antd"
import { calcWrkD } from "pages/approval/timeoff"

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

const ModalCheckIO = (props: any) => {

    const [form] = Form.useForm();
    const [isSubmitted, setSubmitted] = useState(false);
    const [loadings, setLoadings] = useState<boolean[]>([]);
    const [isMessage, setMessage] = useState("");
    const [startFrom, setStartFrom] = useState(null);
    const [until, setUntil] = useState(null);
    const [dateRange, setDateRange] = useState(0);
    const [timeOffType, setTimeOffType] = useState(0);


    const submit = async (values: any) => {
        const param = {
            TOType: values.timeoff,
            start: moment(values.start).format("YYYY-MM-DD"),
            end: moment(values.end).format("YYYY-MM-DD"),
            desc: values.desc
        }
        while (values.end.isBefore(values.start)) {
            Modal.warning({
                title: 'Warning',
                content: 'End date cannot be greater than start date!',
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

        // getData contains the leave day limit and its time-off type
        const getData = await getTypeDet(param.TOType)
        const dayLimit = getData.dayLimit;
        const tipe = getData.tipe;
        const srt = moment(param.start)
        const nd = moment(param.end)

        const totalHoliyay = await chkHoliday()

        const holidayRy = totalHoliyay.data.map((i: any, idx: number) =>
            moment(i.date).format('YYYY-MM-DD')
        )
        const dayReq = await calcWrkD(param.start, param.end, holidayRy)

        if (tipe === 2) {
            if (dayReq > props.remLeave) {
                Modal.warning({
                    title: 'Warning',
                    content: 'Request date more than remaining leave balance!',
                });
                return
            }
        }

        let workD: number = await calcWrkD(param.start, param.end, holidayRy)
        if (dayLimit > 0) {
            if (workD > dayLimit) {
                Modal.warning({
                    title: 'Warning',
                    content: 'Request date more than limit allowed!',
                });
                return
            }
        }

        enterLoading(2);
        if (props.remLeave - dateRange < 0) {
            setSubmitted(false);
        } else {
            setSubmitted(true);
        }
        props.timeoffReq(param)
        return
    }

    const handleChange = async (value: any) => {
        const data: any = form.getFieldValue("timeoff");
        const getData = await getTypeDet(data)

        const type = getData.tipe
        const dayLimit = getData.dayLimit;

        setTimeOffType(type);

        if (dayLimit) {
            setMessage("Maximal days can be taken: " + dayLimit + " days")
            return
        }
        if (!dayLimit) {
            setMessage("")
            return
        }
    };

    const handleDateChange = (date: any, field: any) => {
        if (field === 'start') {
            setStartFrom(date);
        } else if (field === 'end') {
            setUntil(date);
        }

        if (timeOffType === 2 && startFrom && until) {
            const range = Math.ceil((until - startFrom) / (1000 * 60 * 60 * 24));
            setDateRange(range);
        } else {
            setDateRange(0);
        }
    };

    useEffect(() => {
        if (startFrom && until) {
            const range = Math.ceil((until - startFrom) / (1000 * 60 * 60 * 24));
            setDateRange(range);
        }
    }, [startFrom, until]);

    const getTypeDet = async (data: any) => {
        let res = await fetch(`/api/attendance/${data}`)
        if (res.status !== 404) {
            let day_limit = await res.json()
            return day_limit
        } else {
            return alert("Error 404")
        }
    }

    const chkHoliday = async () => {
        let res = await fetch(`/api/master/dayoff/all`)
        if (res.status !== 404) {
            let day_limit = await res.json()
            return day_limit
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
            title={"Request Time-Off"}
            centered
            className={"modal"}
            onCancel={props.close}
            footer={
                <Space size={0}>
                    <Button
                        onClick={() => form.submit()}
                        style={{ borderBottomLeftRadius: 8 }}
                        disabled={isSubmitted}
                        loading={loadings[2]}
                    >
                        Request
                    </Button>
                </Space>
            }
        >
            <Form
                form={form}
                className={"form"}
                layout="vertical"
                onFinish={submit}
            >
                <p style={{ margin: '0 0 1em 0' }}>{props.empName}</p>
                <p style={{ margin: '0 0 1em 0' }}>{props.compName}</p>
                {/* <p style={{ margin: '0 0 1em 0', fontWeight: 'bold' }}>Remaining leave: {props.remLeave}</p> */}
                {/* <p style={{ margin: '0 0 1em 0', fontWeight: 'bold' }}>Remaining leave: {timeOffType !== 2 ? props.remLeave : props.remLeave - dateRange}</p> */}
                <p style={{ margin: '0 0 1em 0', fontWeight: 'bold', color: (timeOffType === 2 && props.remLeave - dateRange < 0) ? 'red' : 'inherit' }}>
                    {timeOffType === 2 || timeOffType === 0 ? `Remaining leave: ${props.remLeave - dateRange}` : null}
                </p>

                <Col span={24}>
                    <Form.Item
                        label="Time-off Type"
                        name="timeoff"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Select
                            placeholder="Choose an option"
                            style={{ width: "100%" }}
                            options={props?.timeoff || []}
                            onChange={handleChange}
                        />
                    </Form.Item>
                    <p style={{ color: "red" }}>{isMessage}</p>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label="Start From"
                        name="start"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <DatePicker
                            className={"input"}
                            allowClear={false}
                            disabledTime={disabledDateTime}
                            format="DD-MM-YYYY"
                            style={{ width: "100%" }}
                            onChange={(date) => handleDateChange(date, 'start')}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label="Until"
                        name="end"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <DatePicker
                            className={"input"}
                            allowClear={false}
                            disabledTime={disabledDateTime}
                            format="DD-MM-YYYY"
                            style={{ width: "100%" }}
                            onChange={(date) => handleDateChange(date, 'end')}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label="Description"
                        name="desc"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Description"
                        />
                    </Form.Item>
                </Col>
            </Form>
        </Modal>)
}

export default ModalCheckIO