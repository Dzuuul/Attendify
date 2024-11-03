import { exeQuery } from "../../../lib/db";
import { IInsert } from "../../../interfaces/menu.interface";

export const getMenu = (username: string) => {
  const syntax = `SELECT E.id menu_header, E.description menu, E.path, E.level, E.header sub, E.icon, D.m_insert, D.m_update, D.m_delete, D.m_view
    FROM users A
    LEFT JOIN access_apps B ON A.id = B."usersId"
    LEFT JOIN "access" C ON B."accessId" = C.id
    LEFT JOIN access_det D ON C.id = D."accessId"
    LEFT JOIN menu E ON D."menuId" = E.id
    WHERE A.username = $1 AND B."appsId" = 1 AND E."appsId" = 1 AND D.m_view = 1
    ORDER BY E.sort`;

  return exeQuery(syntax, [username]);
};

export const listAll = (type: string | number) => {
  var whereStatus = "";
  if (type == 1) {
    whereStatus = ` AND A.status = '1' `;
  }

  var syntax = `SELECT A.id menu_header, A.description menu, level, header sub, 0 AS m_insert, 0 AS m_update,
    0 AS m_delete, 0 AS m_view, 0 AS sort, 0 AS access_det_id, path, A.status, A.sort
    FROM menu A WHERE 1 = 1 ${whereStatus} ORDER BY A.sort ASC`;

  return exeQuery(syntax, []);
};

export const findOneRole = (description: string) => {
  const syntax = `SELECT id FROM access A WHERE A.description = $1`;
  return exeQuery(syntax, [description]);
};

export const listLeftAccess = (accessId: string) => {
  const syntax = `SELECT A.id menu_header, A.description menu, A.path, A.level, A.header sub, B.id AS access_det_id, 
    B.m_insert, B.m_update, B.m_delete, B.m_view, A.sort
    FROM menu A
    LEFT JOIN (SELECT id, m_insert, m_update, m_delete, m_view, "menuId" FROM access_det WHERE access_det."accessId" = $1) B 
    ON B."menuId" = A.id ORDER BY A.sort`;

  return exeQuery(syntax, [accessId]);
};

export const findOne = (param: IInsert) => {
  const syntax = `SELECT A.description headDesc, A.level headLevel, A.path headPath,
    B.description childDesc, B.level childDesc, B.header childDesc, B.path childPath, B.status childStatus
    FROM menu A, menu B WHERE A.id = B.header AND A.description = $1`;
  return exeQuery(syntax, [param.description]);
};

export const save = (param: IInsert) => {
  const syntax = `INSERT INTO menu (description, status, path, header, level, icon, sort, "createdById") 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
  return exeQuery(syntax, [
    param.description,
    param.status || "",
    param.path,
    param.header,
    param.level,
    param.icon || 'null',
    param.sort,
    param.userId
  ]);
};

export const findLatestMenu = (header: string) => {
  var whereHeader = "";
  if (header) {
    whereHeader = `WHERE id = ${header}`;
  }

  const syntax = `SELECT sort FROM menu ${whereHeader} ORDER BY sort DESC LIMIT 1`;
  return exeQuery(syntax, []);
};

export const getMenuId = (param: { sort: any }) => {
  const syntax = `SELECT id, sort FROM menu WHERE sort > $1`;
  return exeQuery(syntax, [param.sort]);
};

export const updateManySort = (stx: string) => {
  var syntax = `UPDATE menu SET sort = CASE id ${stx}`;
  return exeQuery(syntax, []);
};

export const findIdMenu = (param: IInsert) => {
  const syntax = `SELECT id FROM menu A WHERE A.description = $1`;
  return exeQuery(syntax, [param.description]);
};

export const deleteOne = (id: string) => {
  const syntax = `DELETE FROM menu WHERE id = $1 OR header = $2`;
  return exeQuery(syntax, [id, id]);
};

export const updateOne = (param: IInsert) => {
  const syntax = `UPDATE menu SET description = $1, status = $2, path = $3, header = $4, 
    level = $5, icon = $6, "updatedById" = $7, updated_at = current_timestamp WHERE description = $8`;
  return exeQuery(syntax, [
    param.description,
    param.status || '',
    param.path,
    param.sub,
    param.level,
    param.icon ? param.icon : "",
    param.userId,
    param.id || "",
  ]);
};

export const startTransaction = () => {
  return exeQuery("START TRANSACTION", []);
};

export const commitTransaction = () => {
  return exeQuery("COMMIT", []);
};

export const rollback = () => {
  return exeQuery("ROLLBACK", []);
};
