import React from "react";
import Row from "antd/lib/row";
import Col from "antd/lib/col";
import Table from "antd/lib/table";
import AreaChart from "./charts/AreaChart";
import Column from "antd/lib/table/Column";
// import { getUser } from "../utils/Helper";

const SummaryData = (props: any) => {
  let series = props.series === undefined ? [] : props.series;
  let categories = props.categories === undefined ? [] : props.categories;
  let dataTable = props.dataTable === undefined ? [] : props.dataTable;
  let total = props.total === undefined ? null : props.total;

  let columnsUsed = props.columnsUsed === undefined ? [] : props.columnsUsed;

  if (dataTable !== "")
    dataTable.forEach((i: any, index: any) => {
      i.key = index;
    });

    let columnsAll = columnsUsed.length === 0 ? [] : columnsUsed.map((item: any, i: any) => (
    <Column title={item.title} dataIndex={item.dataIndex} key={item.dataIndex} />
  ))

  let columnStatOverall: any = (
    <>
    <Column title="Valid" dataIndex="valid" key="valid" />
    <Column title="Pending" dataIndex="pending" key="pending" />
    <Column title="Invalid" dataIndex="invalid" key="invalid" />
    </>
  )

  let columnsTotals = columnsUsed.length === 0 ? [] : columnsUsed.map((item: any, i: any) => 
  {
    return (
      <Table.Summary.Cell index={i+1} key={i}>
        {total[`${item.title2}`]}
      </Table.Summary.Cell>
    )})



  return (
    <>
      <Row>
        <Col span={24}>
          <AreaChart
            title={props.title}
            series={series}
            categories={categories}
          />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Table
            bordered
            loading={props.isLoading}
            size="middle"
            pagination={false}
            dataSource={dataTable}
            summary={() => 
              // getUser().prjType.toString() 
              '1' === '1' ?
              (
              <Table.Summary.Row style={{ fontWeight: "bolder" }}>
                <Table.Summary.Cell index={0}>TOTAL</Table.Summary.Cell>
                {props.mediaUsed > 1 ? (
                  columnsTotals 
                ) : (
                  null
                )}
                <Table.Summary.Cell index={18}>
                  {total === null ? 0 : total.totalValid}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={19}>
                  {total === null ? 0 : total.totalInvalid}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={20}>
                  {total === null ? 0 : total.totalAll}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
            :
            (
              <Table.Summary.Row style={{ fontWeight: "bolder" }}>
                <Table.Summary.Cell index={0}>TOTAL</Table.Summary.Cell>
                {props.mediaUsed > 1 ? (
                  columnsTotals
                ) : (
                  null
                )}
                <Table.Summary.Cell index={17}>
                  {total === null ? 0 : total.totalValid}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={18}>
                  {total === null ? 0 : total.totalPending}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={19}>
                  {total === null ? 0 : total.totalInvalid}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={20}>
                  {total === null ? 0 : total.totalAll}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }
          >
            <Column title="Submit Date" dataIndex="DATE" key="DATE" />
            {props.mediaUsed > 1 ? (
              <Column
              title="Status Per Media">
              {columnsAll}
            </Column>
            ) : (
              null
            )}

            <Column
              title="Status Overall">
                {columnStatOverall}
              </Column>
            <Column title="TOTAL" dataIndex="all" key="all" />
          </Table>
        </Col>
      </Row>
    </>
  );
};

export default SummaryData;
