import { ISession } from "interfaces/common.interface";
import * as model from "./_model";

export const masterRole = () => {
    return model.master();
}

export const listUsers = () => {
    return model.listUsers();
}

export const masterApps = (session: ISession) => {
    return model.masterApps(session);
}

export const masterDepartment = () => {
    return model.masterDepartment();
}

export const masterDivision = () => {
    return model.masterDivision();
}

export const masterMarriage = () => {
    return model.masterMarriage();
}

export const masterRelation = () => {
    return model.masterRelation();
}

export const masterCompany = () => {
    return model.masterCompany();
}

export const masterReligion = () => {
    return model.masterReligion();
}

export const masterPosition = () => {
    return model.masterPosition();
}

export const masterLevel = () => {
    return model.masterLevel();
}

export const masterEmployee = () => {
    return model.masterEmployee();
}

export const masterEmployee2 = () => {
    return model.masterEmployeeV2();
}

export const masterEducation = () => {
    return model.masterEducation();
}

export const masterShift = () => {
    return model.masterShift();
}

export const masterTimeoff = () => {
    return model.masterTimeoff()
}

export const masterCheckTp = () => {
    return model.masterTypeCheck()
}

export const masterCheckType = () => {
    return model.masterClockType()
}

export const findEmployee = (companyId: number) => {
    return model.findEmployee(companyId)
}

export const masterReimbursementType = () => {
    return model.masterReimType()
}

export const getEmpId = (str: string) => {
    return model.getEmpID(str)
}

export function titleCase(str: any) {
    if(/[A-Z]/.test(str)) {
        let strg = str.replace(/([A-Z])/g, " $1")
        let splitStr = strg.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
        }
        return splitStr.join(' ');
    } else {
        let strg = str.replace(/_/g, ' ')
        let splitStr = strg.toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
        }
        return splitStr.join(' ');
    }
}
// const handler = async (req: NextApiRequest, res: NextApiResponse) => {
//     try {
//         await Cors(req, res)
//         const session = await getLoginSession(req)
//         if (!session) {
//             return res.status(401).json({message: "Unauthorized!"})
//         }

//         if (req.method !== 'GET') {
//             return res.status(403).json({message: "Forbidden!"})
//         } else if(!req.query) {
//             return res.status(403).json({message: "Unknown Type!"})
//         }

//         if(req.query.type === "products") {
//             const data = await getProducts()
//             return res.json(data)
//         }       
//     } catch (err: any) {
//         res.status(500).json({message: err.message})
//     }
// }

// export default protectAPI(handler);
