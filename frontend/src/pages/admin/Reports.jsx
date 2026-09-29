import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getAdminReports,
  getAdminEmployeeReport,
  getEmployees
} from "../../services/api";


export default function Reports() {

  const [
    report,
    setReport
  ] = useState(null);

  const [
    employees,
    setEmployees
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  const [
    period,
    setPeriod
  ] = useState("weekly");

  const [
    targetDate,
    setTargetDate
  ] = useState(
    getToday()
  );

  const [
    employeeFilter,
    setEmployeeFilter
  ] = useState("");

  const [
    selectedEmployee,
    setSelectedEmployee
  ] = useState(null);

  const [
    detailLoading,
    setDetailLoading
  ] = useState(false);

  const [
    detailError,
    setDetailError
  ] = useState("");


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadInitialData();

  }, []);


  const loadInitialData =
    async () => {

      try {

        setLoading(true);
        setError("");

        const [
          reportData,
          employeeData
        ] = await Promise.all([
          getAdminReports({
            period: "weekly",
            target_date: getToday()
          }),
          getEmployees()
        ]);

        setReport(
          reportData
        );

        setEmployees(
          employeeData
        );

      } catch (err) {

        console.error(
          "Reports load error:",
          err
        );

        const detail =
          err?.response
            ?.data
            ?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Unable to load reports."
        );

      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // LOAD REPORT
  // ==========================================================

  const loadReport =
    async () => {

      try {

        setLoading(true);
        setError("");

        const data =
          await getAdminReports({

            period:
              period,

            target_date:
              targetDate,

            employee_id:
              employeeFilter
              || undefined

          });

        setReport(
          data
        );

      } catch (err) {

        console.error(
          "Report load error:",
          err
        );

        const detail =
          err?.response
            ?.data
            ?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Unable to load selected report."
        );

      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // CLEAR FILTER
  // ==========================================================

  const clearFilter =
    async () => {

      const today =
        getToday();

      setPeriod(
        "weekly"
      );

      setTargetDate(
        today
      );

      setEmployeeFilter(
        ""
      );

      try {

        setLoading(true);

        const data =
          await getAdminReports({
            period: "weekly",
            target_date: today
          });

        setReport(
          data
        );

        setError("");

      } catch (err) {

        console.error(
          err
        );

        setError(
          "Unable to reset report."
        );

      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // OPEN EMPLOYEE DETAIL
  // ==========================================================

  const openEmployeeDetail =
    async (
      employeeId
    ) => {

      try {

        setDetailLoading(
          true
        );

        setDetailError(
          ""
        );

        const data =
          await getAdminEmployeeReport(
            employeeId,
            {
              period:
                period,

              target_date:
                targetDate
            }
          );

        setSelectedEmployee(
          data
        );

      } catch (err) {

        console.error(
          "Employee report error:",
          err
        );

        const detail =
          err?.response
            ?.data
            ?.detail;

        setDetailError(
          typeof detail === "string"
            ? detail
            : "Unable to load employee report."
        );

      } finally {

        setDetailLoading(
          false
        );

      }
    };


  // ==========================================================
  // CLOSE DETAIL
  // ==========================================================

  const closeDetail =
    () => {

      setSelectedEmployee(
        null
      );

      setDetailError(
        ""
      );
    };


  // ==========================================================
  // TEAM DATA
  // ==========================================================

  const employeeReports =
    useMemo(
      () => {

        if (
          !Array.isArray(
            report?.employees
          )
        ) {

          return [];
        }

        return report.employees;

      },
      [
        report
      ]
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
    &&
    !report
  ) {

    return (
      <div className="p-6">
        Loading reports...
      </div>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">
            Reports
          </h1>

          <p className="text-gray-500 mt-1">
            Generate daily, weekly, and monthly employee work reports.
          </p>

        </div>


        <button
          onClick={
            loadReport
          }
          className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm"
        >
          Refresh Report
        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-5">
          {error}
        </div>

      )}


      {/* FILTERS */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

          {/* PERIOD */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Report Period
            </label>

            <select
              value={
                period
              }
              onChange={
                (event) =>
                  setPeriod(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              <option value="daily">
                Daily
              </option>

              <option value="weekly">
                Weekly
              </option>

              <option value="monthly">
                Monthly
              </option>

            </select>

          </div>


          {/* TARGET DATE */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Target Date
            </label>

            <input
              type="date"
              value={
                targetDate
              }
              onChange={
                (event) =>
                  setTargetDate(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            />

          </div>


          {/* EMPLOYEE */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Employee
            </label>

            <select
              value={
                employeeFilter
              }
              onChange={
                (event) =>
                  setEmployeeFilter(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              <option value="">
                All Employees
              </option>

              {employees.map(
                (employee) => (

                  <option
                    key={
                      employee.id
                    }
                    value={
                      employee.id
                    }
                  >

                    {
                      employee.employee_code
                    }
                    {" - "}
                    {
                      employee.first_name
                    }
                    {" "}
                    {
                      employee.last_name
                      || ""
                    }

                  </option>

                )
              )}

            </select>

          </div>


          {/* APPLY */}

          <div className="flex items-end">

            <button
              onClick={
                loadReport
              }
              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg"
            >
              Generate
            </button>

          </div>


          {/* RESET */}

          <div className="flex items-end">

            <button
              onClick={
                clearFilter
              }
              className="w-full border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-lg"
            >
              Reset
            </button>

          </div>

        </div>

      </div>


      {/* REPORT PERIOD */}

      {report && (

        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

            <div>

              <span className="font-semibold">
                {
                  formatLabel(
                    report.period
                  )
                } Report
              </span>

              <span className="ml-2">
                {
                  formatDate(
                    report.start_date
                  )
                }
                {" to "}
                {
                  formatDate(
                    report.end_date
                  )
                }
              </span>

            </div>


            {loading && (

              <span className="text-sm">
                Updating...
              </span>

            )}

          </div>

        </div>

      )}


      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">

        <SummaryCard
          title="Employees"
          value={
            report?.summary
              ?.employees
            || 0
          }
        />

        <SummaryCard
          title="Work Hours"
          value={
            Number(
              report?.summary
                ?.total_hours
              || 0
            ).toFixed(2)
          }
        />

        <SummaryCard
          title="Work Entries"
          value={
            report?.summary
              ?.work_entries
            || 0
          }
        />

        <SummaryCard
          title="Total Tasks"
          value={
            report?.summary
              ?.total_tasks
            || 0
          }
        />

        <SummaryCard
          title="Completed Tasks"
          value={
            report?.summary
              ?.completed_tasks
            || 0
          }
        />

        <SummaryCard
          title="Avg Progress"
          value={
            `${Number(
              report?.summary
                ?.average_progress
              || 0
            ).toFixed(1)}%`
          }
        />

      </div>


      {/* EMPLOYEE REPORT TABLE */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b">

          <h2 className="font-semibold text-gray-900">
            Employee Report Summary
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {employeeReports.length} employee(s)
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left p-3">
                  Employee
                </th>

                <th className="text-left p-3">
                  Work Hours
                </th>

                <th className="text-left p-3">
                  Entries
                </th>

                <th className="text-left p-3">
                  Active Days
                </th>

                <th className="text-left p-3">
                  Tasks
                </th>

                <th className="text-left p-3">
                  Completed
                </th>

                <th className="text-left p-3">
                  Delivered
                </th>

                <th className="text-left p-3">
                  Completion
                </th>

                <th className="text-left p-3">
                  Avg Progress
                </th>

                <th className="text-left p-3">
                  Revisions
                </th>

                <th className="text-left p-3">
                  Details
                </th>

              </tr>

            </thead>


            <tbody>

              {employeeReports.length === 0 && (

                <tr>

                  <td
                    colSpan="11"
                    className="p-10 text-center text-gray-400"
                  >
                    No report data found.
                  </td>

                </tr>

              )}


              {employeeReports.map(
                (employee) => (

                  <tr
                    key={
                      employee.employee_id
                    }
                    className="border-t hover:bg-gray-50"
                  >

                    {/* EMPLOYEE */}

                    <td className="p-3 min-w-[190px]">

                      <div className="font-semibold text-gray-900">
                        {
                          employee.employee_name
                          || "-"
                        }
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        {
                          employee.employee_code
                          || "-"
                        }
                      </div>

                      {employee.designation && (

                        <div className="text-xs text-gray-400 mt-1">
                          {
                            employee.designation
                          }
                        </div>

                      )}

                    </td>


                    {/* HOURS */}

                    <td className="p-3">

                      {
                        Number(
                          employee.work
                            ?.hours
                          || 0
                        ).toFixed(2)
                      }

                    </td>


                    {/* ENTRIES */}

                    <td className="p-3">

                      {
                        employee.work
                          ?.entries
                        || 0
                      }

                    </td>


                    {/* ACTIVE DAYS */}

                    <td className="p-3">

                      {
                        employee.work
                          ?.active_days
                        || 0
                      }

                    </td>


                    {/* TASKS */}

                    <td className="p-3">

                      {
                        employee.tasks
                          ?.total
                        || 0
                      }

                    </td>


                    {/* COMPLETED */}

                    <td className="p-3">

                      {
                        employee.tasks
                          ?.completed
                        || 0
                      }

                    </td>


                    {/* DELIVERED */}

                    <td className="p-3">

                      {
                        employee.tasks
                          ?.delivered
                        || 0
                      }

                    </td>


                    {/* COMPLETION RATE */}

                    <td className="p-3 min-w-[130px]">

                      <PercentageBar
                        value={
                          employee.tasks
                            ?.completion_rate
                          || 0
                        }
                      />

                    </td>


                    {/* AVG PROGRESS */}

                    <td className="p-3 min-w-[130px]">

                      <PercentageBar
                        value={
                          employee.tasks
                            ?.average_progress
                          || 0
                        }
                      />

                    </td>


                    {/* REVISIONS */}

                    <td className="p-3">

                      {
                        employee.tasks
                          ?.revision_count
                        || 0
                      }

                    </td>


                    {/* DETAILS */}

                    <td className="p-3">

                      <button
                        onClick={
                          () =>
                            openEmployeeDetail(
                              employee.employee_id
                            )
                        }
                        className="border border-blue-300 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg whitespace-nowrap"
                      >
                        View Report
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ==================================================== */}
      {/* EMPLOYEE DETAIL MODAL */}
      {/* ==================================================== */}

      {
        (
          selectedEmployee
          ||
          detailLoading
          ||
          detailError
        )
        &&
        (

          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">

            <div className="bg-gray-50 w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">

              {/* HEADER */}

              <div className="sticky top-0 z-10 bg-white border-b p-5 flex items-start justify-between">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Employee Report
                  </h2>

                  {selectedEmployee && (

                    <p className="text-sm text-gray-500 mt-1">

                      {
                        selectedEmployee.employee_name
                      }

                      {
                        selectedEmployee.employee_code
                          ? ` • ${selectedEmployee.employee_code}`
                          : ""
                      }

                    </p>

                  )}

                </div>


                <button
                  onClick={
                    closeDetail
                  }
                  className="text-2xl text-gray-500 hover:text-gray-900"
                >
                  ×
                </button>

              </div>


              {/* LOADING */}

              {detailLoading && (

                <div className="p-10 text-center text-gray-500">
                  Loading employee report...
                </div>

              )}


              {/* ERROR */}

              {!detailLoading
                &&
                detailError
                &&
                (

                  <div className="m-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    {detailError}
                  </div>

                )
              }


              {/* REPORT */}

              {!detailLoading
                &&
                selectedEmployee
                &&
                (

                  <div className="p-6">


                    {/* PERIOD */}

                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6">

                      <strong>
                        {
                          formatLabel(
                            selectedEmployee.period
                          )
                        } Report
                      </strong>

                      {" • "}

                      {
                        formatDate(
                          selectedEmployee.start_date
                        )
                      }

                      {" to "}

                      {
                        formatDate(
                          selectedEmployee.end_date
                        )
                      }

                    </div>


                    {/* EMPLOYEE INFO */}

                    <div className="bg-white border rounded-xl p-5 mb-6">

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                        <InfoItem
                          title="Employee"
                          value={
                            selectedEmployee.employee_name
                          }
                        />

                        <InfoItem
                          title="Code"
                          value={
                            selectedEmployee.employee_code
                          }
                        />

                        <InfoItem
                          title="Designation"
                          value={
                            selectedEmployee.designation
                            || "-"
                          }
                        />

                        <InfoItem
                          title="Status"
                          value={
                            formatLabel(
                              selectedEmployee.employment_status
                            )
                          }
                        />

                      </div>

                    </div>


                    {/* SUMMARY */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

                      <SummaryCard
                        title="Work Hours"
                        value={
                          Number(
                            selectedEmployee.work
                              ?.hours
                            || 0
                          ).toFixed(2)
                        }
                      />

                      <SummaryCard
                        title="Work Entries"
                        value={
                          selectedEmployee.work
                            ?.entries
                          || 0
                        }
                      />

                      <SummaryCard
                        title="Active Days"
                        value={
                          selectedEmployee.work
                            ?.active_days
                          || 0
                        }
                      />

                      <SummaryCard
                        title="Completed Entries"
                        value={
                          selectedEmployee.work
                            ?.completed_entries
                          || 0
                        }
                      />

                    </div>


                    {/* TASK SUMMARY */}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                      <div className="bg-white border rounded-xl p-5">

                        <h3 className="font-semibold text-gray-900 mb-4">
                          Task Summary
                        </h3>


                        <ReportRow
                          label="Total Tasks"
                          value={
                            selectedEmployee.tasks
                              ?.total
                            || 0
                          }
                        />

                        <ReportRow
                          label="Completed"
                          value={
                            selectedEmployee.tasks
                              ?.completed
                            || 0
                          }
                        />

                        <ReportRow
                          label="Delivered"
                          value={
                            selectedEmployee.tasks
                              ?.delivered
                            || 0
                          }
                        />

                        <ReportRow
                          label="In Progress"
                          value={
                            selectedEmployee.tasks
                              ?.in_progress
                            || 0
                          }
                        />

                        <ReportRow
                          label="Pending"
                          value={
                            selectedEmployee.tasks
                              ?.pending
                            || 0
                          }
                        />

                        <ReportRow
                          label="Revision"
                          value={
                            selectedEmployee.tasks
                              ?.revision
                            || 0
                          }
                        />

                        <ReportRow
                          label="Cancelled"
                          value={
                            selectedEmployee.tasks
                              ?.cancelled
                            || 0
                          }
                        />

                        <ReportRow
                          label="Revision Count"
                          value={
                            selectedEmployee.tasks
                              ?.revision_count
                            || 0
                          }
                        />

                      </div>


                      <div className="bg-white border rounded-xl p-5">

                        <h3 className="font-semibold text-gray-900 mb-4">
                          Task Indicators
                        </h3>


                        <IndicatorRow
                          label="Completion Rate"
                          value={
                            selectedEmployee.tasks
                              ?.completion_rate
                            || 0
                          }
                        />

                        <IndicatorRow
                          label="Delivery Rate"
                          value={
                            selectedEmployee.tasks
                              ?.delivery_rate
                            || 0
                          }
                        />

                        <IndicatorRow
                          label="Average Progress"
                          value={
                            selectedEmployee.tasks
                              ?.average_progress
                            || 0
                          }
                        />

                      </div>

                    </div>


                    {/* DAILY BREAKDOWN */}

                    <DailyBreakdown
                      data={
                        selectedEmployee.daily_breakdown
                        || []
                      }
                    />


                    {/* WORK ENTRIES */}

                    <div className="bg-white border rounded-xl overflow-hidden">

                      <div className="p-5 border-b">

                        <h3 className="font-semibold text-gray-900">
                          Work Entries
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Work submitted during the selected report period.
                        </p>

                      </div>


                      <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                          <thead className="bg-gray-50">

                            <tr>

                              <th className="text-left p-3">
                                Date
                              </th>

                              <th className="text-left p-3">
                                Work
                              </th>

                              <th className="text-left p-3">
                                Task
                              </th>

                              <th className="text-left p-3">
                                Type
                              </th>

                              <th className="text-left p-3">
                                Hours
                              </th>

                              <th className="text-left p-3">
                                Status
                              </th>

                              <th className="text-left p-3">
                                Progress
                              </th>

                              <th className="text-left p-3">
                                Remarks
                              </th>

                            </tr>

                          </thead>


                          <tbody>

                            {
                              !selectedEmployee.work_entries
                              ||
                              selectedEmployee.work_entries.length
                              === 0
                                ? (

                                  <tr>

                                    <td
                                      colSpan="8"
                                      className="p-10 text-center text-gray-400"
                                    >
                                      No work entries for this period.
                                    </td>

                                  </tr>

                                )
                                : (

                                  selectedEmployee.work_entries.map(
                                    (entry) => (

                                      <tr
                                        key={
                                          entry.id
                                        }
                                        className="border-t"
                                      >

                                        <td className="p-3 whitespace-nowrap">

                                          {
                                            formatDate(
                                              entry.work_date
                                            )
                                          }

                                        </td>


                                        <td className="p-3 min-w-[200px]">

                                          <div className="font-medium text-gray-900">
                                            {
                                              entry.title
                                              || "-"
                                            }
                                          </div>

                                          {entry.description && (

                                            <div
                                              className="text-xs text-gray-400 mt-1 max-w-[260px] truncate"
                                              title={
                                                entry.description
                                              }
                                            >
                                              {
                                                entry.description
                                              }
                                            </div>

                                          )}

                                        </td>


                                        <td className="p-3">

                                          {
                                            entry.task_id
                                              ? `#${entry.task_id}`
                                              : "-"
                                          }

                                        </td>


                                        <td className="p-3">
                                          {
                                            formatLabel(
                                              entry.work_type
                                            )
                                          }
                                        </td>


                                        <td className="p-3">

                                          {
                                            Number(
                                              entry.hours_spent
                                              || 0
                                            ).toFixed(2)
                                          }

                                        </td>


                                        <td className="p-3">

                                          <StatusBadge
                                            status={
                                              entry.status
                                            }
                                          />

                                        </td>


                                        <td className="p-3">

                                          {
                                            entry.progress_percentage
                                            ?? 0
                                          }%

                                        </td>


                                        <td className="p-3 max-w-[220px]">

                                          <span
                                            title={
                                              entry.remarks
                                              || ""
                                            }
                                          >
                                            {
                                              entry.remarks
                                              || "-"
                                            }
                                          </span>

                                        </td>

                                      </tr>

                                    )
                                  )

                                )
                            }

                          </tbody>

                        </table>

                      </div>

                    </div>

                  </div>

                )
              }

            </div>

          </div>

        )
      }

    </div>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value
}) {

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="text-3xl font-bold text-gray-900 mt-2">
        {value}
      </p>

    </div>
  );
}


// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({
  title,
  value
}) {

  return (
    <div>

      <p className="text-xs text-gray-500">
        {title}
      </p>

      <p className="font-medium text-gray-900 mt-1">
        {value || "-"}
      </p>

    </div>
  );
}


// ============================================================
// REPORT ROW
// ============================================================

function ReportRow({
  label,
  value
}) {

  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">

      <span className="text-sm text-gray-600">
        {label}
      </span>

      <span className="font-semibold text-gray-900">
        {value}
      </span>

    </div>
  );
}


// ============================================================
// PERCENTAGE BAR
// ============================================================

function PercentageBar({
  value
}) {

  const safeValue =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          value
          || 0
        )
      )
    );


  return (
    <div className="flex items-center gap-2">

      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">

        <div
          className="h-full bg-blue-600 rounded-full"
          style={{
            width:
              `${safeValue}%`
          }}
        />

      </div>


      <span className="text-xs font-medium text-gray-700">
        {safeValue.toFixed(1)}%
      </span>

    </div>
  );
}


// ============================================================
// INDICATOR
// ============================================================

function IndicatorRow({
  label,
  value
}) {

  const safeValue =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          value
          || 0
        )
      )
    );


  return (
    <div className="mb-5">

      <div className="flex justify-between mb-2">

        <span className="text-sm text-gray-600">
          {label}
        </span>

        <span className="text-sm font-semibold">
          {safeValue.toFixed(1)}%
        </span>

      </div>


      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

        <div
          className="h-full bg-blue-600 rounded-full"
          style={{
            width:
              `${safeValue}%`
          }}
        />

      </div>

    </div>
  );
}


// ============================================================
// DAILY BREAKDOWN
// ============================================================

function DailyBreakdown({
  data
}) {

  const rows =
    Array.isArray(
      data
    )
      ? data
      : [];


  const maxHours =
    rows.length > 0
      ? Math.max(
          1,
          ...rows.map(
            (item) =>
              Number(
                item.hours
                || 0
              )
          )
        )
      : 1;


  return (
    <div className="bg-white border rounded-xl p-5 mb-6">

      <h3 className="font-semibold text-gray-900">
        Daily Breakdown
      </h3>

      <p className="text-sm text-gray-500 mt-1 mb-5">
        Hours and work entries across the selected report period.
      </p>


      {rows.length === 0
        ? (

          <div className="py-10 text-center text-gray-400">
            No daily data available.
          </div>

        )
        : (

          <div className="space-y-3">

            {rows.map(
              (item) => {

                const hours =
                  Number(
                    item.hours
                    || 0
                  );


                const percentage =
                  (
                    hours
                    /
                    maxHours
                  )
                  *
                  100;


                return (

                  <div
                    key={
                      item.date
                    }
                    className="grid grid-cols-[100px_1fr_80px_90px] gap-3 items-center"
                  >

                    <div>

                      <div className="text-sm font-medium text-gray-900">
                        {
                          item.day
                        }
                      </div>

                      <div className="text-xs text-gray-400">
                        {
                          shortDate(
                            item.date
                          )
                        }
                      </div>

                    </div>


                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">

                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width:
                            `${Math.max(
                              hours > 0
                                ? 3
                                : 0,
                              percentage
                            )}%`
                        }}
                      />

                    </div>


                    <div className="text-right text-sm font-medium">
                      {hours.toFixed(2)}h
                    </div>


                    <div className="text-right text-xs text-gray-500">
                      {
                        item.entries
                        || 0
                      } entries
                    </div>

                  </div>

                );

              }
            )}

          </div>

        )
      }

    </div>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status
}) {

  const classes = {

    received:
      "bg-blue-100 text-blue-700",

    pending:
      "bg-yellow-100 text-yellow-700",

    in_progress:
      "bg-purple-100 text-purple-700",

    delivered:
      "bg-cyan-100 text-cyan-700",

    revision:
      "bg-orange-100 text-orange-700",

    completed:
      "bg-green-100 text-green-700",

    cancelled:
      "bg-red-100 text-red-700"

  };


  return (
    <span
      className={
        `inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
          classes[status]
          ||
          "bg-gray-100 text-gray-700"
        }`
      }
    >
      {
        formatLabel(
          status
        )
      }
    </span>
  );
}


// ============================================================
// TODAY
// ============================================================

function getToday() {

  const date =
    new Date();


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;
}


// ============================================================
// FORMAT LABEL
// ============================================================

function formatLabel(
  value
) {

  if (!value) {
    return "-";
  }


  return String(
    value
  )
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
  value
) {

  if (!value) {
    return "-";
  }


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {

    const [
      year,
      month,
      day
    ] = value.split("-");


    return `${day}-${month}-${year}`;
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;
  }


  return date.toLocaleString();
}


// ============================================================
// SHORT DATE
// ============================================================

function shortDate(
  value
) {

  if (!value) {
    return "";
  }


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {

    const [
      ,
      month,
      day
    ] = value.split("-");


    return `${day}/${month}`;
  }


  return value;
}