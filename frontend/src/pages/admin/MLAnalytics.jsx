import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getMLAnalyticsOverview,
  getMLFeatures,
  getMLReadiness
} from "../../services/api";

import useDashboardSocket
  from "../../hooks/useDashboardSocket";


const WINDOW_OPTIONS = [
  {
    value: 7,
    label: "Last 7 Days"
  },
  {
    value: 14,
    label: "Last 14 Days"
  },
  {
    value: 30,
    label: "Last 30 Days"
  },
  {
    value: 60,
    label: "Last 60 Days"
  },
  {
    value: 90,
    label: "Last 90 Days"
  },
  {
    value: 180,
    label: "Last 180 Days"
  },
  {
    value: 365,
    label: "Last 365 Days"
  }
];


export default function MLAnalytics() {

  const [
    days,
    setDays
  ] = useState(30);

  const [
    readiness,
    setReadiness
  ] = useState(null);

  const [
    overview,
    setOverview
  ] = useState(null);

  const [
    features,
    setFeatures
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  const [
    search,
    setSearch
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
  // LOAD ALL ML ANALYTICS
  // ==========================================================

  const loadAnalytics =
    useCallback(
      async (
        selectedDays = days
      ) => {

        try {

          setLoading(true);
          setError("");

          const [
            readinessData,
            overviewData,
            featureData
          ] = await Promise.all([
            getMLReadiness(),

            getMLAnalyticsOverview({
              days: selectedDays
            }),

            getMLFeatures({
              days: selectedDays
            })
          ]);


          setReadiness(
            readinessData
          );

          setOverview(
            overviewData
          );

          setFeatures(
            featureData
          );

        } catch (err) {

          console.error(
            "ML Analytics load error:",
            err
          );

          const detail =
            err?.response
              ?.data
              ?.detail;

          setError(
            typeof detail === "string"
              ? detail
              : "Unable to load ML analytics."
          );

        } finally {

          setLoading(false);

        }

      },
      [
        days
      ]
    );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadAnalytics(
      days
    );

  }, []);


  // ==========================================================
  // REAL-TIME REFRESH
  // ==========================================================

  const handleSocketMessage =
    useCallback(
      async (
        message
      ) => {

        const relevantEvents = [
          "task_created",
          "task_updated",
          "task_deleted",
          "work_record_created",
          "work_record_updated",
          "work_record_deleted"
        ];


        if (
          relevantEvents.includes(
            message.event
          )
        ) {

          try {

            const [
              readinessData,
              overviewData,
              featureData
            ] = await Promise.all([
              getMLReadiness(),

              getMLAnalyticsOverview({
                days
              }),

              getMLFeatures({
                days
              })
            ]);


            setReadiness(
              readinessData
            );

            setOverview(
              overviewData
            );

            setFeatures(
              featureData
            );


            if (
              selectedEmployee
              &&
              message.employee_id
              &&
              Number(
                selectedEmployee.employee_id
              )
              ===
              Number(
                message.employee_id
              )
            ) {

              const employeeData =
                await getMLFeatures({
                  days,
                  employee_id:
                    selectedEmployee.employee_id
                });


              const employee =
                employeeData
                  ?.employees
                  ?.[0];


              if (employee) {

                setSelectedEmployee(
                  employee
                );

              }

            }

          } catch (err) {

            console.error(
              "ML Analytics realtime refresh error:",
              err
            );

          }

        }

      },
      [
        days,
        selectedEmployee
      ]
    );


  useDashboardSocket(
    handleSocketMessage
  );


  // ==========================================================
  // CHANGE WINDOW
  // ==========================================================

  const applyWindow =
    async () => {

      setSelectedEmployee(
        null
      );

      await loadAnalytics(
        days
      );
    };


  // ==========================================================
  // OPEN EMPLOYEE FEATURE DETAILS
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

        const response =
          await getMLFeatures({
            days,
            employee_id:
              employeeId
          });


        const employee =
          response?.employees?.[0];


        if (!employee) {

          setDetailError(
            "Employee analytics were not found."
          );

          return;
        }


        setSelectedEmployee(
          employee
        );

      } catch (err) {

        console.error(
          "Employee ML analytics error:",
          err
        );

        const detail =
          err?.response
            ?.data
            ?.detail;

        setDetailError(
          typeof detail === "string"
            ? detail
            : "Unable to load employee analytics."
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
  // EMPLOYEE ROWS
  // ==========================================================

  const employeeRows =
    useMemo(
      () => {

        const rows =
          Array.isArray(
            features?.employees
          )
            ? features.employees
            : [];


        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {
          return rows;
        }


        return rows.filter(
          (employee) => {

            return (
              String(
                employee.employee_name
                || ""
              )
                .toLowerCase()
                .includes(
                  query
                )
              ||
              String(
                employee.employee_code
                || ""
              )
                .toLowerCase()
                .includes(
                  query
                )
              ||
              String(
                employee.designation
                || ""
              )
                .toLowerCase()
                .includes(
                  query
                )
            );

          }
        );

      },
      [
        features,
        search
      ]
    );


  // ==========================================================
  // READINESS CHECKS
  // ==========================================================

  const readinessChecks =
    useMemo(
      () => {

        if (
          !readiness?.checks
        ) {

          return [];
        }


        return [
          {
            key:
              "employees_sufficient",

            label:
              "Employees",

            value:
              readiness.current_data
                ?.total_employees
              || 0,

            required:
              readiness.minimum_requirements
                ?.employees
              || 0
          },
          {
            key:
              "tasks_sufficient",

            label:
              "Tasks",

            value:
              readiness.current_data
                ?.total_tasks
              || 0,

            required:
              readiness.minimum_requirements
                ?.tasks
              || 0
          },
          {
            key:
              "completed_tasks_sufficient",

            label:
              "Completed Tasks",

            value:
              readiness.current_data
                ?.completed_tasks
              || 0,

            required:
              readiness.minimum_requirements
                ?.completed_tasks
              || 0
          },
          {
            key:
              "work_records_available",

            label:
              "Work Records",

            value:
              readiness.current_data
                ?.total_work_records
              || 0,

            required:
              1
          },
          {
            key:
              "task_history_available",

            label:
              "Task History",

            value:
              readiness.current_data
                ?.task_history_records
              || 0,

            required:
              1
          }
        ];

      },
      [
        readiness
      ]
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
    &&
    !overview
  ) {

    return (
      <div className="p-6">
        Loading ML analytics...
      </div>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div>

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">
            ML Analytics
          </h1>

          <p className="text-gray-500 mt-1">
            Data-readiness assessment and machine-learning feature analytics derived from real employee task and work history.
          </p>

          <p className="text-xs text-gray-400 mt-2 max-w-4xl">
            This module currently provides descriptive features and verifies whether enough real observations exist to begin experimental model training. It does not generate fabricated employee predictions.
          </p>

        </div>


        <button
          onClick={
            () =>
              loadAnalytics(
                days
              )
          }
          className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm"
        >
          Refresh Analytics
        </button>

      </div>


      {/* ==================================================== */}
      {/* ERROR */}
      {/* ==================================================== */}

      {error && (

        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>

      )}


      {/* ==================================================== */}
      {/* WINDOW SELECTION */}
      {/* ==================================================== */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

        <div className="flex flex-col md:flex-row md:items-end gap-4">

          <div className="w-full md:w-72">

            <label className="block text-xs text-gray-500 mb-1">
              Analytics Window
            </label>

            <select
              value={
                days
              }
              onChange={
                (event) =>
                  setDays(
                    Number(
                      event.target.value
                    )
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              {WINDOW_OPTIONS.map(
                (option) => (

                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>

                )
              )}

            </select>

          </div>


          <button
            onClick={
              applyWindow
            }
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg"
          >
            Apply Window
          </button>


          {overview && (

            <div className="text-sm text-gray-500 md:ml-auto">

              Data window:

              {" "}

              <strong className="text-gray-700">
                {
                  formatDate(
                    overview.start_date
                  )
                }
              </strong>

              {" to "}

              <strong className="text-gray-700">
                {
                  formatDate(
                    overview.end_date
                  )
                }
              </strong>

            </div>

          )}

        </div>

      </div>


      {/* ==================================================== */}
      {/* ML READINESS */}
      {/* ==================================================== */}

      <div
        className={
          `border rounded-xl p-5 mb-6 ${
            readiness
              ?.ready_for_training
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }`
        }
      >

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

          <div>

            <h2
              className={
                `text-lg font-bold ${
                  readiness
                    ?.ready_for_training
                    ? "text-green-800"
                    : "text-yellow-800"
                }`
              }
            >

              {
                readiness
                  ?.ready_for_training
                  ? "Experimental ML Training Readiness: PASS"
                  : "Experimental ML Training Readiness: NOT YET READY"
              }

            </h2>


            <p
              className={
                `text-sm mt-2 max-w-4xl ${
                  readiness
                    ?.ready_for_training
                    ? "text-green-700"
                    : "text-yellow-700"
                }`
              }
            >
              {
                readiness
                  ?.recommendation
                ||
                "No readiness information available."
              }
            </p>

          </div>


          <div
            className={
              `px-4 py-2 rounded-full font-semibold whitespace-nowrap ${
                readiness
                  ?.ready_for_training
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`
            }
          >

            {
              readiness
                ?.ready_for_training
                ? "READY"
                : "COLLECTING DATA"
            }

          </div>

        </div>


        {/* READINESS CHECKS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mt-5">

          {readinessChecks.map(
            (check) => {

              const passed =
                Boolean(
                  readiness
                    ?.checks
                    ?.[check.key]
                );


              return (

                <div
                  key={
                    check.key
                  }
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >

                  <div className="flex items-center justify-between gap-3">

                    <p className="text-sm text-gray-500">
                      {check.label}
                    </p>

                    <span
                      className={
                        `text-xs px-2 py-1 rounded-full font-medium ${
                          passed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`
                      }
                    >

                      {
                        passed
                          ? "PASS"
                          : "NEEDED"
                      }

                    </span>

                  </div>


                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {check.value}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Minimum: {check.required}
                  </p>

                </div>

              );

            }
          )}

        </div>

      </div>


      {/* ==================================================== */}
      {/* DATASET INVENTORY */}
      {/* ==================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">

        <SummaryCard
          title="Employees"
          value={
            readiness
              ?.current_data
              ?.total_employees
            || 0
          }
          subtitle={
            `${readiness?.current_data?.active_employees || 0} active`
          }
        />

        <SummaryCard
          title="Tasks"
          value={
            readiness
              ?.current_data
              ?.total_tasks
            || 0
          }
          subtitle={
            `${readiness?.current_data?.completed_tasks || 0} completed`
          }
        />

        <SummaryCard
          title="Work Records"
          value={
            readiness
              ?.current_data
              ?.total_work_records
            || 0
          }
          subtitle="Operational observations"
        />

        <SummaryCard
          title="Task History"
          value={
            readiness
              ?.current_data
              ?.task_history_records
            || 0
          }
          subtitle="Historical change events"
        />

        <SummaryCard
          title="Window"
          value={
            `${days} days`
          }
          subtitle="Current feature period"
        />

        <SummaryCard
          title="Feature Rows"
          value={
            features
              ?.employee_count
            || 0
          }
          subtitle="Employee vectors"
        />

      </div>


      {/* ==================================================== */}
      {/* OPERATIONAL OVERVIEW */}
      {/* ==================================================== */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

        <div className="mb-5">

          <h2 className="font-semibold text-gray-900">
            Operational Analytics
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Descriptive statistics calculated from the selected data window.
          </p>

        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <MetricCard
            title="Window Tasks"
            value={
              overview
                ?.summary
                ?.tasks
              || 0
            }
          />

          <MetricCard
            title="Completed Tasks"
            value={
              overview
                ?.summary
                ?.completed_tasks
              || 0
            }
          />

          <MetricCard
            title="Recorded Work Hours"
            value={
              Number(
                overview
                  ?.summary
                  ?.work_hours
                || 0
              ).toFixed(2)
            }
          />

          <MetricCard
            title="Current Overdue Tasks"
            value={
              overview
                ?.summary
                ?.current_overdue_tasks
              || 0
            }
          />

          <MetricCard
            title="Avg Completion Rate"
            value={
              `${Number(
                overview
                  ?.summary
                  ?.average_completion_rate
                || 0
              ).toFixed(1)}%`
            }
          />

          <MetricCard
            title="Average Progress"
            value={
              `${Number(
                overview
                  ?.summary
                  ?.average_progress
                || 0
              ).toFixed(1)}%`
            }
          />

          <MetricCard
            title="Average Consistency"
            value={
              `${Number(
                overview
                  ?.summary
                  ?.average_work_consistency
                || 0
              ).toFixed(1)}%`
            }
          />

          <MetricCard
            title="Employees Analyzed"
            value={
              overview
                ?.summary
                ?.employees
              || 0
            }
          />

        </div>


        {overview?.note && (

          <div className="mt-5 pt-4 border-t text-xs text-gray-500">
            {overview.note}
          </div>

        )}

      </div>


      {/* ==================================================== */}
      {/* FEATURE DEFINITIONS */}
      {/* ==================================================== */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

        <h2 className="font-semibold text-gray-900">
          Feature Groups
        </h2>

        <p className="text-sm text-gray-500 mt-1 mb-5">
          Variables prepared for future experimental machine-learning models.
        </p>


        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          <FeatureGroup
            title="Task Outcomes"
            items={[
              "Total tasks",
              "Completed tasks",
              "Delivered tasks",
              "Completion rate",
              "Delivery rate",
              "Average progress"
            ]}
          />

          <FeatureGroup
            title="Work Activity"
            items={[
              "Work hours",
              "Work entries",
              "Active days",
              "Work consistency",
              "Hours per active day",
              "Hours variability"
            ]}
          />

          <FeatureGroup
            title="Deadline Features"
            items={[
              "Tasks with deadlines",
              "Completed on time",
              "On-time completion rate",
              "Current overdue tasks",
              "Average completion days"
            ]}
          />

          <FeatureGroup
            title="Workload Features"
            items={[
              "Low-priority tasks",
              "Medium-priority tasks",
              "High-priority tasks",
              "Urgent tasks",
              "Revision events",
              "Work-type diversity"
            ]}
          />

        </div>

      </div>


      {/* ==================================================== */}
      {/* EMPLOYEE FEATURE SEARCH */}
      {/* ==================================================== */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <h2 className="font-semibold text-gray-900">
              Employee Feature Dataset
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Inspect the real features derived for each employee.
            </p>

          </div>


          <div className="w-full lg:w-80">

            <input
              type="text"
              value={
                search
              }
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder="Search employee..."
              className="w-full border rounded-lg px-3 py-2.5"
            />

          </div>

        </div>

      </div>


      {/* ==================================================== */}
      {/* EMPLOYEE FEATURE TABLE */}
      {/* ==================================================== */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b">

          <h2 className="font-semibold text-gray-900">
            ML Feature Matrix Preview
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {employeeRows.length} employee feature vector(s)
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
                  Tasks
                </th>

                <th className="text-left p-3">
                  Completion
                </th>

                <th className="text-left p-3">
                  Progress
                </th>

                <th className="text-left p-3">
                  Hours
                </th>

                <th className="text-left p-3">
                  Active Days
                </th>

                <th className="text-left p-3">
                  Consistency
                </th>

                <th className="text-left p-3">
                  On-Time
                </th>

                <th className="text-left p-3">
                  Overdue
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

              {employeeRows.length === 0 && (

                <tr>

                  <td
                    colSpan="11"
                    className="p-10 text-center text-gray-400"
                  >
                    No employee feature data found.
                  </td>

                </tr>

              )}


              {employeeRows.map(
                (employee) => {

                  const data =
                    employee.features
                    || {};


                  return (

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


                      {/* TASKS */}

                      <td className="p-3">
                        {
                          data.total_tasks
                          || 0
                        }
                      </td>


                      {/* COMPLETION */}

                      <td className="p-3 min-w-[125px]">

                        <PercentageBar
                          value={
                            data.completion_rate
                          }
                        />

                      </td>


                      {/* PROGRESS */}

                      <td className="p-3 min-w-[125px]">

                        <PercentageBar
                          value={
                            data.average_progress
                          }
                        />

                      </td>


                      {/* HOURS */}

                      <td className="p-3">
                        {
                          Number(
                            data.total_work_hours
                            || 0
                          ).toFixed(2)
                        }
                      </td>


                      {/* ACTIVE DAYS */}

                      <td className="p-3">
                        {
                          data.active_days
                          || 0
                        }
                      </td>


                      {/* CONSISTENCY */}

                      <td className="p-3">

                        {
                          Number(
                            data.work_consistency
                            || 0
                          ).toFixed(1)
                        }%

                      </td>


                      {/* ON TIME */}

                      <td className="p-3">

                        {
                          Number(
                            data.on_time_completion_rate
                            || 0
                          ).toFixed(1)
                        }%

                      </td>


                      {/* OVERDUE */}

                      <td className="p-3">

                        <CountBadge
                          value={
                            data.overdue_current
                            || 0
                          }
                          warning
                        />

                      </td>


                      {/* REVISIONS */}

                      <td className="p-3">

                        <CountBadge
                          value={
                            data.revision_events
                            || 0
                          }
                        />

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
                          Inspect Features
                        </button>

                      </td>

                    </tr>

                  );

                }
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ==================================================== */}
      {/* EMPLOYEE FEATURE DETAIL MODAL */}
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

              <div className="sticky top-0 bg-white z-10 border-b p-5 flex items-start justify-between">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Employee ML Feature Details
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


              {detailLoading && (

                <div className="p-10 text-center text-gray-500">
                  Loading employee features...
                </div>

              )}


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


              {!detailLoading
                &&
                selectedEmployee
                &&
                (

                  <EmployeeFeatureDetails
                    employee={
                      selectedEmployee
                    }
                    days={
                      days
                    }
                  />

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
// EMPLOYEE FEATURE DETAILS
// ============================================================

function EmployeeFeatureDetails({
  employee,
  days
}) {

  const data =
    employee.features
    || {};


  return (
    <div className="p-6">

      {/* EMPLOYEE */}

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <InfoItem
            title="Employee"
            value={
              employee.employee_name
            }
          />

          <InfoItem
            title="Employee Code"
            value={
              employee.employee_code
            }
          />

          <InfoItem
            title="Designation"
            value={
              employee.designation
              || "-"
            }
          />

          <InfoItem
            title="Analytics Window"
            value={
              `${days} days`
            }
          />

        </div>

      </div>


      {/* PRIMARY METRICS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <SummaryCard
          title="Total Tasks"
          value={
            data.total_tasks
            || 0
          }
        />

        <SummaryCard
          title="Completion Rate"
          value={
            `${Number(
              data.completion_rate
              || 0
            ).toFixed(1)}%`
          }
        />

        <SummaryCard
          title="Work Hours"
          value={
            Number(
              data.total_work_hours
              || 0
            ).toFixed(2)
          }
        />

        <SummaryCard
          title="Work Consistency"
          value={
            `${Number(
              data.work_consistency
              || 0
            ).toFixed(1)}%`
          }
        />

      </div>


      {/* TASK OUTCOMES */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        <FeatureSection
          title="Task Outcome Features"
          rows={[
            [
              "Total Tasks",
              data.total_tasks
            ],
            [
              "Completed",
              data.completed_tasks
            ],
            [
              "Delivered",
              data.delivered_tasks
            ],
            [
              "In Progress",
              data.in_progress_tasks
            ],
            [
              "Pending",
              data.pending_tasks
            ],
            [
              "Revision",
              data.revision_tasks
            ],
            [
              "Cancelled",
              data.cancelled_tasks
            ],
            [
              "Completion Rate",
              formatPercent(
                data.completion_rate
              )
            ],
            [
              "Delivery Rate",
              formatPercent(
                data.delivery_rate
              )
            ],
            [
              "Average Progress",
              formatPercent(
                data.average_progress
              )
            ]
          ]}
        />


        <FeatureSection
          title="Work Activity Features"
          rows={[
            [
              "Total Work Hours",
              formatNumber(
                data.total_work_hours
              )
            ],
            [
              "Work Entries",
              data.work_entries
            ],
            [
              "Active Days",
              data.active_days
            ],
            [
              "Work Consistency",
              formatPercent(
                data.work_consistency
              )
            ],
            [
              "Avg Hours / Active Day",
              formatNumber(
                data.average_hours_per_active_day
              )
            ],
            [
              "Daily Hours Variability",
              formatNumber(
                data.hours_variability
              )
            ]
          ]}
        />

      </div>


      {/* DEADLINE + WORKLOAD */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        <FeatureSection
          title="Deadline and Completion Features"
          rows={[
            [
              "Average Completion Days",
              formatNumber(
                data.average_completion_days
              )
            ],
            [
              "Tasks With Deadline",
              data.tasks_with_deadline
            ],
            [
              "Completed On Time",
              data.completed_on_time
            ],
            [
              "On-Time Completion Rate",
              formatPercent(
                data.on_time_completion_rate
              )
            ],
            [
              "Currently Overdue",
              data.overdue_current
            ],
            [
              "Revision Events",
              data.revision_events
            ]
          ]}
        />


        <FeatureSection
          title="Workload Composition"
          rows={[
            [
              "Low Priority Tasks",
              data.low_priority_tasks
            ],
            [
              "Medium Priority Tasks",
              data.medium_priority_tasks
            ],
            [
              "High Priority Tasks",
              data.high_priority_tasks
            ],
            [
              "Urgent Priority Tasks",
              data.urgent_priority_tasks
            ],
            [
              "Work-Type Diversity",
              data.work_type_diversity
            ]
          ]}
        />

      </div>


      {/* FEATURE QUALITY */}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">

        <h3 className="font-semibold text-blue-900">
          Feature Interpretation
        </h3>

        <p className="text-sm text-blue-800 mt-2">
          These values are model inputs and descriptive operational measurements. No employee classification, promotion recommendation, disciplinary recommendation, or other employment decision is generated from this feature vector.
        </p>

      </div>

    </div>
  );
}


// ============================================================
// FEATURE SECTION
// ============================================================

function FeatureSection({
  title,
  rows
}) {

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">

      <h3 className="font-semibold text-gray-900 mb-4">
        {title}
      </h3>


      <div>

        {rows.map(
          (
            [
              label,
              value
            ]
          ) => (

            <div
              key={
                label
              }
              className="flex items-center justify-between gap-4 py-2.5 border-b last:border-b-0"
            >

              <span className="text-sm text-gray-600">
                {label}
              </span>

              <span className="font-semibold text-gray-900 text-right">
                {
                  value
                  ?? 0
                }
              </span>

            </div>

          )
        )}

      </div>

    </div>
  );
}


// ============================================================
// FEATURE GROUP
// ============================================================

function FeatureGroup({
  title,
  items
}) {

  return (
    <div className="border border-gray-200 rounded-xl p-4">

      <h3 className="font-semibold text-gray-900">
        {title}
      </h3>


      <div className="mt-3 space-y-2">

        {items.map(
          (item) => (

            <div
              key={
                item
              }
              className="text-sm text-gray-500 flex gap-2"
            >

              <span>
                •
              </span>

              <span>
                {item}
              </span>

            </div>

          )
        )}

      </div>

    </div>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  subtitle
}) {

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="text-3xl font-bold text-gray-900 mt-2">
        {value}
      </p>

      {subtitle && (

        <p className="text-xs text-gray-400 mt-2">
          {subtitle}
        </p>

      )}

    </div>
  );
}


// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  title,
  value
}) {

  return (
    <div className="border border-gray-200 rounded-lg p-4">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="text-2xl font-bold text-gray-900 mt-2">
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
        {
          value
          || "-"
        }
      </p>

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
// COUNT BADGE
// ============================================================

function CountBadge({
  value,
  warning = false
}) {

  const count =
    Number(
      value
      || 0
    );


  let classes =
    "bg-gray-100 text-gray-700";


  if (
    warning
    &&
    count > 0
  ) {

    classes =
      "bg-red-100 text-red-700";

  } else if (
    count === 0
  ) {

    classes =
      "bg-green-100 text-green-700";
  }


  return (
    <span
      className={
        `inline-flex min-w-8 justify-center px-2.5 py-1 rounded-full text-xs font-semibold ${classes}`
      }
    >
      {count}
    </span>
  );
}


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(
  value
) {

  return Number(
    value
    || 0
  ).toFixed(
    2
  );
}


// ============================================================
// FORMAT PERCENT
// ============================================================

function formatPercent(
  value
) {

  return `${Number(
    value
    || 0
  ).toFixed(1)}%`;
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


  return value;
}