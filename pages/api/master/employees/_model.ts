import { exeQuery } from "../../../../lib/db";
import { IForm } from "../../../../interfaces/employees.interface";
import { ISession } from 'interfaces/common.interface';

interface IParams {
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

const orderBy = (params: IParams) => {
    const {direction, column} = params
    const directionType =
        direction == "ascend" ? "ASC" : direction == "descend" ? "DESC" : "";
    if (column == "" || directionType == "") {
        return " ORDER BY A.id_employee ASC";
    } else {
        return ` ORDER BY ${column} ${directionType}`;
    }
};

const keyWhere = (params: IParams) => {
    const { key, company } = params
    if (key == "") {
        return "";
    } else {
        return ` AND (UPPER(A.fullname) LIKE '%${key}%' OR UPPER(A.id_employee) LIKE '%${key}%' OR UPPER(B.description) LIKE '%${key}%' OR UPPER(C.description) LIKE '%${key}%')`;
    }
};

const dateWhere = (startDate : string, endDate: string) => {
    if (startDate == "" || endDate == "") {
        return "";
    } else {
        return ` AND DATE(A.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    }
};

const companyWhere = (params : IParams) => {
    const { company } = params
    if (!company) {
        return "";
    } else {
        return `AND A."companyId" = '${company}'`;
    }
};

const deptWhere = (params : IParams) => {
    const { department } = params
    if (!department) {
        return "";
    } else {
        return `AND A."deptId" = '${department}'`;
    }
};

const statusWhere = (params : IParams) => {
    const { status } = params
    if (!status) {
        return "";
    } else {
        return `AND A.status = '${status}'`;
    }
};

const accessIdWhere = (session : ISession) => {
    if (session.accessId == 5) {
        return `AND A."deptId" = '${session.deptId}'`;
    } else {
        return "";
    }
};

export const list = (params: IParams, session: ISession) => {
    const syntax = `SELECT row_number() OVER (ORDER BY A.id) AS number, A.id, A.fullname, A.id_employee, UPPER(B.description) as department, UPPER(C.description) as company, A.phone, A.join_date, A.status, E.description AS shift, F.description AS division
    FROM mst_employee A 
    LEFT JOIN mst_department B ON A."deptId" = B.id
    LEFT JOIN mst_company C ON A."companyId" = C.id
    LEFT JOIN mst_shift E ON A."shiftId" = E.id
    LEFT JOIN mst_division F ON A."divId" = F.id
    WHERE A.is_deleted = 0 ${keyWhere(params)} ${companyWhere(params)} ${deptWhere(params)} ${accessIdWhere(session)} ${statusWhere(params)} ${orderBy(params)}`;
    return exeQuery(syntax, [])
}

export const findOne = (id: number) => {
    const syntax = `SELECT A.id, A.id_employee, A."positionId", A."deptId", A.fullname, A.ktp, A.npwp, A.address, A.address_ktp, A.bpjskes, A.bpjsket, A.emergency_contact, A."marriageId", A.join_date, A.phone, A.birthdate, A.gender, A.age, A."provincesId", A."regencysId", A."districtsId", A.email, A."companyId", A."levelId", A."religionId", A."superiorId", B.name AS regency, C.name AS district, D.name AS province, A.resign_date, A."shiftId", A."divId", A.saldo_cuti, A.saldo_pengobatan
    FROM mst_employee A
    LEFT JOIN mst_code_regency B ON A."regencysId" = B.id
    LEFT JOIN mst_code_district C ON A."districtsId" = C.id
    LEFT JOIN mst_code_province D ON A."provincesId" = D.id
    WHERE A.id = $1`;
    return exeQuery(syntax, [id])
}

export const findWithIdEmp = (param: IForm) => {
    const syntax = `SELECT A.id, A.id_employee, A.fullname, A.ktp, A.npwp, A.address, A.bpjskes, A.bpjsket, A.emergency_contact, A.email
    FROM mst_employee A
    WHERE A.id_employee = $1 AND A.id != $2`;
    return exeQuery(syntax, [param.id_employee, param.id])
}

export const findEdu = (id: number) => {
    const syntax = `SELECT D.id, D."employeeId", D."educationId", F.description AS text_edu, D.school, D.major, D.start_year, D.end_year
    FROM education D
    LEFT JOIN mst_education F ON D."educationId" = F.id
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

export const save = (param: IForm) => {
    const syntax = `INSERT INTO mst_employee (
        id_employee, 
        "companyId",
        "positionId",
        "levelId",
        fullname,
        ktp,
        npwp,
        address,
        address_ktp,
        bpjskes,
        bpjsket,
        emergency_contact,
        "marriageId",
        "religionId",
        join_date,
        phone,
        birthdate,
        gender,
        age,
        "provincesId",
        "regencysId",
        "districtsId",
        email,
        "superiorId",
        "createdById",
        "deptId",
        resign_date,
        status,
        "shiftId",
        "divId",
        saldo_cuti,
        saldo_pengobatan
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)`;
    
    return exeQuery(syntax, [param.id_employee, param.companyId, param.position_id || 'NULL', param.level_id || 'NULL', param.fullname, param.ktp, param.npwp, param.address, param.address_ktp, param.bpjskes, param.bpjsket, param.emergency_contact || 'NULL', param.marriage_id || 'NULL', param.religion_id || 'NULL', param.join_date, param.phone, param.birth, param.gender, param.age, param.province_id || 'NULL', param.regency_id || 'NULL', param.district_id || 'NULL', param.email || 'NULL', param.approval_id || 'NULL', param.userId || 'NULL', param.dept_id || 'NULL', param.resign_date, param.status, param.shift_id || 'NULL', param.div_id, param.saldo_cuti, param.saldo_pengobatan])
}

export const saveEdu = (stx: string) => {
    const syntax = `INSERT INTO education (
        "employeeId",
        "educationId",
        school,
        major,
        start_year,
        end_year,
        "createdById"
    ) VALUES ${stx}`;

    return exeQuery(syntax, [])
}

export const saveFam = (stx: string) => {
    const syntax = `INSERT INTO family_member (
        "employeeId",
        name,
        "familyId",
        ktp,
        gender,
        birthdate,
        "createdById"
    ) VALUES ${stx}`;
    
    return exeQuery(syntax, [])
}

export const deleteEmployee = async (userId: number, id: string) => {
    const syntax = `UPDATE mst_employee SET is_deleted = 1, "updatedById" = $2, updated_at = current_timestamp WHERE id = $1`;
    const syntaxEdu = `UPDATE education SET is_deleted = 1, "updatedById" = $2, updated_at = current_timestamp WHERE "employeeId" = $1`;
    const syntaxFam = `UPDATE family_member SET is_deleted = 1, "updatedById" = $2, updated_at = current_timestamp WHERE "employeeId" = $1`;

    await exeQuery(syntaxFam, [id, userId])
    await exeQuery(syntaxEdu, [id, userId])
    return exeQuery(syntax, [id, userId])
}

export const updateOne = (param: IForm) => {
    const syntax = `UPDATE mst_employee SET 
        "positionId" = $2,
        fullname = $3,
        ktp = $4,
        npwp = $5,
        address = $6,
        bpjskes = $7,
        bpjsket = $8,
        emergency_contact = $9,
        "marriageId" = $10,
        join_date = $11,
        phone = $12,
        birthdate = $13,
        gender = $14,
        age = $15,
        "provincesId" = $16,
        "regencysId" = $17,
        "districtsId" = $18,
        email = $19,
        "companyId" = $20,
        "levelId" = $21,
        "religionId" = $22,
        address_ktp = $23,
        "superiorId" = $24,
        "updatedById" = $25,
        updated_at = current_timestamp,
        resign_date = $26,
        status = $27,
        "deptId" = $28,
        "shiftId" = $29,
        "divId" = $30,
        saldo_cuti = $31,
        saldo_pengobatan = $32
    WHERE id = $1`;
        
    return exeQuery(syntax, [param.id, param.position_id, param.fullname, param.ktp, param.npwp, param.address, param.bpjskes, param.bpjsket, param.emergency_contact, param.marriage_id, param.join_date, param.phone, param.birth, param.gender, param.age, param.province_id, param.regency_id, param.district_id, param.email, param.companyId, param.level_id, param.religion_id, param.address_ktp, param.approval_id, param.userId, param.resign_date || 'NULL', param.status, param.dept_id, param.shift_id || 'NULL', param.div_id, param.saldo_cuti, param.saldo_pengobatan])
}

export const updateEdu = (param: any) => {
    const syntax = `UPDATE education SET
        school = $2,
        major = $3,
        start_year = $4,
        end_year = $5,
        updated_at = current_timestamp
    WHERE id = $1`;

    return exeQuery(syntax, [param.id, param.schoolModal, param.majorModal, param.fromModal, param.toModal])
}

export const updateFam = (param: any) => {
    const syntax = `UPDATE family_member SET
        name = $2,
        "familyId" = $3,
        ktp = $4,
        gender = $5,
        birthdate = $6,
        updated_at = current_timestamp
    WHERE id = $1`;

    return exeQuery(syntax, [param.id, param.nameModal, param.relation, param.idcardModal, param.genderModal, param.birthdateModal])
}

export const deleteEdu = async (id: number) => {
    const syntaxEdu = `DELETE FROM education WHERE id = $1`

    return await exeQuery(syntaxEdu, [id])
}

export const deleteFam = async (id: number) => {
    const syntaxFam = `DELETE FROM family_member WHERE id = $1`

    return await exeQuery(syntaxFam, [id])
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

export const getNewEmpId = () => {
    const syntax = `SELECT MAX(id) AS lastid FROM mst_employee`;
    return exeQuery(syntax, [])
}

export const getLastId = (id: number) => {
    const syntax = `SELECT A.id_employee FROM mst_employee A WHERE id = $1`;
    return exeQuery(syntax, [id])
}

export const findDuplicate = (param: IForm) => {
    const syntax = `SELECT 1 FROM mst_employee A WHERE A.ktp = $1 AND A.is_deleted = 0` ;
    return exeQuery(syntax, [param.ktp])
}

export const findDuplicateEmail = (param: IForm) => {
    const syntax = `SELECT 1 FROM mst_employee A WHERE A.email = $1 AND A.is_deleted = 0`;
    return exeQuery(syntax, [param.email || ""])
}

export const findDuplicatePhone = (param: IForm) => {
    const syntax = `SELECT 1 FROM mst_employee A WHERE A.is_deleted = 0 AND A.phone = $1 OR A.emergency_contact = $2`;
    return exeQuery(syntax, [param.phone || "", param.emergency_contact || ""])
}

export const findDuplicateKtp = (param: IForm) => {
    const syntax = `SELECT id FROM mst_employee A WHERE A.ktp = $1 and A.id != $2 AND A.is_deleted = 0`;
    return exeQuery(syntax, [param.ktp, param.id])
}

export const getProvinceId = (param: IForm) => {
    const syntax = `SELECT id FROM mst_code_province A WHERE A.code = $1`;
    return exeQuery(syntax, [param.province_id])
}

export const getRegencyId = (param: IForm) => {
    const syntax = `SELECT id FROM mst_code_regency A WHERE A.code = $1`;
    return exeQuery(syntax, [param.regency_id])
}

export const getDistrictId = (param: IForm) => {
    const syntax = `SELECT id FROM mst_code_district A WHERE A.code = $1`;
    return exeQuery(syntax, [param.district_id])
}