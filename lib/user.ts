// import crypto from 'crypto';
// import { v4 as uuidv4 } from 'uuid';
import { exeQuery } from "./db";
import * as bcrypt from "bcryptjs";

/**
 * User methods. The example doesn't contain a DB, but for real applications you must use a
 * db here, such as MongoDB, Fauna, SQL, etc.
 */

interface IUser {
  username: string;
  name: string;
  password: string;
  accessId: number;
  role: string;
}

const users: any = []

// Here you should lookup for the user in your DB
export async function findUser({ username }: {username: string}) {
  // // This is an in memory store for users, there is no data persistence without a proper DB
  // return users.find((user: any) => user.username === username)

  const query = `SELECT A.id, A.username, A."employeeId" AS emp, E.description AS companyName, D.saldo_cuti, A.password, B."accessId", A.fullname, C.description AS role, D."deptId", D."divId", C."appsId"
  FROM users A
  JOIN access_apps B ON A.id = B."usersId"
  JOIN access C ON B."accessId" = C.id
  LEFT JOIN mst_employee D ON A."employeeId" = D.id
  LEFT JOIN mst_company E ON D."companyId" = E.id
  WHERE username = $1 AND is_enabled = 1 AND B."appsId" = 1 AND B.status = 1 AND B.is_deleted = 0`;

  const findUser = await exeQuery(query, [username]);

  if (findUser) {
    return findUser[0]
  }

  return null
}

// Compare the password of an already fetched user (using `findUser`) and compare the
// password for a potential match
export function validatePassword(user: IUser, inputPassword: string) {
  const passwordsMatch = bcrypt.compareSync(inputPassword, user.password)
  return passwordsMatch
}