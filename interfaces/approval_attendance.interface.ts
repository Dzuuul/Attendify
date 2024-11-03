export interface IState {
    fallback: {
        '/api/approval/timeoff/list': Data
    },
    master: {
        shift: []
    },
    data: Data,
    columns: [],
    access: Access
    isLoading: boolean,
    openModal: boolean,
    typeModal: string,
    dataModal: {}
    openView: boolean,
    typeView: string,
    dataView: {}
    filter: Filter,
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
    isLoading: boolean
    form: formModal
    inputDisabled: boolean
}

export interface formModal {
    start_time?: string
    end_time?: string
    reject?: any
    requestTypeId: any
    requestId: string | number
    description?: string
    id: string
}