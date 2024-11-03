import React, { useReducer, useEffect, useState } from "react";
import Link from "next/link";
import Space from "antd/lib/space";
import Dropdown from "antd/lib/dropdown";
import Avatar from "antd/lib/avatar";
import Row from "antd/lib/row";
import Col from "antd/lib/col";
import Layout from "antd/lib/layout";
import Menu from "antd/lib/menu";
import Drawer from "antd/lib/drawer"

import Image from "next/image";
import Logo from "../../public/img/Logo-02.png";
import LogoCollapsed from "../../public/img/Logo-02.png";
import CustomIcon from "../CustomIcon";
//import from "./../../pages/settings/registrasi"
import {
    UserOutlined,
    DownOutlined,
    // LogoutOutlined,
    MenuOutlined,
} from "@ant-design/icons";
import Styles from "../../styles/Test.module.css";
import useSWR from "swr";
import { useRouter } from "next/router";

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;

const submenuKeys = ["/entstat", "/regstat"];

let initialState = {
    collapsed: true,
    isMobile: false,
    openKeys: [],
    menu: [],
    session: {
        name: "",
        email: "",
        role: "",
    },
};

const SiderDemo = ({ children }: any) => {
    let router = useRouter();
    const [states, setStates] = useReducer(
        (state: any, newState: Partial<any>) => ({ ...state, ...newState }),
        initialState
    );
    const url = `/api/menu/list`;
    const { data, error } = useSWR(url);

    const menu = (
        <Menu>
            {states.session.role === "Employee" ?
                <Menu.Item key="100">
                    <Link href="/profile">
                        <a>Profile</a>
                    </Link>
                </Menu.Item>
                : null}
            <Menu.Item key="99">
                <Link href="/api/auth/logout">
                    <a>Logout</a>
                </Link>
            </Menu.Item>
        </Menu>
    );

    const onOpenChange = (keys: any) => {
        const latestOpenKey = keys.find(
            (key: any) => states.openKeys.indexOf(key) === -1
        );
        if (submenuKeys.indexOf(latestOpenKey) === -1) {
            setStates({ openKeys: keys });
        } else {
            setStates({ openKeys: latestOpenKey ? [latestOpenKey] : [] });
        }
    };

    const toggle = () => {
        setStates({ collapsed: !states.collapsed });
    };

    const decData = async () => {
        setStates({
            menu: data.data,
            session: {
                name: data.session.fullname,
                role: data.session.role,
            },
        });
    };

    useEffect(() => {
        if (data) {
            decData();
        }
    }, [data]);

    let currentPath: any = router.asPath;
    let activeKey = currentPath;

    useEffect(() => {
        window.innerWidth <= 600 ? setStates({ collapsed: true, isMobile: true }) : setStates({ collapsed: false, isMobile: false })
    }, [])

    const [open, setOpen] = useState(false)

    const showDrawer = () => {
        setOpen(true);
    };


    const onClose = () => {
        setOpen(false);
    };


    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Drawer
                drawerStyle={{backgroundColor: '#272727'}}
                placement={'left'}
                onClose={onClose}
                visible={open}
            >
                <Sider
                    className={"sider"}
                    breakpoint="lg"
                    trigger={null}
                    collapsedWidth="0"
                    collapsed={false}
                >
                    <div className={"logoSider"}>
                        <Image
                            width={states.collapsed ? 50 : 105}
                            height={states.collapsed ? 20 : 40}
                            alt="Logo RedBox"
                            src={states.collapsed ? LogoCollapsed : Logo}
                        />
                    </div>
                    <Menu
                        className={"sidebar"}
                        mode="inline"
                        defaultSelectedKeys={["0"]}
                        openKeys={states.openKeys}
                        onOpenChange={onOpenChange}
                        selectedKeys={activeKey}
                    >
                        {states.menu?.length > 0 ? states.menu.map((item: any, index: number) => {
                            if (
                                item.subMenu2 &&
                                item.subMenu2?.length > 0 &&
                                item.menu != "Billing"
                            ) {
                                return (
                                    <SubMenu
                                        key={item.path}
                                        icon={<CustomIcon type={item.icon} />}
                                        title={item.menu}
                                    >
                                        {item.subMenu2.map((item: any, index: number) => (
                                            // <Menu.Item key={`sub${item.menu}${index}`}>
                                            //     <Link href={item.path}>{item.menu}</Link>
                                            // </Menu.Item>
                                            <Menu.Item key={item.path}>
                                                <Link href={item.path}>{item.menu}</Link>
                                            </Menu.Item>
                                        ))}
                                    </SubMenu>
                                );
                            }

                            return (
                                <Menu.Item
                                    key={item.path}
                                    icon={<CustomIcon type={item.icon} />}
                                >
                                    <Link href={item.path}>{item.menu}</Link>
                                </Menu.Item>
                            );
                        }) : null}
                    </Menu>
                </Sider>
            </Drawer>
            <Layout className={Styles.siteLayout} style={{ backgroundColor: "white" }}>
                <Header
                    className={"custom-header"}
                    style={{ paddingLeft: 0, paddingRight: 20 }}
                >
                    <Row justify="space-between">
                        <Space size={0}>
                            {React.createElement(
                                states.collapsed ? MenuOutlined : MenuOutlined,
                                {
                                    className: `${Styles.trigger}`,
                                    // onClick: toggle,
                                    onClick: showDrawer
                                }
                            )}
                            {
                                //  !states.isMobile || (states.isMobile && states.collapsed) ? (
                                states.isMobile === "true" && states.collapsed === "true" ? (
                                    <h5 style={{ marginLeft: -5 }}>
                                        {" "}
                                        <b>Employee Self Service</b>
                                    </h5>
                                ) : null
                            }
                        </Space>
                        <Space>
                            <Space></Space>
                            <Row align="middle">
                                <Dropdown overlay={menu}>
                                    <a
                                        style={{ marginTop: -5 }}
                                        className={"flexCenter custom-user"}
                                        onClick={(e) => e.preventDefault()}
                                    >

                                        <Col>
                                            <h5>
                                                {states.session.name}
                                            </h5>
                                            <h6>
                                                {states.session.role}
                                            </h6>
                                        </Col>
                                        <Avatar
                                            size={32}
                                            style={{ color: "#CCC", backgroundColor: "#FFFFFF" }}
                                            icon={<UserOutlined style={{ fontSize: "18px" }} />}
                                        />
                                        {/* <DownOutlined
                                            style={{ color: "#118891", fontSize: "12px" }}
                                        /> */}
                                    </a>
                                </Dropdown>
                            </Row>
                        </Space>
                    </Row>
                </Header>
                <Content>{children}</Content>
            </Layout>
        </Layout>
    );
};

export default React.memo(SiderDemo);
