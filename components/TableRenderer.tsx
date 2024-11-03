import moment from 'moment'
import Tag from 'antd/lib/tag'
import Typography from 'antd/lib/typography'

const { Text } = Typography
const hari = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const timeConvert = (d: number) => {
    d = Number(d);
    let h = Math.floor(d / 3600);
    let m = Math.floor(d % 3600 / 60);
    let s = Math.floor(d % 3600 % 60);

    let hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    let mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    let sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay + sDisplay;
}

export function TableRenderer(array: any, formatter: any) {
    const title4Date = (x: any) => formatter.find(({key}: any) => key === parseInt(x))
    let rry = array.map((item: any, idx: any) => {
        let date = moment(item.dataIndex)
        return item?.title?.toLowerCase()?.split(" ")?.includes("id") ? {} :
            (
                {
                    title: <Text type={item.red ? 'danger' : undefined}>{item.title}</Text>,
                    dataIndex: item.dataIndex,
                    key: item.key,
                    sorter: item.sorter,
                    children: item.children,
                    render: 
                        item.dataIndex === 'rcvd_time' ?
                            (x: any) => `${moment(x).format('DD/MM/YYYY HH:mm:ss')}` :
                            item.dataIndex === 'created_at' ?
                                (x: any) => `${moment(x).format('DD/MM/YYYY HH:mm:ss')}` :
                                item.dataIndex === 'is_valid' ?
                                    (x: string) => x == '1' ? <Tag color="success">VALID</Tag> : x == '0' ? <Tag color="error">INVALID</Tag> : '-' :
                                    item.dataIndex === 'check_in' || item.dataIndex === 'check_out' ?
                                    (x: string) => x ? `${moment(x).format('HH:mm:ss')}` : '-' :
                                    item.dataIndex === 'check_type' ?
                                    (x: string) => x ? x : '-' :
                                    item.dataIndex === 'duration' ?
                                    (x: number) => x? timeConvert(x) : '-' :
                                    hari.indexOf(item.dataIndex) !== -1 || !isNaN(item.dataIndex) || date.isValid() ?
                                    
                                    (x: string) =>
                                    <Text type={item.red ? 'danger' : undefined}>{title4Date(x)?.label || (moment(item.title).isBefore(moment()) && !item.red ? 'A' : '-')}</Text> 

                                    :
                                    item.dataIndex === 'status' ?
                                        (x: string) => x == '0' ? <Tag color="warning">UNPROCESSED</Tag> : x == '1' ? <Tag color="warning">PROCESSED</Tag> : x == '2' ? <Tag color="success">SUCCESS</Tag> : <Tag color="error">FAILED</Tag> :
                                        item.dataIndex === 'is_approved' ?
                                            (x: string) => x == '1' ? <Tag color="success">VERIFIED</Tag> : x == "0" ? <Tag color="warning">UNVERIFIED</Tag> : <Tag color="error">REJECTED</Tag> : null
            }
        )
    }
    )
    return rry
}