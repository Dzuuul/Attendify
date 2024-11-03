export interface formatDashboard {
    subtract: number;
    condition: number;
    startDate: string;
    endDate: string;
    media: string;
    key: string;
    column: string;
    direction: string; 
    limitQuery: string;
}

interface Data {
    dataPerPage: string | number
    currentPage: string | number
    totalData: string | number
    totalPage: string | number
    list: any
    key: string | null
}

interface Access {
    // menu_header: number
    // menu: string
    // path: string
    // level: number
    // sub: number
    m_insert: number
    m_update: number
    m_delete: number
    m_view: number
}

interface FilterAssist {
    startDate: string;
    endDate: string;
    monthYear: string;
    type: string;
    condition: string;
    media: string;
}

interface FilterAssist2 {
    startDate: string;
    endDate: string;
    page: string;
    column: string;
    direction: string;
    row: string;
    key: string;
}

export interface InitState {
    fallback: {
        '/api/dashboard/entries': Data
    },
    data: Data,
    columns: [],
    access: Access
    isLoading: boolean,
    openModal: boolean,
    typeModal: string,
    dataModal: {}
    key1: string;
    key2: string;
    filter1: FilterAssist;
    filter2: FilterAssist;
    master: {
        role: string[]
    }
}

export interface StatState {
    fallback: {
        '/api/entstat': Data
    },
    data: Data,
    columns: [],
    access: Access
    isLoading: boolean,
    modalFilter: boolean,
    typeModal: string,
    dataModal: {},
    type: string;
    monthYear: string;
    condition: any;
    startDate: string;
    endDate: string;
    componentData: [],
    componentStatus: [],
    employeeId: any;
    month: string
    master: {
        role: string[],
        employees: string[]
    }
}

export interface DemoState {
    fallback: {
        '/api/entstat': Data
    },
    dataAge: [],
    dataVariant: [],
    dataGender: [],
    dataDistribution: [],
    dataDistributionKtp: [],
    columns: [],
    type: string,
    media: string,
    access: Access,
    isLoading: boolean,
    modalFilter: boolean,
    typeModal: string,
    dataModal: {},
    filter: FilterAssist2;
    master: {
        role: string[]
    }
}