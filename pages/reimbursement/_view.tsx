import React, { useReducer, useEffect } from "react";
import Modal from "antd/lib/modal";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Col from "antd/lib/col";
import Table from "antd/lib/table";
import Tag from "antd/lib/tag";
import Input from "antd/lib/input";
import Row from "antd/lib/row";
import { List } from "antd";
import Space from "antd/lib/space";
import { modalState } from "../../interfaces/reimbursement.interface";
import moment from "moment";
import { MinusOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";

function txtShrtr(text: string, length: number) {
  if (text == null) {
      return "";
  }
  if (text.length <= length) {
      return text;
  }
  text = text.substring(0, length);
  let last = text.lastIndexOf(" ");
  text = text.substring(0, last);
  return text + "...";
}

let initialState = {
  data: [],
  isLoading: true,
  items: [],
  form: {
    type: "",
    title: "",
    amount: 0,
    receipt_date: "",
    description: "",
    id: undefined,
    extNote: ''
  },
};

const Modals = (props: any) => {
  const [formModal] = Form.useForm();
  const [states, setStates] = useReducer(
    (state: modalState, newState: Partial<modalState>) => ({
      ...state,
      ...newState,
    }),
    initialState
  );

  const close = () => {
    props.handleOpenView({ name: "openView", value: false });
    setStates(initialState);
  };

  useEffect(() => {
    const { data } = props;
    setStates({
      form: {
        ...states.form,
        type: data.type,
        title: data.title,
        receipt_date: moment(props.data.receipt_date).format("DD-MM-YYYY"),
        description: data.description,
        amount: data.amount,
        need_approve: data.need_approve,
        status_approve: data.status_approve,
        reject: data.reject,
        extNote: data.extNote
      },
    });
  }, [props.data]);

  useEffect(() => {
    const { form } = states;
    formModal.setFieldsValue(form);
  }, [formModal, states.form]);

  useEffect(() => {
    setStates({
      items: props.items,
    });
  }, [formModal, props.items]);
  
  const columns: any = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Total Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (text: any) => {
        return "Rp. " + text.toLocaleString("en");
      },
    },
    {
      title: "Is Approved",
      dataIndex: "is_checked",
      key: "is_checked",
      render: (text: any, record: any) => (
        <>
          {record.is_checked == null ? (
            <Tag color="default" key={record.is_checked}>
              Unchecked
            </Tag>
          ) : record.is_checked == 0 ? (
            <Tag color="red" key={record.is_checked}>
              Rejected
            </Tag>
          ) : record.is_checked == 1 ? (
            <Tag color="lime" key={record.is_checked}>
              Approved
            </Tag>
          ) : null}
        </>
      ),
    },
    {
      title: "Reject Reason",
      dataIndex: "note",
      key: "note",
    },
  ];

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
            onClick={close}
            style={{ backgroundColor: "#252733", borderBottomRightRadius: 8 }}
          >
            Close
          </Button>
        </Space>
      }
      visible={props.open}
    >
      <Form form={formModal} className={"form"} layout="vertical">
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="Reimburse Type" name="type">
              <Input className={"input"} readOnly />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Reimburse Name" name="title">
              <Input className={"input"} readOnly />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Reimburse Description" name="description">
              <Input className={"input"} readOnly />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Purchase Date" name="receipt_date">
              <Input className={"input"} readOnly />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Reimburse Amount" name="amount">
              <Input className={"input"} readOnly />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
        <Col span={24}>
          <Form.Item label="Reimburse Items">
            <Table
              style={{overflowX: 'scroll'}}
              dataSource={states.items}
              columns={columns}
              size="small"
              pagination={false}
            />
          </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={15}>
            <Form.Item label="Approval From" name="need_approve">
              <List
                size="small"
                dataSource={states.form.need_approve}
                renderItem={(item) => <List.Item>{txtShrtr(item as string, 18)}</List.Item>}
              />
            </Form.Item>
          </Col>
          <Col span={9}>
            <Form.Item label="Status" name="status_approve">
              <List
                size="small"
                dataSource={states.form.status_approve}
                renderItem={(status) => (
                  <List.Item>{status as string}</List.Item>
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <Col span={24}>
          <Form.Item label="Note From Receptionist" name="extNote">
            <Input.TextArea rows={2} className={"input"} readOnly />
          </Form.Item>
        </Col><Col span={24}>
          <Form.Item label="Reason Reject" name="reject">
            <Input.TextArea rows={4} className={"input"} readOnly />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item hidden name="id">
            <Input type="hidden" />
          </Form.Item>
          <Form.Item hidden name="order">
            <Input type="hidden" />
          </Form.Item>
        </Col>
      </Form>
    </Modal>
  );
};

// export default Modals;
export default React.memo(Modals);
