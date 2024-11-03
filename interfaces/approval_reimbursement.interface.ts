export interface IState {
    fallback: {
        '/api/approval/request_reimbursement/list': Data
    },
    master: {
        shift: [],
        reimburse: []
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

export interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
    startDate: string
    endDate: string
    isApproved: string | number
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

export interface IForm {
    id: string | number
    receipt_date: string
    amount: number
    description: string
    dtPicture: string
    dtFile: any
    status?: number | null
    reimburseId: number | string
    reject: string
}

export interface ApprovalForm {
    id: string | number
    reimburseId: string | number
    userId: string
    reject: string
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

export interface reimReq {
    employeeId: number
    img: any
    amount: number
    desc: string
}

export interface IMasterForm {
    division: any,
    approval: number | null,
    remType: number | null
    type: number | null,
    status: number | null,
    order?: number,
    id?: string,
    access?: any
}