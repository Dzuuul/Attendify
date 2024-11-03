export interface IState {
    fallback: {
        '/api/employees/list': Data
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
    form: IForm
    master: any
    inputDisabled: boolean
    submitDisabled: boolean
    modalAdd: boolean
    modalType: string
    editList: {}
    entryCondition: invCond
    isChecked: boolean
    //dataTable: EntryTable[]
    dataTable: {
        education: EntryEdu[]
        family: EntryFam[]
    }
    modalFor: string
    relationship: []
    userId: number
}

interface invCond {
    invalidId: number
    duplicateImg: []
    invalidReason: string
    isDuplicate: number
    isValid: string
    replyId: number
}

export interface EntryEdu {
    id: number
    educationId: number
    school: string
    major: string
    from: number
    to: number
    type: string
}

export interface EntryFam {
    id: number
    nameModal: string
    relation: string
    idcardModal: number
    genderModal: string
    birthdateModal: string
    type: string
}

export interface IInvReason {
    key: string
    label: string
    value: string
    name: string
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
    key: string
    directions: string
    columns: string
    department: string | null
    company: string | null
    status: string | null
}

export interface IList {
    description: string
    status: number
}

export interface IForm {
    id: number
    id_employee: string
    companyId: number
    position_id: number
    level_id: number
    fullname: string
    ktp: string | number
    npwp: number
    address: string
    address_ktp: string
    bpjskes: number
    bpjsket: number
    emergency_contact: string | number
    marriage_id: number
    religion_id: number
    join_date: string
    phone: string | number
    birth: string
    gender: string
    age: number
    province_id: number
    regency_id: number
    district_id: number
    email: string
    approval_id: number
    userId: number
    dept_id: number
    regionCode: number
    province: string
    regency: string
    district: string
    resign_date: string
    status: number
    shift_id: number
    div_id: number
    saldo_cuti: number
    saldo_pengobatan: number
}

export interface educationFamilyItf {
    education: any[],
    family: any[]
}

export interface AddItem {
    relationship: any
    mst_education: any
    key: string
    textContent: string
    text_edu: string
    modalFor:string
    dataTable: {
        education: {
            id: number
            educationId: number
            schoolModal: string
            majorModal: string
            fromModal: number
            toModal: number
            type: string
        },
        family: {
            id: number
            nameModal: string
            relation :string
            idcardModal: number
            genderModal: string
            birthdateModal: string
            type: string
        }
    }
    //inputDisabled: boolean
}

export interface IPagination {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
    department: string
    company: string
    status: string
}