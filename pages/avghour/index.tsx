import React, { useReducer, useEffect } from "react";
import type { ReactElement } from 'react'
import DashboardLayout from "../../components/layouts/Dashboard";
import dynamic from "next/dynamic";
import Col from "antd/lib/col";
import Row from "antd/lib/row";
import { useRouter } from "next/router";
import { masterEmployee2, masterRole } from "../api/master";
import { GetServerSideProps } from 'next';
// import { getData } from "../api/avghour/";
import { StatState } from "../../interfaces/dashboard.interface";
import Button from "antd/lib/button";
import PageHeader from "antd/lib/page-header";
import { getLoginSession } from "@lib/auth";
import { NextApiRequest } from "next";
import { pageCheck } from "@lib/helper";
import moment from "moment";
import useSWR, { useSWRConfig, SWRConfig } from "swr";

const SummaryData = dynamic(() => import("../../components/SummaryDataV2"), { loading: () => <p>Loading...</p> });
const ModalFilter = dynamic(() => import("./_filter"), { loading: () => <p>Loading...</p>, ssr: false });

const AverageHour = (props: any) => {
  const [states, setStates] = useReducer((state: StatState, newState: Partial<StatState>) => ({ ...state, ...newState }), props)

  const { data: arrayAvg, error: errorAvg, isValidating: isLoadingAvg } = useSWR(`/api/avghour/${states.month}/${states.employeeId}`)

  // const dynamicRoute = useRouter().asPath;
  // useEffect(() => setStates(props), [dynamicRoute]);

  const resetFilter = () => {
    setStates({
      ...states,
      modalFilter: false,
      month: moment().format("YYYY-MM"),
    })
  };

  const handleFilter = async (data: any) => {
    setStates({
      ...states,
      month: moment(data.month).format("YYYY-MM"),
      modalFilter: false
    })
  };

  const handleOpenModal = async (param: any) => {
    if (param.name === "openModal" && param.id) {
      setStates({
        [param.name]: param.value,
      });
    } else {
      setStates({
        [param.name]: param.value,
      });
    }
  }

  //   const expSurvey = async () => {
  //     exportSurvey()
  // }

  // let mediaUsed = arrayAvg ? arrayAvg.mediaUsed : 0
  // let columnsUsed = arrayAvg ? arrayAvg.columnsUsed : []

  return (
    <>
      <PageHeader
        title="Average Work Hour per Employee"
        extra={[
          // states.access.m_insert == 1 ?
          <Row key="1">
            <Col style={{ marginRight: '1em' }}>
              {/* <Button
                                    onClick={expSurvey}
                                    className={'button'}
                                    shape="round"
                                >
                                    Export
                                </Button> */}
            </Col>
            <Col>
              <Button
                key="1"
                onClick={() =>
                  handleOpenModal({
                    name: "modalFilter",
                    value: true,
                  })
                }
                className={'button'}
                shape="round"
              >
                Filter
              </Button>
            </Col>
          </Row>
          //  : null
        ]}
      />
      <Row>
        <Col span={24}>
          <SummaryData
            setEmployeeId={(e: any) => setStates({ ...states, employeeId: e })}
            employees={states.master.employees}
            // isLoading={isLoadingAvg}
            title={`Average Work Hour`}
            // mediaUsed={mediaUsed}
            // totalSubmit={arrayAvg?.totalSubmit}
            // columnsUsed={columnsUsed}
            series={[
              {
                name: `Work Hour`,
                data: arrayAvg !== undefined
                ? arrayAvg.series
                : 
                [0]
              }
            ]}
            categories={
              arrayAvg !== undefined
                ? arrayAvg.categories
              : ['Work Hour']
            }
          />
        </Col>
      </Row>
      <ModalFilter
        mode={'monthly'}
        header={"Filter Attendance"}
        open={states.modalFilter}
        master={states.master}
        data={states.month}
        handleOpenModal={handleOpenModal}
        handleFilter={handleFilter}
        resetFilter={resetFilter}
      />
    </>
  );
}

// const exportSurvey = async () => {
//   await window.open(`/api/dashboard/survey/export`)
// }

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getLoginSession(ctx.req as NextApiRequest)

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    }
  }

  const trueRole = await pageCheck(session.username, ctx.resolvedUrl)

  if (trueRole.length < 1) {
    return {
      redirect: {
        destination: "/403",
        permanent: false
      }
    }
  }

  const roleMaster = await masterRole();

  const dataEmployee = await masterEmployee2()

  return {
    props: {
      // fallback: {
      //     '/api/dashboard/entries': JSON.parse(JSON.stringify(data))
      // },
      master: {
        role: JSON.parse(JSON.stringify(roleMaster)),
        employees: JSON.parse(JSON.stringify(dataEmployee)),
      },
      month: moment().format("YYYY-MM"),
      employeeId: 0,
      modalFilter: false,
      columns: [],
      isLoading: false,
      surveyId: 0
    }
  }
}

export default AverageHour;

AverageHour.getLayout = function getLayout(page: ReactElement) {
  return (
    <DashboardLayout>{page}</DashboardLayout>
  )
}