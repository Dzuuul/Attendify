export interface IState {
    fallback: {
        '/api/profile/list': Data
    }
    data: Data
    columns: []
    access: Access
    isLoading: boolean
    openModal: boolean
    confirmModal: boolean
    typeModal: string
    dataModal: {}
    filter: Filter
    userId: number,
    inputDisabled: boolean,
    userModify: boolean,
    form: IForm,
    master: {
        marriage: []
    },
    dataTable: {
        education: EntryEdu[]
        family: EntryFam[]
    }
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

export interface educationFamilyItf {
    education: any[],
    family: any[]
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
        id: number
        old_pass: string
    }[],
    isLoading: boolean
    form: formModal
    inputDisabled: boolean
    status: boolean | null
}

export interface formModal {
    old_pass: string
    new_pass: string
    id: number
}

export interface IForm {
    id: number
    id_employee: string
    fullname: string
    companyId: number
    position_id: number
    level_id: number
    religion_id: number
    marriage_id: number
    marriage_txt: string
    approval_id: number
    email: string
    phone: string | number
    ktp: string | number
    emergency_contact: string | number
    address: string
    address_ktp: string
    regionCode: number
    province_id: number
    district_id: number
    regency_id: number
    province: string
    regency: string
    district: string
    age: number
    gender: string
    birth: string
    npwp: number
    bpjskes: number
    bpjsket: number
    join_date: string
    userId: number
}