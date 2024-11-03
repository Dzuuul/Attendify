import React, { useEffect, useState } from "react";
import Modal from "antd/lib/modal";
import { InputNumber, Button, Form, Col, Input, Row, Space } from "antd";
import Upload from "antd/lib/upload"
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile, UploadProps } from 'antd/es/upload'

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

const Modals = (props: any) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [ formModal ] = Form.useForm()

    const handleCancel = () => setPreviewOpen(false);

    const handleChangeImg: UploadProps['onChange'] = ({ fileList: newFileList }) =>
    setFileList(newFileList);

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
          file.preview = await getBase64(file.originFileObj as RcFile);
        }
    
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
        setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
      };
    
    const close = () => {
        props.handleOpenModal({ name: "openModal", value: false });
        formModal.resetFields();
    };

    useEffect(() => {
        formModal.setFieldsValue(props.data)
    }, [formModal, props.data])

    // const imgProp = {
    //     onRemove: (e: any) => {
    //         formModal.setFieldsValue({
    //             dtPicture: "",
    //             dtFile: null,
    //         })
    //     },
    //     beforeUpload: (file: any) => {
    //         formModal.setFieldsValue({
    //             dtFile: file
    //         })
    //         return false;
    //     },
    // };

    const submit = async (data: any) => {
        let datas = {
            id: !data.id ? 0 : data.id,
            receipt_date: data.receipt_date,
            amount: data.amount,
            description: data.description,
            file: data.dtFile.fileList
        }
        if(!data.id) {
            props.handleAdd(datas);
        } else {
            props.handleEdit(datas)
        }
        
    }

    return (
        <>
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
                    >
                        Cancel
                    </Button>
                </Space>
            }
            visible={props.open}
        >
            <Form 
                form={formModal}
                className={"form"}
                layout="vertical"
                onFinish={submit}
                initialValues={props.data}
            >
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item 
                            label="Receipt Date"
                            name="receipt_date"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <Input
                                placeholder="Date"
                                type="date"
                                className={"input"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item 
                            label="Amount" 
                            name="amount"
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                            <InputNumber
                                style={{ width:`100%` }}
                                className={"ant-input"}
                                formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value!.replace(/\Rp\s?|(,*)/g, '')}
                                placeholder="Amount"
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
                <Col span={24}>
                    <Form.Item 
                        label="Image URL" 
                        name="dtFile" 
                        valuePropName="file"
                        rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                    >
                        <Upload className="avatar-uploader" listType="picture-card" 
                        onChange={handleChangeImg}
                        onPreview={handlePreview}
                        // {...imgProp}
                        >
                            <Button icon={<UploadOutlined />}></Button>
                        </Upload>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item hidden name="dtPicture">
                        <Input type="hidden" />
                    </Form.Item>
                </Col>
                {/*<Col span={12}>
                    <Form.Item hidden name="dtFile">
                        <Input type="hidden" />
                    </Form.Item>
                </Col>*/}
                <Col span={12}>
                    <Form.Item hidden name="id">
                        <Input type="hidden" />
                    </Form.Item>
                </Col>
            </Form>
            <Modal visible={previewOpen} title={previewTitle} footer={null} onCancel={handleCancel}>
        <img alt="example" style={{ width: '100%' }} src={previewImage} />
      </Modal>
        </Modal>
      </>
    )
}

export default React.memo(Modals);