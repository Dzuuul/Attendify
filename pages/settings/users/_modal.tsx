import React, { useReducer, useEffect, useState } from "react";
import Modal from "antd/lib/modal";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Col from "antd/lib/col";
import Input from "antd/lib/input";
import Row from "antd/lib/row";
import Select from "antd/lib/select";
import Space from "antd/lib/space";
import axios from "axios";
import { modalState } from "../../../interfaces/user.interface"

let initialState = {
    data: [],
    isLoading: true,
    oldId: "",
    role: [],
    master: {
        role: [],
        apps: []
    },
    form: {
        username: "",
        name: "",
        apps: "",
        role: "",
        password: "",
        id: undefined
    },
    inputDisabled: false,
};


const Modals = (props: any) => {
    const [ formModal ] = Form.useForm();
    const [states, setStates] = useReducer((state: modalState, newState: Partial<modalState>) => ({ ...state, ...newState }), initialState);
    const [role_open, hideRole] = useState(true);

    useEffect(() => {
        const { data, master } = props

        setStates({
            master
        })

        if (data && Object.keys(data).length != 0) {
            setStates({
                oldId: data.username,
                form: {
                    ...states.form,
                    ...data,
                    apps: data.appsId
                }
            })
        }
    }, [props.data])

    const close = () => {
        props.handleOpenModal({ name: "openModal", value: false });
        setStates(initialState)
        hideRole(true)
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

    const handleChangeSelect = async (value: string, option: any) => {
        const name = option.name
        if (name == "apps") {
            const fetch = await axios.get(`/api/master/role/list?appsId=${value}`).then((res) => res.data)
            setStates({
                master: {
                    ...states.master,
                    ["role"]: fetch
                }
            })
            hideRole(false)
        }

        setStates({ 
            form: {
                ...states.form,
                [name]: value
            }
        });
    };

    const submit = () => {
        const { form, oldId } = states
        props.submit({ ...form, id: oldId })
        setStates(initialState)
        hideRole(true)
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
            <Form form={formModal} className={"form"} layout="vertical">
                <Col span={24}>
                    <Form.Item label="Application Access" name="apps" initialValue={states.form.apps}>
                        <Select
                            value={states.form.apps}
                            onChange={handleChangeSelect}
                            options={states.master.apps}
                            placeholder="Choose an option"
                            className={"select"}
                        />
                    </Form.Item>
                </Col>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Role" name="role" initialValue={states.form.role}>
                            <Select
                                value={states.form.role}
                                onChange={handleChangeSelect}
                                options={states.master.role}
                                placeholder="Choose an option"
                                className={"select"}
                                disabled={role_open}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Name">
                            <Input
                                name="name"
                                value={states.form.name}
                                onChange={handleChange}
                                placeholder="Name"
                                className={"input"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="ID Employee">
                            <Input
                                name="username"
                                type="text"
                                value={states.form.username}
                                onChange={handleChange}
                                placeholder="Username"
                                className={"input"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Password">
                            <Input.Password 
                                name="password" 
                                placeholder="Password" 
                                value={states.form.password} 
                                className={"input"} 
                                onChange={handleChange} 
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