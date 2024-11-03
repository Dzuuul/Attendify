import moment from "moment";
import {exeQuery} from "../../../lib/db"
// import dayjs from 'dayjs'

export const parsingIdentity = (nomorNIK: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            nomorNIK = nomorNIK ? nomorNIK : '';
            if (nomorNIK.length == 16) {
                let thisYear = new Date().getFullYear().toString().substr(-2);
                let thisCode = nomorNIK.substr(-4);
                let thisRegion = {
                    provinceCode: nomorNIK.substr(0, 2),
                    regencyCode: nomorNIK.substr(0, 4),
                    districtCode: nomorNIK.substr(0, 6),
                    province: "",
                    regency: "",
                    district: ""
                }
                
                await exeQuery("SELECT id, name FROM mst_code_district WHERE code = $1", [thisRegion.districtCode]).then((res: any) => { 
                    thisRegion.district = res.length < 1 ? "" : res[0].name 
                    thisRegion.districtCode = res.length < 1 ? "" : res[0].id
                })
                await exeQuery("SELECT id, name FROM mst_code_regency WHERE code = $1", [thisRegion.regencyCode]).then((res: any) => { 
                    thisRegion.regency = res.length < 1 ? "" : res[0].name 
                    thisRegion.regencyCode = res.length < 1 ? "" : res[0].id
                })
                await exeQuery("SELECT id, name FROM mst_code_province WHERE code = $1", [thisRegion.provinceCode]).then((res: any) => { 
                    thisRegion.province = res.length < 1 ? "" : res[0].name 
                    thisRegion.provinceCode = res.length < 1 ? "" : res[0].id
                })
                let thisDate = {
                    hari: (parseInt(nomorNIK.substr(6, 2)) > 40) ? parseInt(nomorNIK.substr(6, 2)) - 40 : nomorNIK.substr(6, 2),
                    bulan: nomorNIK.substr(8, 2),
                    tahun: (parseInt(nomorNIK.substr(10, 2)) > 1 && nomorNIK.substr(10, 2) < thisYear) ? "20" + nomorNIK.substr(10, 2) : "19" + nomorNIK.substr(10, 2),
                    lahir: "",
                    age: 0,
                    gender: (parseInt(nomorNIK.substr(6, 2)) > 40) ? "F" : parseInt(nomorNIK.substr(6, 2)) < 40 ? "M" : ""
                }
                thisDate.lahir = `${thisDate.tahun}-${thisDate.bulan}-${thisDate.hari}`
                thisDate.age = parseInt(moment(thisDate.lahir).fromNow(true))
                return resolve({
                    status: '200',
                    nik: nomorNIK,
                    region: thisRegion,
                    date: thisDate,
                    uniq: thisCode,
                    _link: {
                        _wilayah: 'http://www.kemendagri.go.id/pages/data-wilayah'
                    }
                })
            } else {
                throw new Error(`Nomor NIK harus 16 digit`);
            }
        } catch (err) {
            return resolve({
                status: '500',
                message: err
            })
            // resolve.status(500).json({message: err.message})
        }
    })
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