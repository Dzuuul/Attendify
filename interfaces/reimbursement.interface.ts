export interface IState {
    fallback: {
        '/api/reimburse/list': Data
    },
    empId: string | number
    user: any,
    pickedId: any,
    selectedFile: any,
    fileName: string,
    data: Data,
    editData: {},
    columns: [],
    access: Access
    images: string[]
    isLoading: boolean
    openModal: boolean
    openImage: boolean
    openView: boolean
    typeView: string
    dataView: {}
    controlMode: number
    typeModal: string
    dataModal: {}
    filter: Filter,
    itemView: []
    allowed: number
    master: {
        role: string[]
        reimburse: string[]
    }
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
    employeeId: string | number
}

interface EntryTable {
    itemName: string
    quantity: number
    name: string
    price: number
    totalPrice: number
    is_checked: number
    note: string
}

interface IVariant {
    value: string
    name: string
    qty: string | number
    amount: string | number
}

export interface form {
    totalAmount: number | undefined
    remTime: any
    remId: any
    empId: string | undefined
    remType: string | undefined
    remTitle: string | undefined
    desc: string | undefined
    imgs: string | undefined
    url: string | undefined
    isValid: boolean | undefined
    isInvalid: boolean | undefined
    variant: IVariant
    extNote: string | undefined
    created_at: string | undefined
}

export interface IFormError {
    error: boolean
    errorField: string
    errorMessage: string
}

interface invCond {
    invalidId: number | undefined
    invalidText: string | undefined
    duplicateImg: []
    invalidReason: string | undefined
    isDuplicate: number
    isValid: string | number
    replyId: number
}


export interface IEntry {
    access: Access
    user: string | undefined
    form: form
    remId: number | string
    isAdd: boolean
    formError: IFormError
    isLoading: boolean
    modalAdd: boolean
    modalType: string
    modalReject: boolean
    modalAddItem: boolean
    modalCompare: boolean
    master: IMasterRem
    dataTable: EntryTable[]
    totalAmount: number
    editList: {},
    entryCondition: invCond
    invalid_reason: string
    isChecked: boolean,
    profileId: number | string
    noCat: boolean
    stopper: boolean
    allowed: number
    checked: number
    onProcessing: number | string
    userReq: string
}

export interface IMasterRem {
    reimburse: []
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
    startDate: string;
    endDate: string;
    isApproved: string;
}

export interface modalState {
    data: any,
    isLoading: boolean,
    form: IForm
    items: any[]
}

export interface formModal {
    id: string | number
    receipt_date: string
    amount: number
    description: string
    dtPicture: string
    dtFile: any
    status?: number | null
    reimburseId: number | string
}

export interface IForm {
    type: string,
    title: string
    receipt_date: string
    amount: number
    description: string,
    need_approve?: any,
    status_approve?: any,
    reject?: string,
    id?: string,
    extNote?: string
}