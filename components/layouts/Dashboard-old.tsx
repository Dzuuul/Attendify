import { Layout, Menu } from 'antd';
import React, { useReducer, useEffect, useContext } from "react";
import Link from "next/link";
import Space from "antd/lib/space";
import Dropdown from "antd/lib/dropdown";
import Avatar from "antd/lib/avatar";
import Row from "antd/lib/row";
import Col from "antd/lib/col";
import { Footer } from 'antd/lib/layout/layout';
import Image from 'next/image'
import Logo from "../../public/img/home-1.png";
// import LogoCollapsed from "../../public/img/logo-collapsed.png";
import CustomIcon from "../CustomIcon";
import { useApp } from "../../context/AppContext"

import {
    UserOutlined,
    MenuOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;

let initialState = {
    collapsed: false,
    menu: [],
    session: {
        name: "",
        email: "",
        role: ""
    }
}

const SiderDemo = ({ children }: any) => {
    const { statesContex, setLogin } = useApp();
    const [states, setStates] = useReducer((state: any, newState: Partial<any>) => ({ ...state, ...newState }), initialState)

    const logoutHandler = () => {
        setLogin()
        // signOut()
    }

    const menu = (
        <Menu>
            <Menu.Item key="99" onClick={logoutHandler} >Sign out</Menu.Item>
        </Menu>
    );

    const toggle = () => {
        setStates({ collapsed: !states.collapsed });
    };

    useEffect(() => {
        if (statesContex.menu.length > 0) {
            setStates({
                menu: statesContex.menu
            }) 
        }  
    }, [statesContex])

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider className={"sider"} trigger={null} collapsible collapsed={states.collapsed}>
                <div className={"logoSider"} >
                    <Image
                        width={states.collapsed ? 40 : 100}
                        height={states.collapsed ? 50 : 70}
                        alt="Logo"
                        src={Logo}
                    />
                </div>
                <Menu mode="inline" theme="dark" defaultSelectedKeys={['0']}>
                    {states.menu?.length > 0 ? states.menu.map((item: any, index: number) => {
                        if (item.subMenu2 && item.subMenu2?.length > 0) {
                            return (
                                <SubMenu key={index} icon={<CustomIcon type={item.icon} />}  
                                title={item.menu}>
                                    {item.subMenu2.map((item: any, index: number) => (
                                        <Menu.Item key={`sub${item.menu}${index}`}>
                                            <Link href={item.path}>{item.menu}</Link>
                                        </Menu.Item>
                                    ))}
                                </SubMenu>
                            )
                        }

                        return (
                            <Menu.Item key={index} 
                                 icon={<CustomIcon type={item.icon}/>}
                            >
                                <Link href={item.path}>{item.menu}</Link>
                            </Menu.Item>)
                    }) : null}
                    <Menu.Item key={999} 
                        icon={<CustomIcon type={'LogoutOutlined'}/>}
                        onClick={logoutHandler}
                    >
                        Sign Out
                    </Menu.Item>
                </Menu>
            </Sider>
            <Layout className="site-layout">
                <Header
                className="site-layout-background"
                style={{
                    position: "sticky",
                    zIndex: 3,
                    width: "100%",
                    top: 0,
                    padding: "0 12px",
                    background: 'rgb(52, 167, 85)'
                }}
                >
                <Row justify="space-between">
                    <Col span={1}>
                        {/* <div className="trigger"  onClick={this.onCollapse}>
                            {this.state.collapsed ? (
                            <MenuUnfoldOutlined />
                            ) : (
                            <MenuFoldOutlined />
                            )}
                        </div> */}
                        {React.createElement(states.collapsed ? MenuOutlined : MenuOutlined, {
                            // className: `${Styles.trigger}`,
                            onClick: toggle,
                        })}
                    </Col>
                    <Col span={10}>
                    <div
                        style={{
                        textAlign: "right",
                        paddingRight: "2em",
                        color: "white",
                        }}
                    >
                        <Avatar
                            size={36}
                            icon={<UserOutlined />}
                            style={{ marginRight: "10px", backgroundColor: 'black'}}
                        />
                            {statesContex.username}
                    </div>
                    </Col>
                </Row>
                </Header>
                <Content style={{ margin: "16px 16px", padding: 0 }}>
                <div
                    className="site-layout-background"
                    style={{ padding: 20, minHeight: 360 }}
                >
                    {children}
                </div>
                </Content>
                <Footer style={{ textAlign: "center" }}>
                <a href="https://www.redboxdigital.id/" rel="noopener" style={{color:'black'}}>Missi Idea Selaras ©2021 Created by Us</a>
                </Footer>
            </Layout>
        </Layout>
    );
}

export default SiderDemo;