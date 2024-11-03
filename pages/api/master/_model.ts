import { ISession } from "interfaces/common.interface";
import { exeQuery } from "../../../lib/db";

const accessIdWhere = (session : ISession) => {
  if (session.accessId != 1) {
    if (session.accessId == 8) {
      return `AND A.id = 2`;
    }
    return `AND A.id = '${session.appsId}'`;
  } else {
      return "";
  }
};

export const master = () => {
  const syntax = `SELECT id AS key, description AS value, UPPER(A.description) AS label, 'role' AS name
    FROM access A WHERE A.status = '1'`;
  return exeQuery(syntax, []);
};

export const masterRoleByApps = (appsId: number) => {
  const syntax = `SELECT id AS key, description AS value, UPPER(A.description) AS label, 'role' AS name
    FROM access A WHERE A.status = '1' AND A."appsId" = ${appsId}`;
  return exeQuery(syntax, []);
};

export const listUsers = () => {
  const syntax = `SELECT A.id AS key, A.id AS value, CASE WHEN A."employeeId" IS NULL THEN A.username ELSE CONCAT(A.username, ' - ', UPPER(B.fullname)) END AS label, 'users' AS name 
  FROM users A 
  LEFT JOIN mst_employee B ON A."employeeId" = B.id
  WHERE A.is_enabled = '1' ORDER BY A.username DESC`;
  return exeQuery(syntax, []);
};

export const masterApps = (session: ISession) => {
  const syntax = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'apps' AS name 
  FROM mst_apps A 
  WHERE A.status = '1' AND A.is_deleted = '0' ${accessIdWhere(session)} ORDER BY A.description ASC`;
  return exeQuery(syntax, []);
};

export const masterDepartment = () => {
  const syntax = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'department' AS name 
  FROM mst_department A 
  WHERE A.status = '1' AND A.is_deleted = '0' ORDER BY A.description ASC`;
  return exeQuery(syntax, []);
};

export const masterDivision = () => {
  const syntax = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'division' AS name 
  FROM mst_division A 
  WHERE A.status = '1' AND A.is_deleted = '0' ORDER BY A.description ASC`;
  return exeQuery(syntax, []);
};

export const masterMarriage = () => {
  const syntax = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'marriage' AS name
    FROM mst_marriage_status A WHERE A.status = '1' AND A.is_deleted = '0' ORDER BY A.id`;
  return exeQuery(syntax, []);
};

export const masterRelation = () => {
  const syntax = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'relation' AS name
    FROM mst_family_status A WHERE A.status = '1' AND A.is_deleted = '0' ORDER BY A.description ASC`;
  return exeQuery(syntax, []);
};

export const masterCompany = () => {
  const syntax = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'company' AS name
    FROM mst_company A WHERE A.status = '1' AND A.is_deleted = '0' ORDER BY A.description ASC`;
  return exeQuery(syntax, []);
};

export const masterReligion = () => {
  const syntax = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'religion' AS name
    FROM mst_religion A WHERE A.status = '1' AND A.is_deleted = '0' ORDER BY A.description ASC`;
  return exeQuery(syntax, []);
};

export const masterPosition = () => {
  const syntax = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'position' AS name
    FROM mst_job_position A WHERE A.status = '1' AND A.is_deleted = '0' ORDER BY A.description ASC`;
  return exeQuery(syntax, []);
};

export const masterLevel = () => {
  const syntax = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'level' AS name
    FROM mst_job_level A WHERE A.status = '1' AND A.is_deleted = '0' ORDER BY A.description ASC`;
  return exeQuery(syntax, []);
};

export const masterEmployee = () => {
  const syntax = `SELECT A.id AS key, A.id AS value, A.fullname AS label, 'approval' AS name
    FROM mst_employee A WHERE A.is_deleted = '0' ORDER BY A.fullname`;
  return exeQuery(syntax, []);
};

export const masterEmployeeV2 = () => {
  const syntax = `SELECT A.id AS key, A.id AS value, A.fullname AS label, 'employeeId' AS name
    FROM mst_employee A WHERE A.is_deleted = '0' ORDER BY A.fullname`;
  return exeQuery(syntax, []);
};

export const masterEducation = () => {
  const syntax = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'educationId' AS name
    FROM mst_education A WHERE A.status = '1' AND A.is_deleted = '0' ORDER BY A.id`;
  return exeQuery(syntax, []);
};

export const masterShift = () => {
  const syntax = `SELECT A.id AS key, A.id AS value, UPPER(A.description) AS label, 'shiftId' AS name
    FROM mst_shift A
    JOIN mst_shift_det B ON B."shiftId" = A.id
    WHERE A.status = '1' AND A.is_deleted = '0' AND B.status = '1' AND B.is_enabled = '1'
    ORDER BY UPPER(A.description)`;
  return exeQuery(syntax, []);
};

export const masterTimeoff = () => {
  const stx = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'timeoffId' AS name
  FROM mst_request_type A WHERE A.tipe != '1' AND A.is_deleted = '0' ORDER BY A.id`
  return exeQuery(stx, [])
}

export const masterTypeCheck = () => {
  const stx = `SELECT id AS key, id AS value, UPPER(A.desc_index) AS label, 'chkType' AS name
  FROM mst_request_type A WHERE A.is_deleted = '0' ORDER BY A.id`
  return exeQuery(stx, [])
}

export const masterReimType = () => {
    const stx = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'remType' AS name
    FROM mst_reimburse_type A WHERE A.is_deleted = '0' AND A.status = 1 ORDER BY A.id`
  return exeQuery(stx, [])
}

export const masterClockType = () => {
  const stx = `SELECT id AS key, id AS value, UPPER(A.description) AS label, 'timeoffId' AS name, (CASE WHEN status = 1 THEN FALSE ELSE TRUE END) as disabled, need_apprv
  FROM mst_request_type A WHERE A.tipe = '1' AND A.is_deleted = '0' AND A.description != 'EARLY OUT' ORDER BY A.id`
  return exeQuery(stx, [])
}

export const findHeadHRD = () => {
  const stx = `SELECT "headId" from mst_division WHERE description LIKE '%HR & GA%'`
  return exeQuery(stx, [])
}

export const findEmployee = (companyId: number) => {
    const stx = `
        SELECT A.id AS key, A.id AS value, A.fullname AS label, 'employee' AS name FROM mst_employee A WHERE A.status = 1 AND A.is_deleted = '0' AND "companyId" = $1 ORDER BY A.fullname
    `
  return exeQuery(stx, [companyId])
}

export const getEmpID = (str: string) => {
  const stx = `SELECT id FROM mst_employee WHERE id_employee = $1`
  return exeQuery(stx, [str])
}