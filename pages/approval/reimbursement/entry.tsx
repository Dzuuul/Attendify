import React, { useEffect, useReducer, useState } from "react";
import type { ReactElement, FocusEvent } from "react";
import dynamic from "next/dynamic";
import { getLoginSession } from "../../../lib/auth";
import { useRouter } from "next/router";
import moment from "moment";
import Modal from "antd/lib/modal";
import { GetServerSideProps, NextApiRequest } from "next";
import Error from "next/error";
import PageHeader from "antd/lib/page-header";
import Button from "antd/lib/button";
import Card from "antd/lib/card";
import Row from "antd/lib/row";
import Col from "antd/lib/col";
import Form from "antd/lib/form";
import Typography from "antd/lib/typography";
import Popconfirm from "antd/lib/popconfirm";
import Input from "antd/lib/input";
import Space from "antd/lib/space";
import Table from "antd/lib/table";
import Checkbox from "antd/lib/checkbox";
import Select from "antd/lib/select";
import Notifications from "../../../components/Notifications";
import type { RcFile } from "antd/es/upload";
import DashboardLayout from "../../../components/layouts/Dashboard";
import { showConfirm } from "../../../components/modals/ModalAlert";
import { pageCheck } from "../../../lib/helper";
import AddItem from "./_additem";
import Affix from "antd/lib/affix";
import Viewerjs from "../../../components/Viewer";
import { masterReimbursementType } from "../../api/master/index";
import { IMasterRem, IEntry } from "../../../interfaces/reimbursement.interface";
import { getReimburseDetail, getReimburseDetailEmployee } from "../../../pages/api/reimbursement/list";
import { EditableCell } from "../../../components/CustomTabler";

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const ModalReject = dynamic(() => import("./_modal"), {
  loading: () => <p>Loading...</p>,
});

const DataEntry = (props: any) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [formModal] = Form.useForm();
  const router = useRouter();
  const [editingKey, setEditingKey] = useState('') as any;
  const { query } = router;
  const [states, setStates] = useReducer(
    (state: IEntry, newState: Partial<IEntry>) => ({ ...state, ...newState }),
    props
  );
  const [container, setContainer] = useState();

  const isEditing = (record: any) => record.key === editingKey;

  const edit = (record: Partial<any> & { key: React.Key }) => {
    formModal.setFieldsValue({ note: record.note, ...record });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key: React.Key) => {
    try {
      const row = (await formModal.validateFields()) as any;

      const newData: any = [...states.dataTable];
      const index = newData.findIndex((item: any) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });

        setStates({
          dataTable: newData
        })
        setEditingKey('');
      } else {
        newData.push(row);
        setStates({
          dataTable: newData
        })
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const handleCancel = () => setPreviewOpen(false);

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    setStates({
      isChecked: false,
    });
    e.preventDefault();
    const { name, value } = e.currentTarget;
    if( name == "checked") {
      let numbah = Number(value.replace(/[^0-9]+/g, ""))
      setStates({
          checked: Number(numbah),
      });
    } else {
      setStates({
        form: {
          ...states.form,
          [name]: value,
        },
      });
    }
  };

  const handleChangeSelect = (value: string, option: any) => {
    setStates({
      isChecked: false,
    });
    const name = option.name;

    setStates({
      form: {
        ...states.form,
        [name]: value,
      },
    });
  };

  const handleCheckBox = async (e: any, param: any) => {
    let { dataTable } = states;
    const { key } = param;
    dataTable[key].is_checked === 1 ? dataTable[key].is_checked = 0 : dataTable[key].is_checked = 1
    
    let cnt = 0
    for(let x = 0; x < dataTable.length; x++) {
      if(dataTable[x].is_checked === 1) {
        cnt += dataTable[x].totalPrice
      }
    }
    setStates({
      dataTable: dataTable,
      checked: cnt
    })
  };

  const handleOpenModal = (e: any) => {
    if (e.mode === "edit") {
      setStates({
        [e.name]: e.value,
        editList: e.data,
      });
    } else {
      if (e.name == "compareModal" && e.value == false) {
        document.getElementById("compareButtonRef")?.focus();
      }

      if (e.name == "modalAdd" && e.value == false) {
        document.getElementById("modalAddRef")?.focus();
      }

      setStates({
        [e.name]: e.value,
        editList: "",
        modalType: e.modalType,
      });
    }
  };

  const handleItems = async (data: any) => {
    let { dataTable, totalAmount } = states;

    if (data.action === "add") {
      dataTable.push(data.data);
      totalAmount = totalAmount + data.data.totalPrice;
    } else if (data.action === "edit") {
      let index = await data.data.index;
      totalAmount = totalAmount - dataTable[index].totalPrice;
      dataTable.splice(data.data.index, 1);

      dataTable.push(data.data);
      totalAmount = totalAmount + data.data.totalPrice;
    } else {
      let index = data.data.key;
      totalAmount = totalAmount - dataTable[index].totalPrice;
      dataTable.splice(data.data.key, 1);
    }

    setStates({
      dataTable,
      totalAmount,
    });
    document.getElementById("buttonAddItem")?.focus();
  };

  const formatNumber = (number: number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  useEffect(() => {
    const { data } = props;
    if (data) {
      setStates({
        master: {
          ...states.master,
        },
      });

      router.push(
        {
          pathname: router.pathname,
          query: { id: router.query.id },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [props.data]);

  useEffect(() => {
    const { form } = props;
    if (form) {
      setStates({
        form: form,
      });
    }
  }, [props.form]);

  useEffect(() => {
    setContainer(document.getElementById("containerImage") as any);
  }, []);

  if (props.error) {
    return <Error statusCode={400} />;
  }

  !states.dataTable
    ? []
    : states.dataTable.forEach((i: any, index: any) => {
      i.key = index;
    });

  const submitDataReceptions = async (data: any) => {
    const reimburseId = states.form.remId
    const id = router.query.id
    const items = states.dataTable
    const userId = props.user
    const nominal = states.checked
    const allowed = props.allowed
    const extNote = data?.extNote
    // const onProcessing = states.onProcessing

    const datas = {
      id,
      reimburseId,
      items,
      userId,
      nominal,
      extNote
    }

    // if(props.autoReject) {
    //   return Notifications('error', "Reject this. Request Date is expired due to expired struct / request already expired.", '')
    // }

    if((nominal > allowed) && (data?.extNote === '' || data?.extNote === null)) {
      return Notifications('error', "Fill description if requested nominal is bigger than allowed nominal.", '')
    }

    for(let r = 0; r < items.length; r++) {
      if((items[r].is_checked === null || items[r].is_checked === 0) && (items[r].note === null || items[r].note === '')) {
        r = items.length
        return Notifications('error', "Fill reject reason if not approved in item reimbursed.", '')
      }
    }

    setStates({
      isLoading: true,
    });

    const encryp = Buffer.from(JSON.stringify(datas)).toString('base64')

    let response: any = await recepCheckThis(encryp)
    if (response.status !== 200) {
        Notifications("error", response?.error, '')
        setStates({
          isLoading: false,
        });
    } else {
        Notifications('success', "Data successfully Modified.", '')
        backToEntries()
    }
  };

  const approveReimburse = async () => {
    const id = router.query.id
    const params = {
      id,
      reimburseId: states.form.remId,
      userId: props.user
    }
    const encryp = Buffer.from(JSON.stringify(params)).toString('base64')
    setStates({
      isLoading: true,
    });
    let response: any = await approveThis(encryp)
    if (response.status !== 200) {
        Notifications('error', response.error, '')
    } else {
        Notifications('success', "Data successfully Saved.", '')
        backToEntries()
    }
  };

  const rejectReimburse = async (param: any) => {
    const id = router.query.id
    const params = {
      id,
      reimburseId: states.form.remId,
      userId: props.user,
      reject: param.reject
    }
    const encryp = Buffer.from(JSON.stringify(params)).toString('base64')
    setStates({
      isLoading: true,
    });
    let response: any = await rejectThis(encryp)
    if (response.status !== 200) {
        Notifications('error', response.error, '')
    } else {
        Notifications('success', "Data successfully Saved.", '')
        backToEntries()
    }
}

  const backToEntries = () => {
    props.viewMode ? router.push("/reimbursement") : router.push("/approval/reimbursement");
  };

  const columnsEdit: any = [
    { title: "Item", dataIndex: "name", key: "name",
      render: (text: string, record: any) => 
      record.name.toUpperCase()
    },
    { title: "Quantity", dataIndex: "quantity", key: "quantity", align: "right" },
    { title: "Price", dataIndex: "price", key: "price", align: "right" },
    {
      title: "Total Price", align: "right",
      render: (text: string, record: any) =>
        formatNumber(Number(record.quantity * record.price))
    },
    {
      title: "Approve", dataIndex: "is_checked", key: "is_checked", align: "right",
      render: (value: boolean, record: any, index: number) => (
        <Checkbox
          checked={value}
          onChange={(e) => handleCheckBox(e, record)}
        />
      )
    },
    { title: "Reject Reason", dataIndex: "note", key: "note", align: "right", editable: true },
    {
      title: 'Action',
      dataIndex: 'operation',
      render: (_: any, record: any) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link onClick={() => save(record.key)} style={{ marginRight: 8 }}>
              Save
            </Typography.Link>
            <Popconfirm title="Cancel edit?" onConfirm={cancel}>
              <a>Cancel</a>
            </Popconfirm>
          </span>
        ) : (
          <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
            Edit Reason
          </Typography.Link>
        );
      },
    },
  ]

  const columns: any = [
    { title: "Item", dataIndex: "name", key: "name",
      render: (text: string, record: any) => 
      record.name.toUpperCase() 
    },
    { title: "Quantity", dataIndex: "quantity", key: "quantity", align: "right" },
    { title: "Price", dataIndex: "price", key: "price", align: "right" },
    {
      title: "Total Price", align: "right",
      render: (text: string, record: any) =>
        formatNumber(Number(record.quantity * record.price))
    },
    { title: "Reject Reason", dataIndex: "note", key: "note", align: "right", editable: true },
    {
      title: "Approved By Receptionist", dataIndex: "is_checked", key: "is_checked", align: "right",
      render: (value: boolean, record: any, index: number) => (
        <Checkbox
          checked={states.form.remType == "1" ? value : true}
          // onChange={(e) => handleCheckBox(e, record)}
        />
      )
    },
  ]

  const mergedColumns = columnsEdit.map((col: any) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: any) => ({
        record,
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <>
      <PageHeader
        title="Add Reimbursement"
        extra={[
          !query.type ?
              <Row gutter={4} key={'kunci'}>
              <Col xs={24} xl={props.approveMode && props.controlMode == 6 ? 12 : 8} style={{paddingBottom: '2px'}}>
              <Space key={'space1'}>
                  <Button
                      key="ButtonInvalid"
                      id={"returnRef"}
                      onClick={backToEntries}
                      className={'button4'}
                      shape="round"
                  >
                      Return to Menu
                  </Button>
                  </Space>
                  </Col>
                  {props.approveMode && props.controlMode == 6 ?
                      <Col xs={24} xl={12} style={{paddingBottom: '2px'}}>
                      <Space key={'space2'}>
                        <Button key="ButtonInvalid"
                          style={{ backgroundColor: "grey" }}
                          onClick={() => handleOpenModal({
                              name: 'modalReject',
                              value: true
                          })}
                          className={'button3'}
                          shape="round"
                          id={"invalidButRef"}
                      >
                          Reject
                      </Button>
                      </Space>
                      </Col> : null
                  }
                  {props.approveMode && props.controlMode !== 6 ? <>
                    <Col xs={24} xl={8} style={{paddingBottom: '2px'}}>
                    <Space key={'space3'}>
                    <Button key="ButtonInvalid"
                          style={{ backgroundColor: "grey" }}
                          onClick={() => handleOpenModal({
                              name: 'modalReject',
                              value: true
                          })}
                          className={'button3'}
                          shape="round"
                          id={"invalidButRef"}
                      >
                          Reject
                      </Button>
                      </Space>
                      </Col>
                      <Col xs={24} xl={8} style={{paddingBottom: '2px'}}>
                        <Space key={'space4'}>
                          <Button key="Buttonvalid"
                          // loading={states.stopper}
                          onClick={() => showConfirm({ onOk: (() => approveReimburse()) })}
                          className={'button'}
                          shape="round"
                          id={"validRef"}
                      >
                          Approve
                      </Button>
                      </Space>
                      </Col>
                      </> : null
                  }
                  </Row>
               : null,

      ]}
      />
      <Form
        initialValues={states.form}
        form={formModal}
        className={"form"}
        layout="vertical"
        style={{ overflow: "hidden" }}
        onFinish={props.controlMode === 6 ? submitDataReceptions : approveReimburse}
        // onFinish={submitDataReceptions}
      >
        <Row gutter={20}>
          <Col xl={14} xs={24}>
            <Card title="Reimburse">
              <Row gutter={16}>
              {props.viewMode ? null :
              <Col span={24}>
                  <Form.Item
                    label="Employee Requester"
                    // name="remTitle"
                    rules={[
                      {
                        required: true,
                        message: "This field is required!",
                      },
                    ]}
                  // initialValue={states.form.storeReceipt}
                  >
                    <Input
                      readOnly
                      tabIndex={16}
                      placeholder="John Doe"
                      className={"input"}
                      value={props.userReq}
                    />
                  </Form.Item>
                </Col>
                }
                <Col span={24}>
                  <Form.Item
                    label="Reimbursement Type"
                    rules={[
                      { required: true, message: "Required, cannot be empty!" },
                    ]}
                    initialValue={states.form.remType}
                  >
                    <Select
                      disabled
                      tabIndex={10}
                      className={"select"}
                      filterOption={(input, option) =>
                        option?.props.label
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                      options={states.master.reimburse}
                      showSearch
                      value={states.form.remType}
                      placeholder="- Select -"
                      onChange={handleChangeSelect}
                      onKeyDown={(event) => {
                        if (event.key === "Backspace") {
                          setStates({
                            form: {
                              ...states.form,
                              remType: undefined,
                            },
                          });
                        } else if (event.key === "Enter") {
                          event.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Reimbursement Title"
                    name="remTitle"
                    rules={[
                      {
                        required: true,
                        message: "This field is required!",
                      },
                    ]}
                  // initialValue={states.form.storeReceipt}
                  >
                    <Input
                      readOnly
                      tabIndex={16}
                      placeholder="Title"
                      className={"input"}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Request Date"
                    name="created_at"
                    rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                  >
                    <Input
                      readOnly
                      placeholder="Date"
                      type="date"
                      className={"input"}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Receipt Date"
                    name="receipt_date"
                    rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                  >
                    <Input
                      readOnly
                      placeholder="Date"
                      type="date"
                      className={"input"}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Description"
                    name="desc"
                    rules={[
                      {
                        required: true,
                        message: "This field is required!",
                      },
                    ]}
                  >
                    <Input.TextArea
                      readOnly
                      tabIndex={16}
                      // value={states.form.storeReceipt}
                      placeholder="Description"
                      className={"input"}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Table
                    // rowSelection={{
                    //   type: 'checkbox',
                    //   onChange: ChkBoxOnChange,
                    //   columnTitle: 'Approve',

                    // }}
                    components={{
                      body: {
                        cell: EditableCell,
                      },
                    }}
                    columns={props.controlMode === 6 ? mergedColumns : columns}
                    style={{ marginTop: "1em", overflowX: 'scroll'}}
                    size="middle"
                    pagination={false}
                    dataSource={[...states.dataTable]}
                    summary={() => (
                      <>
              {props.viewMode ? null : (
                        <>
                        <Table.Summary.Row style={{ fontWeight: "bolder" }}>
                          <Table.Summary.Cell index={0} colSpan={3}>
                            Requested
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            {formatNumber(states.totalAmount)}
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                        <Table.Summary.Row style={{ fontWeight: "bolder" }}>
                          <Table.Summary.Cell index={4} colSpan={2}>
                            Available Amount
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5}>
                            {formatNumber(states.allowed)}
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                        <Table.Summary.Row style={{ fontWeight: "bolder" }}>
                          <Table.Summary.Cell index={0} colSpan={2}>
                            Another Reimburse Incomplete
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            {states.onProcessing ? formatNumber(Number(states.onProcessing)) : 0}
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                        </>
                        )}
                        <Table.Summary.Row style={{ fontWeight: "bolder" }}>
                          <Table.Summary.Cell index={2} colSpan={2}>
                            Approved Nominal
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>
                            <Input
                              style={{fontSize: '20px', fontWeight: 'bolder', color: 'black'}}
                              tabIndex={16}
                              name="checked"
                              disabled={props.controlMode === 6 && props.approveMode ? false : props.controlMode !== 6 && props.approveMode ? true : true}
                              value={props.controlMode === 6 && props.approveMode ? formatNumber(Number(states.checked)) : formatNumber(Number(states.form.totalAmount))}
                              onChange={handleChange}
                              placeholder="Nominal"
                              className={"input"}
                            />
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                        {/* <Table.Summary.Row style={{ fontWeight: "bolder" }}>                        
                        <Table.Summary.Cell index={3} colSpan={2}>
                          Allowed
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                          {formatNumber(states.totalAmount)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row> */}
                      </>
                    )}
                  />
                </Col>
                <Col span={24} style={{paddingTop: '1em'}}>
                  <Form.Item
                    label="Description (from Receptionist)"
                    name="extNote"
                  >
                    <Input.TextArea
                      // readOnly
                      tabIndex={16}
                      // value={states.form.storeReceipt}
                      disabled={props.controlMode === 6 && props.approveMode ? false : props.controlMode !== 6 && props.approveMode ? true : true}
                      placeholder="Add some note if requested nominal is bigger than available nominal."
                      className={"input"}
                      rows={3}
                    />
                  </Form.Item>
                </Col>
                {props.controlMode === 6 && props.approveMode ? (
                  <Col span={24}>
                  <Form.Item>
                    <Button
                      key="ButtonCheck"
                      // style={{marginTop: "1em"}}
                      disabled={editingKey !== '' ? true : false}
                      // onClick={() => formModal.submit()}
                      onClick={() => showConfirm({onOk: (() => formModal.submit())})}
                      className={"button"}
                      shape="round"
                      loading={states.isLoading}
                      type="default"
                    >
                      Submit
                    </Button>
                  </Form.Item>
                </Col>
                ) : null}
              </Row>
            </Card>
          </Col>
          <Col xl={10} xs={24}>
            {/* {states.controlMode === 6 ? null : (
              <Form.Item
                label="Image URL"
                name="dtFile"
                valuePropName="file"
              // rules={[
              //   { required: states.isAdd ? true : false, message: "Required, cannot be empty!" },
              // ]}
              >
                <Upload
                  className="avatar-uploader"
                  listType="picture-card"
                  onChange={handleChangeImg}
                  onPreview={handlePreview}
                // {...imgProp}
                >
                  <Button icon={<UploadOutlined />}></Button>
                </Upload>
              </Form.Item>)} */}

            <Row>
              <Col span={24}>
                <Affix offsetTop={10}>
                  <Card className={"card-profile-data-entry"} title="Struct Photo">
                    <div
                      id="containerImage"
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <Viewerjs
                        url={states.form.url}
                        container={container}
                      />
                    </div>
                  </Card>
                </Affix>
              </Col>
            </Row>
          </Col>
        </Row>
        <Modal
          visible={previewOpen}
          title={previewTitle}
          footer={null}
          onCancel={handleCancel}
        >
          <img alt="example" style={{ width: "100%" }} src={previewImage} />
        </Modal>
      </Form>
      <AddItem
        header={states.modalType == 'Add' ? 'Add Item' :
          states.modalType == 'Edit' ? "Edit Item" : ""}
        open={states.modalAdd}
        handleOpenModal={handleOpenModal}
        handleAddItem={handleItems}
        editList={states.editList}
      />
      <ModalReject
          open={states.modalReject}
          header="Reject Reimburse"
          handleOpenModal={handleOpenModal}
          submit={rejectReimburse}
      />
    </>
  );
};

const approveThis = async (data: any) => {
  let res: any = await fetch(`/api/approval/request_reimbursement/approve`, {
      method: 'POST',
      body: JSON.stringify({
          data: data
      }),
      headers: {
          'Content-Type': 'application/json',
      },
  })
  if (res.status !== 404) {
      let dataList = await res.json()
      return dataList
  } else {
      return alert("Error 404")
  }
}

const rejectThis = async (data: any) => {
  let res: any = await fetch(`/api/approval/request_reimbursement/reject`, {
      method: 'POST',
      body: JSON.stringify({
          data: data
      }),
      headers: {
          'Content-Type': 'application/json',
      },
  })
  if (res.status !== 404) {
      let dataList = await res.json()
      return dataList
  } else {
      return alert("Error 404")
  }
}

const recepCheckThis = async (data: any) => {
  let res: any = await fetch(`/api/approval/request_reimbursement/resCheck`, {
      method: 'POST',
      body: JSON.stringify({
          data: data
      }),
      headers: {
          'Content-Type': 'application/json',
      },
  })
  if (res.status !== 404) {
      let dataList = await res.json()
      return dataList
  } else {
      return alert("Error 404")
  }
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getLoginSession(ctx.req as NextApiRequest);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const viewMode: any = ctx.query.view

  const trueRole = await pageCheck(session.username, viewMode === '1' ? "/reimbursement" : "/approval/reimbursement");

  const id: any = ctx.query.id;

  if (
    Object.keys(trueRole).length === 0 ||
    (trueRole.m_update == 0) ||
    (trueRole.m_insert == 0)
  ) {
    return {
      redirect: {
        destination: "/403",
        permanent: false,
      },
    };
  }

  const getReimburseDet: any = id ? viewMode === '1' ? await getReimburseDetailEmployee(id) : await getReimburseDetail(id) : []

  let userReq: string = ''
  let forms: any = []
  let urls: any = []
  let items: any = []
  let autoReject: boolean = false
  let onProcessing: any = []
  let saldo_allowed = 0
  if (id) {
    const {
      receipt_date, amount, title, description, reimburseTypeId, id, saldo_pengobatan, paid_notes, created_at
    } = getReimburseDet?.data?.[0]
    let urls = JSON.parse(JSON.stringify(getReimburseDet.imgs))
    let dataItems = JSON.parse(JSON.stringify(getReimburseDet.items))
    let reqs = JSON.parse(JSON.stringify(getReimburseDet.requester))
    let allowance = JSON.parse(JSON.stringify(getReimburseDet.allowed ? getReimburseDet.allowed : 0))
    let processed = JSON.parse(JSON.stringify(getReimburseDet.processed ? getReimburseDet.processed : 0))
    let autoRjt = JSON.parse(JSON.stringify(getReimburseDet.autoReject ? getReimburseDet.autoReject : false))
    let form = {
      remId: id,
      remType: reimburseTypeId,
      remTitle: title,
      desc: description,
      receipt_date: moment(receipt_date).format("YYYY-MM-DD"),
      url: urls,
      totalAmount: amount,
      extNote: paid_notes || '',
      created_at: moment(created_at).format("YYYY-MM-DD")
    };
    forms = form
    items = dataItems
    saldo_allowed = allowance
    onProcessing = processed
    autoReject = autoRjt
    userReq = reqs
  } else {
    let form = {
      remType: null,
      remTitle: null,
      receipt_date: null,
      desc: null,
      url: null,
      totalAmount: 0,
      extNote: null,
      created_at: null
    };
    forms = form
    items = []
    onProcessing = []
    autoReject = false
    userReq = ''
  }


  let master = {
    reimburse: [],
  } as IMasterRem;

  const remTypes = await masterReimbursementType();

  master.reimburse = remTypes;

  let approveMode: any = ctx.query.aprv

  // ini counter checked items

  let cnt = 0

  for(let x = 0; x < items.length; x++) {
    if(items[x].is_checked === 1) {
      cnt += items[x].totalPrice
    }
  }

  return {
    props: {
      access: {
        m_insert: trueRole[0].m_insert,
        m_update: trueRole[0].m_update,
        m_delete: trueRole[0].m_delete,
        m_view: trueRole[0].m_view,
      },
      form: forms,
      user: session.username,
      master: JSON.parse(JSON.stringify(master)),
      formError: {
        error: false,
        errorField: "",
        errorMessage: "",
      },
      approveMode: approveMode === '1' ? true : false,
      remId: id,
      viewMode: viewMode === '1' ? true : false,
      controlMode: session.accessId,
      autoReject: autoReject,
      dataTable: items,
      isLoading: false,
      modalAdd: false,
      modalReject: false,
      modalType: "",
      modalAddItem: "",
      modalCompare: false,
      editList: "",
      isChecked: false,
      totalAmount: forms.totalAmount || 0,
      allowed: saldo_allowed || 0,
      checked: cnt || 0,
      onProcessing: onProcessing,
      userReq: userReq
    },
  };
};

export default DataEntry;

DataEntry.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
