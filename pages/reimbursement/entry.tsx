import React, { useEffect, useReducer, useState } from "react";
import type { ReactElement, FocusEvent } from "react";
import { getLoginSession } from "../../lib/auth";
import { useRouter } from "next/router";
import moment from "moment";
import Modal from "antd/lib/modal";
import { GetServerSideProps, NextApiRequest } from "next";
import Error from "next/error";
// import {masterStore, masterInvReasonEntry } from "../api/master/index";
import PageHeader from "antd/lib/page-header";
import Button from "antd/lib/button";
import Card from "antd/lib/card";
import Row from "antd/lib/row";
import Col from "antd/lib/col";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import Space from "antd/lib/space";
import Table from "antd/lib/table";
import Checkbox from "antd/lib/checkbox";
import Select from "antd/lib/select";
import Notifications from "../../components/Notifications";
import Upload from "antd/lib/upload";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import type { RcFile, UploadProps } from "antd/es/upload";
import axios from "axios";
import DashboardLayout from "../../components/layouts/Dashboard";
import { showConfirm } from "../../components/modals/ModalAlert";
import { pageCheck } from "../../lib/helper";
import AddItem from "./_additem";
import Affix from "antd/lib/affix";
import useSWR from "swr";
import Viewerjs from "../../components/Viewer";
import { masterReimbursementType } from "../api/master/index";
import { IMasterRem, IEntry } from "interfaces/reimbursement.interface";
import { getReimburseDetail, getReimburseDetailEmployee } from "pages/api/reimbursement/list";

const { Option } = Select;

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const fileToBase64 = (data: any) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (event) => {
      return resolve(event.target?.result);
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(data);
  });
};

const DataEntry = (props: any) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [formModal] = Form.useForm();
  const router = useRouter();
  const { query } = router;
  const [states, setStates] = useReducer(
    (state: IEntry, newState: Partial<IEntry>) => ({ ...state, ...newState }),
    props
  );
  const [container, setContainer] = useState();

  const handleCancel = () => setPreviewOpen(false);

  const handleChangeImg: UploadProps["onChange"] = ({
    fileList: newFileList,
  }) => setFileList(newFileList);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url!.substring(file.url!.lastIndexOf("/") + 1)
    );
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
    
    totalAmount = states.dataTable.length < 1 ? 0 : totalAmount

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

  const submitData = async (data: any) => {
    const remType = data?.remType;
    const remTitle = data?.remTitle
    const amount: any = states.totalAmount ? states.totalAmount : 0;
    const desc = data?.desc;
    const address = data?.address;
    const reqDate = data?.receipt_date;
    const filesRw = data?.dtFile.fileList;
    const items = states.dataTable
    const filesRw1 = filesRw ? filesRw?.map((item: any) => item.originFileObj) : []
    let allFiles = []
    for (let x = 0; x < filesRw1.length; x++) {
      let r = await fileToBase64(filesRw1[x])
      allFiles.push(r)
    }

    if(moment(reqDate) > moment()) {
      return Notifications('error', "Advance reimburse is not allowed. Purchase first then request here.", '')
    }

    if(amount < 1) {
      return Notifications('error', "Fill requested items for your reimburse.", '')
    }

    setStates({
      isLoading: true,
    });

    axios
      .post(`/api/reimbursement/addNew`, {
        file: allFiles,
        remType,
        amount,
        desc,
        address,
        reqDate,
        remTitle,
        userId: states.user,
        items
      })
      .then((res) => {
        if (res.data.error) {
          Notifications('error', res.data?.message, '')
          setStates({
            isLoading: false,
          });
        } else {
          Notifications('success', "Data successfully Entried.", '')
          backToEntries()
        }
      })
      .catch((err) => {
        alert(err);
      });
  };

  const updateSubmitData = async (data: any) => {
    const id = router.query.id
    const remType = data?.remType;
    const remTitle = data?.remTitle
    const amount: any = states.totalAmount ? states.totalAmount : 0;
    const desc = data?.desc;
    const address = data?.address;
    const reqDate = data?.receipt_date;
    const filesRw = data?.dtFile === undefined ? [] : data?.dtFile.fileList;
    const items = states.dataTable
    const filesRw1 = filesRw ? filesRw?.map((item: any) => item.originFileObj) : []
    let allFiles = []
    for (let x = 0; x < filesRw1.length; x++) {
      let r = await fileToBase64(filesRw1[x])
      allFiles.push(r)
    }
    setStates({
      isLoading: true,
    });

    if(moment(reqDate) > moment()) {
      return Notifications('error', "Advance reimburse is not allowed. Purchase first then request here.", '')
    }

    if(amount < 1) {
      return Notifications('error', "Fill requested items for your reimburse.", '')
    }

    axios
      .post(`/api/reimbursement/modify`, {
        file: allFiles,
        remType,
        amount,
        desc,
        address,
        reqDate,
        remTitle,
        userId: states.user,
        items,
        id
      })
      .then((res) => {
        if (res.data.error) {
          Notifications('error', res.data?.message, '')
          setStates({
            isLoading: false,
          });
        } else {
          Notifications('success', "Data successfully Updated.", '')
          backToEntries()
          setStates({
            isLoading: false,
          });
        }
      })
      .catch((err) => {
        alert(err);
      });
  };

  const backToEntries = () => {
    router.push("/reimbursement");
  };

  return (
    <>
      <PageHeader
        title="Add Reimbursement"
        extra={[
          !query.type ? (
            <Space key={"space1"}>
              <Button
                key="ButtonInvalid"
                id={"returnRef"}
                onClick={backToEntries}
                className={"button4"}
                shape="round"
              >
                Return to Menu
              </Button>
              {/* <Button key="ButtonInvalid"
                                onClick={() => handleOpenModal({
                                    name: "modalReject",
                                    value: true
                                })}
                                className={'button3'}
                                shape="round"
                                id={"invalidButRef"}
                            >
                                Set as Invalid
                            </Button> */}
            </Space>
          ) : null,
        ]}
      />
      <Form
        initialValues={states.form}
        form={formModal}
        className={"form"}
        layout="vertical"
        style={{ overflow: "hidden" }}
        onFinish={states.isAdd ? submitData : updateSubmitData}
      >
        <Row gutter={20}>
          <Col xl={14} xs={24}>
            <Card title="Reimburse">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Reimbursement Type"
                    name="remType"
                    rules={[
                      { required: true, message: "Required, cannot be empty!" },
                    ]}
                    initialValue={states.form.remType}
                  >
                    <Select
                      tabIndex={10}
                      className={"select"}
                      filterOption={(input, option) =>
                        option?.props.label
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                      showSearch
                      placeholder="- Select -"
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
                    >
                    {states.master.reimburse.length > 0 ? states.master.reimburse.map((item: any, idx: number) => (
                      <Option key={idx} value={item.value}>{item.label}</Option>
                    )) : null}
                    </Select>
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
                      tabIndex={16}
                      placeholder="Title"
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
                      placeholder="Date"
                      type="date"
                      className={"input"}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Address (Items purchased)"
                    name="address"
                    rules={[
                      {
                        required: true,
                        message: "This field is required!",
                      },
                    ]}
                  // initialValue={states.form.storeReceipt}
                  >
                    <Input.TextArea
                      tabIndex={16}
                      placeholder="Address"
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
                      tabIndex={16}
                      // value={states.form.storeReceipt}
                      placeholder="Wajib diisi dengan diagnosa/jenis obat."
                      className={"input"}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Button
                    onClick={() =>
                      handleOpenModal({ name: "modalAdd", value: true })
                    }
                    tabIndex={18}
                    id={"modalAddRef"}
                    onKeyDown={(event) => {
                      if (event.key === "Tab") {
                        event.preventDefault();
                        document.getElementById("invalidRef")?.focus();
                      }
                    }}
                  >
                    Add Item
                  </Button>
                  <Table
                    style={{ marginTop: "1em", overflowX: 'scroll'}}
                    size="middle"
                    pagination={false}
                    dataSource={[...states.dataTable]}
                    summary={() => (
                      <Table.Summary.Row style={{ fontWeight: "bolder" }}>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          Total Amount
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          {formatNumber(states.totalAmount)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                  >
                    <Table.Column title="Item" dataIndex="name" key="name" 
                      render={(text: string, record: any) => 
                      record.name.toUpperCase()} 
                    />
                    <Table.Column
                      title="Quantity"
                      dataIndex="quantity"
                      key="quantity"
                      align="right"
                    />
                    <Table.Column
                      title="Price"
                      dataIndex="price"
                      key="price"
                      align="right"
                    />
                    <Table.Column
                      title="Total Price"
                      align="right"
                      render={(text, record: any) =>
                        formatNumber(Number(record.quantity * record.price))
                      }
                    />
                    <Table.Column
                      title="Action"
                      key="action"
                      render={(text, record) => (
                        <Button.Group>
                          <Button
                            onClick={() =>
                              handleOpenModal({
                                name: "modalAdd",
                                mode: "edit",
                                data: record,
                                value: true,
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleItems({ data: record })}
                          >
                            Delete
                          </Button>
                        </Button.Group>
                      )}
                    />
                  </Table>
                </Col>
                <Col span={24}>
                  <Form.Item>
                    <Button
                      key="ButtonCheck"
                      // style={{marginTop: "1em"}}
                      onClick={() => formModal.submit()}
                      className={"button"}
                      shape="round"
                      loading={states.isLoading}
                      type="default"
                    >
                      Submit
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xl={10} xs={24}>
            <Form.Item
              label="Image URL"
              name="dtFile"
              valuePropName="file"
              rules={[
                { required: states.isAdd ? true : false, message: "Required, cannot be empty!" },
              ]}
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
            </Form.Item>

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
    </>
  );
};

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

  const trueRole = await pageCheck(session.username, "/reimbursement");

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

  const getReimburseDet: any = id ? await getReimburseDetailEmployee(id) : []

  let forms: any = []
  let urls: any = []
  let items: any = []
  if (id) {
    const {
      receipt_date, amount, title, address, description, reimburseTypeId
    } = getReimburseDet?.data?.[0]
    let urls = JSON.parse(JSON.stringify(getReimburseDet.imgs))
    let dataItems = JSON.parse(JSON.stringify(getReimburseDet.items))
    let form = {
      remType: reimburseTypeId,
      remTitle: title,
      desc: description,
      address,
      receipt_date: moment(receipt_date).format("YYYY-MM-DD"),
      url: urls,
      totalAmount: amount
    };
    forms = form
    items = dataItems
  } else {
    let form = {
      remType: null,
      remTitle: null,
      receipt_date: null,
      desc: null,
      address: null,
      url: null,
      totalAmount: 0
    };
    forms = form
    items = []
  }


  let master = {
    reimburse: [],
  } as IMasterRem;

  const remTypes = await masterReimbursementType();

  master.reimburse = remTypes;

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
      isAdd: !id ? true : false,
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
    },
  };
};

export default DataEntry;

DataEntry.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
