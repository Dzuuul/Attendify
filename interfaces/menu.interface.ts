export interface IState {
    fallback: {
        '/api/menu/list?type=2': any
    },
    data: any,
    columns: [],
    access: Access
    isLoading: boolean,
    openModal: boolean,
    typeModal: string,
    dataModal: {}
    filter: Filter,
    master: {
        role: string[]
    },
    userId: number
}

export interface IStateType {
    access: Access
    isLoading: boolean,
    menuAccess: any,
    form: any
}

interface Access {
    m_insert: number
    m_update: number
    m_delete: number
    m_view: number
}

interface Filter {
    key: string;
    directions: string;
    columns: string
}

export interface IList {
    description: string,
    status: number
}

export interface IForm {
    description: string,
    status: string | number
}

export interface modalState {
    data: {
        username: string,
        password: string
        name: string
    }[],
    isLoading: boolean
    oldId: string | undefined
    form: formModal,
    master?: any,
    userId: number
}

export interface formModal {
    description: string
    path: string 
    status: string | undefined
    id?: string 
}

export interface IInsert extends formModal {
    header : string
    level: string
    icon: string | null  
    sort: string
    sub: string
    userId: number
}