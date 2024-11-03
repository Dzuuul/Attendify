import React, { useEffect, useState } from "react";
import Modal from "antd/lib/modal";
import { InputNumber, Button, Form, Col, Input, Row, Space, Image } from "antd";
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
    const close = () => {
        props.handleOpenModal({ name: "openImage", value: false });
    };

    const imgs = props?.images ? props?.images.map((item: any, idx: number) => (
        <Col key={idx} span={12}>
            <Image src={item.src} />
        </Col>
    )) : null
    
    return (
        <>
        <Modal
            destroyOnClose
            title={props.header}
            className={"modal"}
            onCancel={close}
            centered
            footer={false}
            visible={props.open}
        >
            <Form 
                className={"form"}
                layout="vertical"
            >
                <Row gutter={12}>
                    {imgs}
                    {/* <Col span={12}>
                        <Image src="" />
                    </Col> */}
                </Row>
            </Form>
        </Modal>
      </>
    )
}

export default React.memo(Modals);