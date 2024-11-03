export interface IState {
    fallback: {
        '/api/master/division/list': Data
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
        dept: string[]
    }
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

export interface modalState {
    data: {
        description: string,
        department: string
        status: string
    }[],
    isLoading: boolean
    dept: string[],
    form: formModal,
    master: any,
    inputDisabled: boolean
}

export interface formModal {
    description: string
    department: string | null
    head: any
    status: string | null
    id?: string | undefined
}