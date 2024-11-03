import { exeQuery } from '../../../lib/db';
import { ISession } from 'interfaces/common.interface';

const accessIdWhere = (session: ISession) => {
    if (session.accessId != 11 && session.accessId != 12) {
        return `AND C."usersId" = ${session.id}`;
    } else {
        return `AND C."accessId" = 13`;
    }
};

export const loginEdoc = (username: string) => {
    const syntax = `
        SELECT A.id, A.username, A.password, B."accessId", A.fullname, C.description AS role 
        FROM users A
        JOIN access_apps B ON A.id = B."usersId"
        JOIN access C ON B."accessId" = C.id
        WHERE A.username = $1 AND A.is_enabled = 1 AND B."appsId" = 2
    `;
    return exeQuery(syntax, [username]);
};

export const getMenu = (username: string) => {
    const syntax = `SELECT D.id AS menu_header, D.description AS menu, D.path, D.level, D.header AS sub, D.icon, C.m_insert, C.m_update, C.m_delete, C.m_view, C.m_export, C.m_import 
        FROM users A
        JOIN access_apps B ON A.id = B."usersId"
        JOIN access_det C ON B."accessId" = C."accessId"
        JOIN menu D ON C."menuId" = D.id
        WHERE A.username = $1 AND B."appsId" = 2 AND D."appsId" = 2 AND C.m_view = 1 ORDER BY D.sort
    `;
    return exeQuery(syntax, [username]);
};

export const getPageCheck = (username: string, path: string) => {
    const syntax = `SELECT D.id AS menu_header, D.description AS menu, D.path, D.level, D.header AS sub, D.icon, C.m_insert, C.m_update, C.m_delete, C.m_view, C.m_export, C.m_import 
        FROM users A
        JOIN access_apps B ON A.id = B."usersId"
        JOIN access_det C ON B."accessId" = C."accessId"
        JOIN menu D ON C."menuId" = D.id
        WHERE A.username = $1 AND B."appsId" = 2 AND C.m_view = 1 AND D.path = $2
    `;
    return exeQuery(syntax, [username, path]);
};

export const getPIC = (session: ISession) => {
    const syntax = `SELECT A.id AS key, B.id AS value, A.fullname AS label, 'pic_missi' AS name
        FROM mst_employee A 
        JOIN users B ON A.id = B."employeeId"
        JOIN access_apps C ON B.id = C."usersId"
        WHERE A.is_deleted = 0 AND C."appsId" = 2 ${accessIdWhere(session)}
        ORDER BY A.fullname
    `;
    return exeQuery(syntax, []);
};

export const getPICDetail = (picId: number) => {
    const syntax = `SELECT A.fullname AS "name", A.phone, A.email
        FROM mst_employee A
        JOIN users B ON A.id = B."employeeId"
        WHERE B.id = $1 AND A.is_deleted = 0
    `;
    return exeQuery(syntax, [picId]);
};

export const getRoleAdminPhone = (picId: number) => {
    const syntax = `SELECT A.fullname AS "name", A.phone
        FROM mst_employee A 
        WHERE A.id = $1 AND A.is_deleted = 0
    `;
    return exeQuery(syntax, [picId]);
};

export const getApprvProject = () => {
    const syntax = ` SELECT A.id AS key, A."employeeId" AS value, A.fullname AS label, 'approval' AS name, A.id AS"usersId"
        FROM users A 
        JOIN access_apps B ON A.id = B."usersId"
        WHERE B."accessId" = 14 AND B."appsId" = 2 AND A.is_enabled = 1
        ORDER BY A.fullname
    `;
    return exeQuery(syntax, []);
};

export const findApprv = (id: number) => {
    const syntax = `SELECT A."usersId", A."accessId", B."employeeId", B.fullname
        FROM access_apps A
        JOIN users B ON A."usersId" = B.id
        WHERE A."appsId" = 2 AND A."usersId" = $1
    `;
    return exeQuery(syntax, [id]);
};

export const getContactByRole = (roleId: number) => {
    const syntax = `SELECT B.id AS "usersId", C.fullname, C.phone, C.email
    FROM access_apps A
    JOIN users B ON A."usersId" = B.id
    JOIN mst_employee C ON B."employeeId" = C.id
    WHERE A."accessId" = $1 AND A.status = 1 AND A.is_deleted = 0
    `;
    return exeQuery(syntax, [roleId]);
};

export const startTransaction = () => {
    return exeQuery('START TRANSACTION', []);
};

export const commitTransaction = () => {
    return exeQuery('COMMIT', []);
};

export const rollback = () => {
    return exeQuery('ROLLBACK', []);
};
