import { exeQuery } from "@lib/db";

export const masterRoleByApps = (appsId: number) => {
  const syntax = `SELECT id AS key, description AS value, UPPER(A.description) AS label, 'role' AS name
    FROM access A WHERE A.status = '1' AND A."appsId" = ${appsId}`;
  return exeQuery(syntax, []);
};