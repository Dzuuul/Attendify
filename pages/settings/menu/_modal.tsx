import React, { useReducer, useEffect } from "react";
import { OptionData, OptionGroupData, OptionsType } from "rc-select/lib/interface"

import Modal from "antd/lib/modal";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Col from "antd/lib/col";
import Input from "antd/lib/input";
import Row from "antd/lib/row";
import Select from "antd/lib/select";
import Space from "antd/lib/space";

import { modalState } from "../../../interfaces/menu.interface"

let initialState = {
    data: [],
    isLoading: true,
    oldId: "",
    master: {
        role: []
    },
    form: {
        description: "",
        path: "",
        status: undefined,
        id: undefined
    },
    userId: 0,
};


const Modals = (props: any) => {
    const [states, setStates] = useReducer((state: modalState, newState: Partial<modalState>) => ({ ...state, ...newState }), initialState);

    const close = () => {
        props.handleOpenModal({ name: "openModal", value: false });
        setStates(initialState)
    };

    const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
        e.preventDefault()
        const { name, value } = e.currentTarget
        setStates({
          form: {
            ...states.form,
            [name]: value
          }
        })
      };

    const handleChangeSelect = (value: string, option: any) => {
        const name = option.name
        setStates({
            form: {
                ...states.form,
                [name]: value
            }
        });
    };

    const submit = () => {        
        const { form, oldId, userId } = states
        props.submit({ ...form, id: oldId, userId: userId })
    }

    let optionStatus = [
        { key: 1, name: "status", value: 1, label: "Enable" },
        { key: 0, name: "status", value: 0, label: "Disable" }
    ];

    useEffect(() => {
        const { data, master } = props

        setStates({
            master
        })

        if (data && Object.keys(data).length != 0) {
            setStates({
                oldId: data.menu,
                form: {
                    ...states.form,
                    ...data,
                    description: data.menu,
                    header: data.menu_header,
                    status: data.status,
                }
            })
        }
    }, [props.data])

    useEffect(() => {
        const { userId } = props
            setStates({
                userId: userId
            })
    }, [props.userId])

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
                        onClick={submit}
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
            <Form className={"form"} layout="vertical">
                <Row gutter={16}>
                <Col span={12}>
                        <Form.Item label="Menu Description">
                            <Input
                                name="description"
                                value={states.form.description}
                                onChange={handleChange}
                                placeholder="Menu Description"
                                className={"input"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Path">
                            <Input
                                name="path"
                                value={states.form.path}
                                onChange={handleChange}
                                placeholder="Path"
                                className={"input"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item label="Status" name="status" initialValue={states.form.status}>
                            <Select
                                value={states.form.status}
                                onChange={handleChangeSelect}
                                options={optionStatus}
                                className={"select"}
                                placeholder="Choose an option"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

// export default Modals;
export default React.memo(Modals);