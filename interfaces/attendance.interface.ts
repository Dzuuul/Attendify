export interface IState {
    fallback: {
        '/api/attendance/list': Data
    }
    data: Data
    columns: []
    access: Access
    isLoading: boolean
    openModal: boolean
    typeModal: string
    dataModal: {}
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
    start: any,
    end: any,
    offType: number,
    desc: string,
    showTime?: boolean
    master: {
        typeAtt: any
    },
}

export interface attReq {
    employeeId: number
    type: number
    start: any
    start_time: any
    end: any
    end_time: any
    desc: string
}