export interface IState {
    fallback: {
        '/api/role/list': Data
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
    }
}

export interface IStateType {
    access: Access
    isLoading: boolean,
    menuAccess: any,
    form: any,
    userId: number
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
    access?: any
}