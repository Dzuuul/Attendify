export interface IState {
    fallback: {
        '/api/master/department/list': Data
    },
    data: Data,
    columns: [],
    access: Access
    isLoading: boolean,
    openModal: boolean,
    typeModal: string,
    dataModal: {}
    filter: Filter,
    master: {
        role: string[]
        employee: string[]
    }
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

interface Data {
    dataPerPage: string | number
    currentPage: string | number
    totalData: string | number
    totalPage: string | number
    list: any
    key: string | null
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
    status: string | number,
    id?: string,
    head: string,
    access?: any
}

export interface modalState {
    data: any,
    isLoading: boolean,
    oldId: string,
    master: {
        employee: any
    },
    form: {
        description: string,
        head: string | null,
        status: string,
        id: undefined
    }
}