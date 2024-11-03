export interface IState {
    fallback: {
        '/api/shift_transaction/list': Data
    },
    data: Data,
    columns: [],
    access: Access
    master: {
        shift: []
    },
    isLoading: boolean,
    openModal: boolean,
    typeModal: string,
    dataModal: {}
    filter: Filter,
}

export interface IStateType {
    access: Access
    isLoading: boolean,
    menuAccess: any,
    master: {
        shift: []
    }
    form: IForm,
}

interface detailDay {
    sunday?: number,
    monday?: number,
    tuesday?: number,
    wednesday?: number,
    thursday?: number,
    friday?: number,
    saturday?: number,
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

export interface IGetRole {
    description: string | number,
    status: string | number,
    id?: string,
}

export interface IForm {
    shift_id: number | null,
    status: number | null,
    clock_in: any,
    clock_out: any,
    validFrom: string | null,
    workday: string[],
    work_hour: string,
    validTo?: string | null,
    id?: string,
    sunday?: number,
    monday?: number,
    tuesday?: number,
    wednesday?: number,
    thursday?: number,
    friday?: number,
    saturday?: number,
}