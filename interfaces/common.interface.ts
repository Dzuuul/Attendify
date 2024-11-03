export interface ISession {
    id: string
    username: string;
    email?: string;
    companyname: string;
    saldo_cuti: number;
    name: string;
    emp: number;
    fullname: string;
    password?: string;
    accessId: number;
    role: string;
    employee_id: string
    employeeId: string | null
    createdAt?: number;
    maxAge?: number;
    deptId?: number
    divId?: number
    appsId: number
}