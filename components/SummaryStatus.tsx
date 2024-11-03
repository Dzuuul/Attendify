import React from "react";
import Row from "antd/lib/row";
import Col from "antd/lib/col";
import Table from "antd/lib/table";
import PieChart from "./charts/PieChart";
import Column from "antd/lib/table/Column";

const SummaryStatus = (props: any) => {
  let chartInvalidReason =
    props.chartInvalidReason === undefined ? [] : props.chartInvalidReason;
  let chartValidInvalid =
    props.chartValidInvalid === undefined ? [] : props.chartValidInvalid;
  let dataTable = props.dataTable === undefined ? [] : props.dataTable;
  if (dataTable !== "")
    dataTable.response.forEach((i: any, index: any) => {
      i.key = index;
    });

  const statusCol: any = (
    <>
      <Column title="Valid" dataIndex="valid" key="valid" />
      <Column title="Invalid" dataIndex="invalid" key="invalid" />
    </>
  )

  const invReasonCol: any = (
    <>
                    <Column
                      title="Format Salah"
                      dataIndex="wrongFormat"
                      key="wrongFormat"
                    />
                    <Column
                      title="No KTP Salah"
                      dataIndex="wrongKTP"
                      key="wrongKTP"
                    />
                    <Column
                      title="Dibawah 17 Tahun"
                      dataIndex="underAge"
                      key="underAge"
                    />
                    <Column
                      title="Kode Unik Salah"
                      dataIndex="wrongCoupon"
                      key="wrongCoupon"
                    />
                    <Column
                      title="Kode Unik Sudah Digunakan"
                      dataIndex="duplicateCoupon"
                      key="duplicateCoupon"
                    />
                    <Column
                      title="Program Belum Dimulai"
                      dataIndex="notYetStart"
                      key="notYetStart"
                    />
                    <Column
                      title="Program Berakhir"
                      dataIndex="overProgram"
                      key="overProgram"
                    />
                    <Column
                      title="Sender & KTP tidak sesuai dengan sebelumnya"
                      dataIndex="differentFromPrev"
                      key="differentFromPrev"
                    />
                    <Column
                      title="Blacklisted"
                      dataIndex="blacklist"
                      key="blacklist"
                    />
                  </>
  )

  return (
    <>
      <Row>
        <Col xs={24} xl={12}>
          <PieChart
            series={chartValidInvalid.series}
            categories={chartValidInvalid.categories}
            title={"Chart Status"}
          />
        </Col>
        <Col xs={24} xl={12}>
          <PieChart
            series={chartInvalidReason.series}
            categories={chartInvalidReason.categories}
            title={"Chart Rejected Reason"}
          />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <div
            style={{
              display: "box",
              overflowX: "scroll",
              paddingBottom: "1em",
            }}
          >
            <Table
              bordered
              size="middle"
              pagination={false}
              dataSource={dataTable.response}
              summary={() => (
                <Table.Summary.Row style={{ fontWeight: "bolder" }}>
                  <Table.Summary.Cell index={0}>TOTAL</Table.Summary.Cell>
                  {/* <Table.Summary.Cell index={1}>
                    {dataTable.validMicrosite === undefined
                      ? null
                      : dataTable.validMicrosite}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    {dataTable.invalidMicrosite === undefined
                      ? null
                      : dataTable.invalidMicrosite}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    {dataTable.validWa1 === undefined
                      ? null
                      : dataTable.validWa1}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    {dataTable.invalidWa1 === undefined
                      ? null
                      : dataTable.invalidWa1}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    {dataTable.validWa2 === undefined
                      ? null
                      : dataTable.validWa2}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    {dataTable.invalidWa2 === undefined
                      ? null
                      : dataTable.invalidWa2}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    {dataTable.validWa3 === undefined
                      ? null
                      : dataTable.validWa3}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    {dataTable.invalidWa3 === undefined
                      ? null
                      : dataTable.invalidWa3}
                  </Table.Summary.Cell> */}
                  <Table.Summary.Cell index={5}>
                    {dataTable.valid === undefined
                      ? null
                      : dataTable.valid}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    {dataTable.invalid === undefined
                      ? null
                      : dataTable.invalid}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    {dataTable.wrongFormat === undefined
                      ? null
                      : dataTable.wrongFormat}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>
                    {dataTable.wrongKTP === undefined
                      ? null
                      : dataTable.wrongKTP}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9}>
                    {dataTable.underAge === undefined
                      ? null
                      : dataTable.underAge}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={10}>
                    {dataTable.wrongCoupon === undefined
                      ? null
                      : dataTable.wrongCoupon}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={11}>
                    {dataTable.duplicateCoupon === undefined
                      ? null
                      : dataTable.duplicateCoupon}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={12}>
                    {dataTable.notYetStart === undefined
                      ? null
                      : dataTable.notYetStart}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={13}>
                    {dataTable.overProgram === undefined
                      ? null
                      : dataTable.overProgram}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={14}>
                    {dataTable.differentFromPrev === undefined
                      ? null
                      : dataTable.differentFromPrev}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={15}>
                    {dataTable.blacklist === undefined
                      ? null
                      : dataTable.blacklist}
                  </Table.Summary.Cell>
                  {/* <Table.Summary.Cell index={15}>
                    {dataTable.blacklist === undefined
                      ? null
                      : dataTable.blacklist}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={16}>
                    {dataTable.unlucky === undefined
                      ? null
                      : dataTable.unlucky}
                  </Table.Summary.Cell> */}
                </Table.Summary.Row>
              )}
            >
              <Column title={props.type === "time" ? "Submit Time" : "Submit Date"} dataIndex="DATE" key="DATE" />
              {/* <Column
                title="Status Per Media"
                children={
                  <>
                    <Column title="Valid McSite" dataIndex="validMicrosite" key="validMicrosite" />
                    <Column title="Invalid McSite" dataIndex="invalidMicrosite" key="invalidMicrosite" />
                    <Column title="Valid WA 1" dataIndex="validWa1" key="validWa1" />
                    <Column title="Invalid WA 1" dataIndex="invalidWa1" key="invalidWa1" />
                    <Column title="Valid WA 2" dataIndex="validWa2" key="validWa2" />
                    <Column title="Invalid WA 2" dataIndex="invalidWa2" key="invalidWa2" />
                    <Column title="Valid WA 3" dataIndex="validWa3" key="validWa3" />
                    <Column title="Invalid WA 3" dataIndex="invalidWa3" key="invalidWa3" />
                  </>
                }
              /> */}
              <Column
                title="Status">
                  {statusCol}
                </Column>
              <Column
                title="Invalid Reason">
                  {invReasonCol}
                </Column>
            </Table>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default SummaryStatus;
