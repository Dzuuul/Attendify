export interface IState {
    fallback: {
        '/api/approval/timeoff/list': Data
    },
    master: {
        shift: [],
        holidays: []
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
    openAdd: boolean,
    typeAdd: string,
    dataAdd: {},
    openFilter: boolean,
    filter: Filter,
}

interface Access {
    m_insert: number
    m_update: number
    m_delete: number
    m_view: number
    m_export?: number
}

interface Data {
    dataPerPage: string | number
    currentPage: string | number
    totalData: string | number
    totalPage: string | number
    list: any
    key: string | null
}

export interface Filter {
    key: string
    directions: string
    columns: string
    startDate?: any
    endDate?: any
    status: string | number
}

export interface modalState {
    isLoading: boolean
    form: formModal
    inputDisabled: boolean
}

export interface formModal {
    reject?: any
    start_date?: any
    end_date?: any
    requestTypeId: any
    requestId: string | number
    id: string
}

export interface modalStateAdd {
    loading: boolean
    master: {
        comp: any,
        emp: any,
        timeoff: any
    },
}

export interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
    startDate?: any
    endDate?: any
    status?: string | number
}