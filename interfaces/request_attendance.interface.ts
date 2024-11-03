export interface IState {
    fallback: {
        '/api/attendance/request_attendance/list': Data
    }
    data: Data
    columns: []
    access: Access
    isLoading: boolean
    openModal: boolean
    typeModal: string
    dataModal: {}
    openView: boolean
    typeView: string
    dataView: {}
    filter: Filter
    master: {
        role: string[]
    },
    userId: number,
}

export interface IStateType {
    columns: []
    access: Access
    isLoading: boolean
    menuAccess: any
    master: any
    inputDisabled: boolean
    submitDisabled: boolean
    modalAdd: boolean
    modalType: string
    editList: {}
    isChecked: boolean
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
    page: string | number
    row: string | number
} 

interface Filter {
    key: string
    directions: string
    columns: string
    startDate: string
    endDate: string
}

export interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    startDate: any
    endDate: any
    employeeId: string | number
}

export interface modalState {
    data: any,
    isLoading: boolean,
    form: IForm
}

export interface IForm {
    type: string,
    start_date: string,
    end_date: string,
    start_time?: string,
    end_time?: string,
    description: string,
    need_approve?: any,
    status_approve?: any,
    reject?: string,
    id?: string,
}