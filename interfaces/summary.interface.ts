export interface IState {
    fallback: {
        '/api/summary': Data
    }
    data: Data
    columns: []
    access: Access
    isLoading: boolean
    openModal: boolean
    typeModal: string
    dataModal: {}
    modalFilter: boolean,
    filter: Filter
    master: {
        table: string[]
        company: string[]
        department: string[]
        tableFormatter: string[]
    },
    userId: number,
    totalEmp: number,
    totalAtt: number,
    totalDayOff: number,
    totalAbsent: number,
    totalLateIn: number,
    totalEarlyOut: number,
    totalNoCheckOut: number,
    totalDayoff: number,
    totalLeave: number,
    totalSickLeave: number,
    totalDayWork: number,
    // 19 Jul 24
    totalAttendanceAE: number,
    totalAbsentAE: number,
    totalLeaveAE: number,
    totalSickLeaveAE: number,
    totalDWAE: number

    totalAttendancePE: number,
    totalAbsentPE: number,
    totalLeavePE: number,
    totalSickLeavePE: number,
    totalDWPE: number

    totalAttendancePM: number,
    totalAbsentPM: number,
    totalLeavePM: number,
    totalSickLeavePM: number,
    totalDWPM: number
    //
}
export interface IPagination {
    day: string | any
    month: string | any
    week: string | any
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
    department: string
    company: string
    startDate?: any
    endDate?: any
}

interface Access {
    m_insert: number
    m_update: number
    m_delete: number
    m_view: number
    m_export: number
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
    month: string
    week: string
    day: string
    department: string
    company: string
    startDate?: any
    endDate?: any
}