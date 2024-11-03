import React, { useEffect, useReducer } from "react";
import { Modal, Button, Row, Form, Select, Input, Col, Space } from "antd";

interface AddItem {
  prdInput: string
  itemName: number | string | undefined
  key: string
  qty: string
  price: string
  total: string
  textContent: string
}

let initState = {
  prdInput: '',
  key: '',
  itemName: undefined,
  qty: '',
  price: '',
  total: '',
  textContent: ''
 } as AddItem

const AddItem = (props: any) => {
  const [states, setStates] = useReducer((state: AddItem, newState: Partial<AddItem>) => ({ ...state, ...newState }), props);
    
  const handleChangeFocus = (event: any) => {
    if (event === "categoryRef") {
      document.getElementById("categoryProductRef")?.focus();
    } else if (event === "categoryProductRef") {
      document.getElementById("qtyRef")?.focus();
    } else if (event === "qtyRef") {
      document.getElementById("priceRef")?.focus();
    } else if (event === "priceRef") {
      document.getElementById("totalRef")?.focus();
    } else if (event === "totalRef") {
      document.getElementById("submitRef")?.focus();
    } else if (event === "submitRef") {
      document.getElementById("cancelRef")?.focus();
    } else if (event === "cancelRef") {
      document.getElementById("categoryRef")?.focus();
    }
  };

  const handleSubmit = () => {
    let {key, itemName, textContent, price, qty} = states
    let datas = {
      action: props.editList ? "edit" : "add",
      data: {
        index: key,
        itemName,
        quantity: qty,
        name: itemName,
        price: price,
        totalPrice: Number(Number(states.price || 0) * Number(states.qty || 0))
      },
    };
    let datas2 = {
      action: props.editList ? "edit" : "add",
      data: {
        itemName,
        quantity: qty,
        name: itemName,
        price: price,
        totalPrice: Number(Number(states.price || 0) * Number(states.qty || 0))
      },
    };
    if (itemName === "" || qty === "" || Number(price) === 0) {
      alert("Please Fill All Field");
    } else {
      // props.handleAddItem(datas)
      props.editList ? props.handleAddItem(datas) : props.handleAddItem(datas2),
      close();
    }
  };

  const formatNumber = (number: number) => {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const close = () => {
    props.handleOpenModal({ name: "modalAdd", value: false });
    setStates(initState);
  };

  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { name, value } = e.currentTarget;
    setStates({
        [name]: value,
    });
  };


  const handleChangePrice = (param : {quantity: string, pricePerItem: string, total: string}) => {
    let qty = Number(param.quantity.replace(/[^0-9]+/g, ""))
    let pricePerItem = Number(param.pricePerItem.replace(/[^0-9]+/g, ""))
    let total = Number(param.total.replace(/[^0-9]+/g, ""))

    let resQty = qty
    let resPPI = pricePerItem
    let resTotal = resQty * resPPI

    if (Number(states.total) != total) {
        resPPI = qty == 0 ? 0 : Number(states.total) / qty
        resTotal = Number(states.total)
    // } else if (total != 0) {
    } else {
        resQty = pricePerItem == 0 ? resQty : Number(resTotal / pricePerItem)
        resPPI = qty == 0 ? resPPI : Number(resTotal / qty)
    }

    setStates({
        qty: resQty ? resQty.toString() : '0',
        price: resPPI ? resPPI.toString() : '0',
        total: resTotal ? resTotal.toString() : '0'
    })
  }

  useEffect(() => {
    if (props.open) {
      document.getElementById("categoryRef")?.focus();
    }
  }, [props.open])

  useEffect(() => {
    const { editList } = props
    if (editList) {
        setStates({
            key: editList.key,
            itemName: editList.itemName,
            qty: editList.quantity.toString(),
            price: editList.price.toString(),
            textContent: editList.name
        })
    }
    else {
      setStates(initState)
    }
  }, [props.editList])

    return (
      <Modal
            mask={false}
            destroyOnClose
            title={props.header}
            className={"modal"}
            onCancel={close}
            centered
            // style={{right: 100}}
            footer={
                <Space size={0}>

                    <Button
                        onClick={handleSubmit}
                        style={{ borderBottomLeftRadius: 8 }}
                        id={"submitRef"}
                        onKeyDown={(event) => {
                          if (event.key === "Tab") {
                            event.preventDefault();
                            handleChangeFocus("submitRef");
                          }
                        }}
                    >
                        Submit
                    </Button>
                    <Button
                        onClick={close}
                        id={"cancelRef"}
                        style={{ backgroundColor: "#252733", borderBottomRightRadius: 8 }}
                        onKeyDown={(event) => {
                          if (event.key === "Tab") {
                            event.preventDefault();
                            handleChangeFocus("cancelRef");
                          }
                        }}
                    >Cancel</Button>
                </Space>
            }
            visible={props.open}
        >
            <Form className={"form"} layout="vertical">
                <Row gutter={16}>
                    {/* <Col span={24}>
                        <Form.Item label="Product Category">
                            <Select
                                tabIndex={18}
                                className={"select"}
                                filterOption={(input, option) =>
                                    option?.props.label
                                    .toLowerCase()
                                    .indexOf(input.toLowerCase()) >= 0
                                }
                                id="categoryRef"
                                // tabIndex="10"
                                value={states.pickedCat}
                                placeholder="- Select -"
                                options={states.dataCat}
                                showSearch
                                onChange={(e, { value, text }: any) =>
                                  handleChangeSelect("pickedCat", "cat", value, '')
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Backspace") {
                                        setStates({
                                          pickedCat: undefined
                                        })
                                    } else if (event.key === "Tab") {
                                        event.preventDefault();
                                        handleChangeFocus("categoryRef");
                                    } else if (event.key === "Enter") {
                                        event.preventDefault();
                                    }
                                }}
                            />
                        </Form.Item>
                    </Col> */}
                    <Col span={24}>
                    <Form.Item 
                            label="Item Name" 
                            rules={[{ required: true, message: 'Required, cannot be empty!' }]}
                        >
                        <Input
                        tabIndex={19}
                          name="itemName"
                          onChange={handleChange}
                          value={states.itemName}
                          placeholder="Item Name"
                          className={"input"}
                        />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Quantity">
                            <Input
                                tabIndex={20}
                                id="qtyRef"
                                name="quantity"
                                value={formatNumber(Number(states.qty))}
                                // onChange={handleChange}
                                onChange={(e) => handleChangePrice({
                                    quantity: e.target.value, 
                                    pricePerItem: states.price || '0', 
                                    total: states.total || '0' })
                                }
                                placeholder="0"
                                className={"input"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Price Per Item">
                            <Input
                                id="priceRef"
                                tabIndex={21}
                                name="price"
                                value={formatNumber(Number(states.price))}
                                onChange={(e) => handleChangePrice({
                                    quantity: states.qty || '0', 
                                    pricePerItem: e.target.value || '0', 
                                    total: states.total || '0' })
                                }
                                placeholder="0"
                                className={"input"}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item label="Total">
                            <Input
                                tabIndex={22}
                                name="total"
                                id={"totalRef"}
                                value={formatNumber(Number(states.total))}
                                // onChange={handleChange}
                                onChange={(e) => handleChangePrice({
                                    quantity: states.qty || '0', 
                                    pricePerItem: states.price || '0',
                                    total: e.target.value || '0'})
                                }
                                placeholder="0"
                                className={"input"}
                                onKeyDown={(event) => {
                                if (event.key === "Tab") {
                                      event.preventDefault();
                                      handleChangeFocus("totalRef");
                                  } else if (event.key === "Enter") {
                                      event.preventDefault();
                                  }
                              }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
  }

export default React.memo(AddItem);
