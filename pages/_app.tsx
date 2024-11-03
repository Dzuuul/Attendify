import "antd/dist/antd.css";
import "../styles/globals.css";
import type { ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import { useEffect } from "react";
// import { SessionProvider } from "next-auth/react"
import { AppProvider } from "../context/AppContext";
import { SWRConfig } from "swr";
import Head from "next/head";
import axios from "axios";

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
  // return <Component {...pageProps} />
  const getLayout = Component.getLayout ?? ((page) => page);

  // useEffect(() => {
  //   setToken();
  //   async function setToken() {
  //     try {
  //       const token = await firebaseCloudMessaging.init();
  //       if (token) {
  //         getMessage();
  //       }
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }
  //   function getMessage() {
  //     const messaging = getMessaging();
  //     // console.log({ messaging });
  //     onMessage(messaging, (payload) => {
  //       // console.log('Message received. ', payload);
  //       // ...
  //       const data: any = payload.data;
  //       const { title, body } = JSON.parse(data?.notification);
  //       var options = {
  //         body,
  //       };
  //       self.registration.showNotification(title, options);
  //     });
  //   }
  // });

  return (
    // `session` comes from `getServerSideProps` or `getInitialProps`.
    // Avoids flickering/session loading on first load.
    // <SessionProvider session={session} refetchInterval={5 * 60}>
    <SWRConfig value={{ fetcher: (url) => axios(url).then((r) => r.data) }}>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>ESS - Dashboard</title>
      </Head>
      <AppProvider>{getLayout(<Component {...pageProps} />)}</AppProvider>
    </SWRConfig>
    // </SessionProvider>
  );
}

export default MyApp;
