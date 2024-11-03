import { ReactElement, useEffect, useMemo, useState } from "react";
import React, { useCallback } from "react";
import { GetServerSideProps } from "next";
import { getLoginSession } from "../../lib/auth";
import { NextApiRequest } from "next";
import { useRouter } from "next/router";
import { Form, Input, Button, Row, Col, Typography } from "antd";
import Image from "next/image";
import Logo from "../../public/img/Logo-01.png";
import { getMenu } from "../api/menu/list";

interface FormData {
  username: string;
  password: string;
  remember: boolean;
}

interface LoginPageProps {}

const Login = (props: any) => {
  const router = useRouter();

  const onFormSubmit = useCallback(async (values: FormData): Promise<void> => {
      try {
          const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(values),
          })

          if (res.status === 200) {
              router.push('/login/redirect')
          } else {
              throw new Error(await res.text())
          }
      } catch (error) {
          if (error instanceof Error) {
              console.error('An unexpected error happened occurred:', error)
              alert(error.message)
          }
      }
  },[])

  const { Title } = Typography;

  return (
    <>
      <Row
        style={{
        height: "100vh",
        textAlign: "center",
         backgroundColor:"#fff",
         backgroundImage: `url(/img/bg@2x.jpg)`,
         backgroundSize: "cover",
         backgroundPosition: "center"
        }}
        justify="center"
        align="middle"
      >
        <div className={"custom-form-card"}
>
          <Row style={{paddingBottom: '25px', paddingTop: '25px'}} justify="center" align="middle">
            <Col span={16}>
            <div style={{width: "180px", margin: "auto"}}>
              <Image
                alt={"background.png"}
                src={Logo}
              />
            </div>
              <Title level={5}>Employee Self-Service <br/> LOGIN</Title>
            </Col>
          </Row>
          <div 
            className={"custom-form"}
          >
              <Form
                name="normal_login"
                className="login-form"
                onFinish={onFormSubmit}
              >
                <Form.Item
                  name="username"
                  rules={[
                    {
                      required: true,
                      message: "Please input your Username!",
                    },
                  ]}
                >
                  <Input
                    style={{ borderRadius: "8px" }}
                    className={"custom-input"}
                    name="username"
                    placeholder="Username"
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: "Please input your Password!",
                    },
                  ]}
                >
                  <Input.Password
                    style={{ borderRadius: "8px" }}
                    name="password"
                    className={"custom-input"}
                    type="password"
                    placeholder="Password"
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    htmlType={"submit"}
                    className={"custom-button"}
                    // loading={isLoading}
                  >
                    Log In
                  </Button>
                </Form.Item>
              </Form>
          </div>
        </div>
      </Row>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getLoginSession(ctx.req as NextApiRequest)

  interface IMenu {
    menu_header: number;
    menu: string;
    path: string;
    level: number;
    sub: number;
    icon: string | null;
    m_insert: number;
    m_delete: number;
    m_update: number;
    m_view: number;
  }

  if (session) {
    const menus = (await getMenu(session)) as IMenu[];

    var path = "";
    for (let index = 0; index < menus.length; index++) {
      const nextSub = menus[index + 1] ? menus[index + 1].sub : "";
      if (menus[index].sub == 0 && nextSub == 0) {
        path = `${menus[index].path}`;
        break;
      }

      if (menus[index].sub == 0 && menus[index + 1].sub == 1) {
        path = `${menus[index + 1].path}`;
        break;
      }
    }

    return {
      redirect: {
        destination: path,
        permanent: false,
      },
      props: { session },
    };
  }

  return {
    props: {},
  };
};

export default Login;

Login.getLayout = function getLayout(page: ReactElement) {
  return <>{page}</>;
};
