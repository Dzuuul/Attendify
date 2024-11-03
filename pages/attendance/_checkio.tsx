import Modal from "antd/lib/modal"
import Radio from "antd/lib/radio"
import Input from "antd/lib/input"
import Space from "antd/lib/space"
import Button from "antd/lib/button"
import Select from "antd/lib/select"
import React, { useState } from "react"
import moment from "moment"
import Clock from "react-digital-clock"
import type { RadioChangeEvent } from 'antd';

const ModalCheckIO = (props: any) => {
    const [value, setValue] = useState(1);
    const [isSubmitted, setSubmitted] = useState(false)
    const [loadings, setLoadings] = useState<boolean[]>([]);
    const [desc, setDesc] = useState('');

    //const onChange = (e: RadioChangeEvent) => {
    //    setValue(e.target.value);
    //};

    const onChange = (value: number, option: any) => {
        setValue(value);
    };

    const onChangeTxt = (e: any) => {
        setDesc(e.target.value)
    }

    const submit = () => {
        enterLoading(2)
        setSubmitted(true)
        const param = {
            clockType: value,
            desc: desc
        }
        if(props.mode === 1) {
            props.checkIn(param)
        } else {
            props.checkOut(param)
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
            title={props.mode === 1 ? "Clock-In" : "Clock-Out"}
            centered
            className={"modal"}
            onCancel={props.close}
            footer={
                <Space size={0}>
                    <Button
                        onClick={submit}
                        disabled={isSubmitted}
                        loading={loadings[2]}
                        style={{ borderBottomLeftRadius: 8 }}
                    >
                        {props.mode === 1 ? "Clock-In" : "Clock-Out"}
                    </Button>
                </Space>
            }
        >
            <p style={{margin: 0}}>{props.empName}</p>
            <div className="set-clock-black">
                <Clock hour12={false} format={'HH:mm:ss'}/> | {moment().format('dddd, MMMM Do YYYY')}
            </div>
            {props.mode === 1 ? 
                (<>
                    <p style={{margin: '1em 0 0 0'}}>Shift Type</p>
                    <Select
                        defaultValue={1}
                        style={{ width: "100%" }}
                        onChange={onChange}
                        // disabled={ true }
                        options={props?.checkType}
                    />
                    {/*<Radio.Group onChange={onChange} value={value}>
                    <Radio value={1}>WFO</Radio>
                    <Radio value={2} disabled={true}>WFH</Radio>
                    </Radio.Group>*/}
                </>)
            : null}
            <p style={{margin: '1em 0 0 0'}}>Keterangan</p>
            <Input placeholder="Keterangan" value={desc} onChange={onChangeTxt}/>
        </Modal>)
}

export default ModalCheckIO