export interface IState {
    fallback: {
        '/api/master/approval_joint_leave/list': Data
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
        users: string[]
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

export interface IForm {
    userId: any,
    approvalId: number | null,
    status: number | null,
    order?: number,
    id?: string,
    access?: any
}

export interface modalState {
    data: any,
    isLoading: boolean,
    oldId: string,
    master: {
        users: any,
        employee: any
    },
    form: IForm
}