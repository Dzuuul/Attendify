import axios from "axios";
import React, { createContext, useContext, ReactNode, useReducer } from "react";

type appContextType = {
    statesContex: {
        menu: [{ menu_header: number,
        menu: string,
        path: string,
        level: number,
        sub: number,
        icon: string | null,
        m_insert: number,
        m_update: number,
        m_delete: number,
        m_view: number }],
        username: string
        isLogin: boolean
        submitNotif: {
            type: string,
            message: string,
            description: string
        }
    },
    setUsername: (username: string) => void,
    setMenu: (menu: any) => void,
    setLogin: () => void,
    setSubmitNotif: ({type, message, description }: {type: string, message: string, description: string}) => void
};

const appContextDefaultValues: appContextType = {
    statesContex: {
        menu: [{ menu_header: 0,
            menu: "",
            path: "",
            level: 0,
            sub: 0,
            icon: null,
            m_insert: 0,
            m_update: 0,
            m_delete: 0,
            m_view: 0 }],
        username: "",
        isLogin: false,
        submitNotif: {
            type: "",
            message: "",
            description: ""
        }
    },
    setUsername: () => {},
    setMenu: () => {},
    setLogin: () => {},
    setSubmitNotif: () => {}
};

const AppContext = createContext<appContextType>(appContextDefaultValues);

export function useApp() {
    return useContext(AppContext);
}

type Props = {
    children: ReactNode;
};

export function AppProvider(props: any) {
    const [statesContex, setStates] = useReducer((statesContex: any, newState: Partial<any>) => ({ ...statesContex, ...newState }), {
        menu: [],
        username: "",
        isLogin: false,
        submitNotif: {
            type: "",
            message: "",
            description: ""
        }
    },)

    const setSubmitNotif = ({type, message, description}: {type: string, message: string, description: string}) => {
        setStates({
            submitNotif: {
                type,
                message,
                description
            }
        })
    }

    const setUsername = (username: string) => {
        setStates({
            username
        })
    }

    const setMenu = (menu: any) => {
        setStates({
            menu: ""
        })
    }

    const setLogin = () => {
        setStates({
            isLogin: !statesContex.isLogin
        })
    }

    const value = {
        statesContex,
        setUsername,
        setMenu,
        setStates,
        setLogin,
        setSubmitNotif
    };

    return (
        <>
            <AppContext.Provider value={value}>
                {props.children}
            </AppContext.Provider>
        </>
    );
}