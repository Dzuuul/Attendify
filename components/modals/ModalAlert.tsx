import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { confirm } = Modal;

export function showDeleteConfirm(props: any) {
  confirm({
    title: "Warning",
    icon: <ExclamationCircleOutlined />,
    content: "Are you sure delete this item?",
    centered: true,
    okText: "Yes",
    okType: "danger",
    cancelText: "No",
    onOk() {
      props.onOk();
    },
    onCancel() {},
  });
}

export function showConfirm(props: any) {
  confirm({
    title: "Warning",
    icon: <ExclamationCircleOutlined />,
    content: "Are you sure to save this item?",
    centered: true,
    okText: "Yes",
    okType: "danger",
    cancelText: "No",
    onOk() {
      props.onOk();
    },
    onCancel() {},
  });
}

export function showApprove(props: any) {
  confirm({
    title: "Warning",
    icon: <ExclamationCircleOutlined />,
    content: "Are you sure to approve this item?",
    centered: true,
    okText: "Yes",
    okType: "danger",
    cancelText: "No",
    onOk() {
      props.onOk();
    },
    onCancel() {},
  });
}

export function showMoneyReady(props: any) {
  confirm({
    title: "Warning",
    icon: <ExclamationCircleOutlined />,
    content: "Are you sure? This action will send e-mail to the employee requesting.",
    centered: true,
    okText: "Yes",
    okType: "danger",
    cancelText: "No",
    onOk() {
      props.onOk();
    },
    onCancel() {},
  });
}

export function showMoneyAccepted(props: any) {
  confirm({
    title: "Warning",
    icon: <ExclamationCircleOutlined />,
    content: "Are you sure you got the reimbursement money?.",
    centered: true,
    okText: "Yes",
    okType: "danger",
    cancelText: "No",
    onOk() {
      props.onOk();
    },
    onCancel() {},
  });
}
