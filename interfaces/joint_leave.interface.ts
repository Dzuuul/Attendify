export interface IState {
    fallback: {
        '/api/master/joint_leave/list': Data
    },
    data: Data,
    columns: [],
    access: Access
    isLoading: boolean,
    openModal: boolean,
    typeModal: string,
    dataModal: {}
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
    data: {
        description: string
        date: string
    }[],
    isLoading: boolean
    form: formModal
    inputDisabled: boolean
}

export interface formModal {
    description: string
    date: string
    status: number
    id?: string
    trsData: any
}

export interface TransactionEmployeeLeave {
    jointLeaveId?: string | any
    createdById?: string
    updatedById?: string | any
    date: string
    status: number
    id?: string
}