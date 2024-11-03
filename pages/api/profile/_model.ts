import { exeQuery } from "../../../lib/db";
import { formModal, IForm } from "interfaces/profile.interface"; 
import { ISession } from 'interfaces/common.interface';

interface IParams {
    row: string | number
    page: string | number
    key: string
    direction: string
    column: string
    limit: number | string
}

export const list = (params: IParams) => {
    const syntax = `SELECT A.id, A.description, A.status
    FROM mst_job_position A
    WHERE A.is_deleted = 0`
    return exeQuery(syntax, [])
}

export const save = (param: formModal, session: ISession) => {
    const syntax = `UPDATE users SET password = $2, "updatedById" = $3, updated_at = current_timestamp WHERE "employeeId" = $1`;
    return exeQuery(syntax, [param.id, param.new_pass, session.id])
}

export const findOne = (id: number) => {
    const syntax = `SELECT A.id, A.id_employee, A."positionId", A.fullname, A.ktp, A.npwp, A.address, A.address_ktp, A.bpjskes, A.bpjsket, A.emergency_contact, A."marriageId", A.join_date, A.phone, A.birthdate, A.gender, A.age, A."provincesId", A."regencysId", A."districtsId", A.email, A."companyId", A."levelId", A."religionId", A."superiorId", B.name AS regency, C.name AS district, D.name AS province, E.description AS company, F.description AS position, G.description AS level, I.description AS religion, J.fullname AS superior, K.description AS department, L.description AS division
    FROM mst_employee A
    LEFT JOIN mst_code_regency B ON A."regencysId" = B.id
    LEFT JOIN mst_code_district C ON A."districtsId" = C.id
    LEFT JOIN mst_code_province D ON A."provincesId" = D.id
    LEFT JOIN mst_company E ON A."companyId" = E.id
    LEFT JOIN mst_job_position F ON A."positionId" = F.id
    LEFT JOIN mst_job_level G ON A."levelId" = G.id
    LEFT JOIN mst_marriage_status H ON A."marriageId" = H.id
    LEFT JOIN mst_religion I ON A."religionId" = I.id
    LEFT JOIN mst_employee J ON A."superiorId" = J.id
    LEFT JOIN mst_department K ON A."deptId" = K.id
    LEFT JOIN mst_division L ON A."divId" = L.id
    WHERE A.id = $1`;
    return exeQuery(syntax, [id])
}

export const findEdu = (id: number) => {
    const syntax = `SELECT D.id, D."employeeId", D.school, D.major, D.start_year, D.end_year, E.description AS text_edu
    FROM education D
    JOIN mst_education E ON D."educationId" = E.id
    WHERE D."employeeId" = $1`;
    return exeQuery(syntax, [id])
}

export const findFam = (id: number) => {
    const syntax = `SELECT E.id, E."employeeId", E.name AS nameModal, F.description AS name, E."familyId" AS relation, E.ktp AS idcard, E.gender AS gender, E.birthdate AS birthdate
    FROM family_member E
    LEFT JOIN mst_family_status F ON E."familyId" = F.id
    WHERE E."employeeId" = $1`;
    return exeQuery(syntax, [id])
}

export const updateOne = (param: IForm) => {
    const syntax = `UPDATE mst_employee SET 
        npwp = $2,
        address = $3,
        emergency_contact = $4,
        "marriageId" = $5,
        phone = $6,
        birthdate = $7,
        updated_at = current_timestamp
    WHERE id = $1`;
        
    return exeQuery(syntax, [param.id, param.npwp, param.address, param.emergency_contact, param.marriage_id, param.phone, param.birth])
}

export const startTransaction = () => {
    return exeQuery("START TRANSACTION", [])
}

export const commitTransaction = () => {
    return exeQuery("COMMIT", [])
}

export const rollback = () => {
    return exeQuery("ROLLBACK", [])
}