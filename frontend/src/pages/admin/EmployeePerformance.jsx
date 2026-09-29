import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getAdminEmployeePerformance,
  getAdminPerformance
} from "../../services/api";

import useDashboardSocket
  from "../../hooks/useDashboardSocket";


// ============================================================
// SORT OPTIONS
// ============================================================

const sortOptions = [
  {
    value: "performance_desc",
    label: "Performance Index: High to Low"
  },
  {
    value: "performance_asc",
    label: "Performance Index: Low to High"
  },
  {
    value: "completion_desc",
    label: "Completion Rate: High to Low"
  },
  {
    value: "progress_desc",
    label: "Average Progress: High to Low"
  },
  {
    value: "hours_desc",
    label: "7-Day Hours: High to Low"
  },
  {
    value: "consistency_desc",
    label: "Consistency: High to Low"
  },
  {
    value: "name_asc",
    label: "Employee Name: A-Z"
  }
];


export default function EmployeePerformance() {

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
    search,
    setSearch
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter
  ] = useState("");

  const [
    sortBy,
    setSortBy
  ] = useState(
    "performance_desc"
  );

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
  // LOAD TEAM PERFORMANCE
  // ==========================================================

  const loadTeamPerformance =
    useCallback(
      async () => {

        try {

          setLoading(true);
          setError("");

          const response =
            await getAdminPerformance();

          setEmployees(
            Array.isArray(
              response?.employees
            )
              ? response.employees
              : []
          );

        } catch (err) {

          console.error(
            "Admin performance load error:",
            err
          );

          const detail =
            err?.response
              ?.data
              ?.detail;

          setError(
            typeof detail === "string"
              ? detail
              : "Unable to load employee performance."
          );

        } finally {

          setLoading(false);

        }

      },
      []
    );


  useEffect(() => {

    loadTeamPerformance();

  }, [
    loadTeamPerformance
  ]);


  // ==========================================================
  // REAL-TIME REFRESH
  // ==========================================================

  const handleSocketMessage =
    useCallback(
      async (message) => {

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

            const response =
              await getAdminPerformance();

            setEmployees(
              Array.isArray(
                response?.employees
              )
                ? response.employees
                : []
            );


            if (
              selectedEmployee
              &&
              Number(
                selectedEmployee.employee_id
              )
              === Number(
                message.employee_id
              )
            ) {

              const detail =
                await getAdminEmployeePerformance(
                  selectedEmployee.employee_id
                );

              setSelectedEmployee(
                detail
              );

            }

          } catch (err) {

            console.error(
              "Performance realtime refresh error:",
              err
            );

          }

        }

      },
      [
        selectedEmployee
      ]
    );


  useDashboardSocket(
    handleSocketMessage
  );


  // ==========================================================
  // OPEN EMPLOYEE DETAIL
  // ==========================================================

  const openEmployeeDetail =
    async (
      employeeId
    ) => {

      try {

        setDetailLoading(true);
        setDetailError("");

        const response =
          await getAdminEmployeePerformance(
            employeeId
          );

        setSelectedEmployee(
          response
        );

      } catch (err) {

        console.error(
          "Employee performance detail error:",
          err
        );

        const detail =
          err?.response
            ?.data
            ?.detail;

        setDetailError(
          typeof detail === "string"
            ? detail
            : "Unable to load employee performance details."
        );

      } finally {

        setDetailLoading(false);

      }
    };


  // ==========================================================
  // CLOSE EMPLOYEE DETAIL
  // ==========================================================

  const closeEmployeeDetail =
    () => {

      setSelectedEmployee(
        null
      );

      setDetailError("");
    };


  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const visibleEmployees =
    useMemo(
      () => {

        let result = [
          ...employees
        ];


        const query =
          search
            .trim()
            .toLowerCase();


        if (query) {

          result =
            result.filter(
              (employee) => {

                return (
                  (
                    employee.employee_name
                    || ""
                  )
                    .toLowerCase()
                    .includes(
                      query
                    )
                  ||
                  (
                    employee.employee_code
                    || ""
                  )
                    .toLowerCase()
                    .includes(
                      query
                    )
                  ||
                  (
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

        }


        if (statusFilter) {

          result =
            result.filter(
              (employee) =>
                employee.employment_status
                === statusFilter
            );

        }


        result.sort(
          (a, b) => {

            switch (
              sortBy
            ) {

              case "performance_asc":

                return (
                  Number(
                    a.performance_index
                    || 0
                  )
                  -
                  Number(
                    b.performance_index
                    || 0
                  )
                );


              case "completion_desc":

                return (
                  Number(
                    b.tasks
                      ?.completion_rate
                    || 0
                  )
                  -
                  Number(
                    a.tasks
                      ?.completion_rate
                    || 0
                  )
                );


              case "progress_desc":

                return (
                  Number(
                    b.tasks
                      ?.average_progress
                    || 0
                  )
                  -
                  Number(
                    a.tasks
                      ?.average_progress
                    || 0
                  )
                );


              case "hours_desc":

                return (
                  Number(
                    b.week?.hours
                    || 0
                  )
                  -
                  Number(
                    a.week?.hours
                    || 0
                  )
                );


              case "consistency_desc":

                return (
                  Number(
                    b.week
                      ?.work_consistency
                    || 0
                  )
                  -
                  Number(
                    a.week
                      ?.work_consistency
                    || 0
                  )
                );


              case "name_asc":

                return (
                  (
                    a.employee_name
                    || ""
                  ).localeCompare(
                    b.employee_name
                    || ""
                  )
                );


              case "performance_desc":
              default:

                return (
                  Number(
                    b.performance_index
                    || 0
                  )
                  -
                  Number(
                    a.performance_index
                    || 0
                  )
                );
            }

          }
        );


        return result;

      },
      [
        employees,
        search,
        statusFilter,
        sortBy
      ]
    );


  // ==========================================================
  // TEAM SUMMARY
  // ==========================================================

  const teamSummary =
    useMemo(
      () => {

        const totalEmployees =
          employees.length;


        const activeEmployees =
          employees.filter(
            (employee) =>
              employee.employment_status
              === "active"
          ).length;


        const totalTasks =
          employees.reduce(
            (
              total,
              employee
            ) =>
              total
              +
              Number(
                employee.tasks?.total
                || 0
              ),
            0
          );


        const completedTasks =
          employees.reduce(
            (
              total,
              employee
            ) =>
              total
              +
              Number(
                employee.tasks
                  ?.completed
                || 0
              ),
            0
          );


        const weeklyHours =
          employees.reduce(
            (
              total,
              employee
            ) =>
              total
              +
              Number(
                employee.week?.hours
                || 0
              ),
            0
          );


        const averageIndex =
          totalEmployees > 0
            ? (
                employees.reduce(
                  (
                    total,
                    employee
                  ) =>
                    total
                    +
                    Number(
                      employee.performance_index
                      || 0
                    ),
                  0
                )
                /
                totalEmployees
              )
            : 0;


        const averageCompletion =
          totalEmployees > 0
            ? (
                employees.reduce(
                  (
                    total,
                    employee
                  ) =>
                    total
                    +
                    Number(
                      employee.tasks
                        ?.completion_rate
                      || 0
                    ),
                  0
                )
                /
                totalEmployees
              )
            : 0;


        return {

          totalEmployees,
          activeEmployees,
          totalTasks,
          completedTasks,
          weeklyHours,
          averageIndex,
          averageCompletion
        };

      },
      [
        employees
      ]
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
    &&
    employees.length === 0
  ) {

    return (
      <div className="p-6">
        Loading employee performance...
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
            Employee Performance
          </h1>

          <p className="text-gray-500 mt-1">
            Compare employee work and task-performance indicators.
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Performance Index is a configurable comparison indicator based on completion rate, average task progress, delivery rate, and 7-day work consistency.
          </p>

        </div>


        <button
          onClick={
            loadTeamPerformance
          }
          className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm"
        >
          Refresh
        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-5">
          {error}
        </div>

      )}


      {/* TEAM SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <SummaryCard
          title="Employees"
          value={
            teamSummary.totalEmployees
          }
          subtitle={
            `${teamSummary.activeEmployees} active`
          }
        />


        <SummaryCard
          title="Team Tasks"
          value={
            teamSummary.totalTasks
          }
          subtitle={
            `${teamSummary.completedTasks} completed`
          }
        />


        <SummaryCard
          title="7-Day Team Hours"
          value={
            teamSummary.weeklyHours
              .toFixed(2)
          }
          subtitle="Recorded work hours"
        />


        <SummaryCard
          title="Average Performance Index"
          value={
            `${teamSummary.averageIndex.toFixed(1)}%`
          }
          subtitle={
            `Avg completion ${teamSummary.averageCompletion.toFixed(1)}%`
          }
        />

      </div>


      {/* FILTERS */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Search Employee
            </label>

            <input
              value={
                search
              }
              onChange={
                (event) =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder="Name, employee code, designation..."
              className="w-full border rounded-lg px-3 py-2.5"
            />

          </div>


          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Employment Status
            </label>

            <select
              value={
                statusFilter
              }
              onChange={
                (event) =>
                  setStatusFilter(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              <option value="">
                All Employees
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="resigned">
                Resigned
              </option>

            </select>

          </div>


          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Sort By
            </label>

            <select
              value={
                sortBy
              }
              onChange={
                (event) =>
                  setSortBy(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              {sortOptions.map(
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

        </div>

      </div>


      {/* TEAM PERFORMANCE TABLE */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b">

          <h2 className="font-semibold text-gray-900">
            Team Performance Comparison
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {visibleEmployees.length} employee(s)
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
                  Completed
                </th>

                <th className="text-left p-3">
                  Completion
                </th>

                <th className="text-left p-3">
                  Avg Progress
                </th>

                <th className="text-left p-3">
                  Delivery
                </th>

                <th className="text-left p-3">
                  7-Day Hours
                </th>

                <th className="text-left p-3">
                  Consistency
                </th>

                <th className="text-left p-3">
                  Revisions
                </th>

                <th className="text-left p-3">
                  Performance Index
                </th>

                <th className="text-left p-3">
                  Details
                </th>

              </tr>

            </thead>


            <tbody>

              {visibleEmployees.length === 0 && (

                <tr>

                  <td
                    colSpan="11"
                    className="p-10 text-center text-gray-400"
                  >
                    No employee performance records found.
                  </td>

                </tr>

              )}


              {visibleEmployees.map(
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

                      {
                        employee.designation
                        &&
                        (
                          <div className="text-xs text-gray-400 mt-1">
                            {
                              employee.designation
                            }
                          </div>
                        )
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


                    {/* DELIVERY RATE */}

                    <td className="p-3">

                      {
                        Number(
                          employee.tasks
                            ?.delivery_rate
                          || 0
                        ).toFixed(1)
                      }%

                    </td>


                    {/* HOURS */}

                    <td className="p-3">

                      <div className="font-semibold text-gray-900">

                        {
                          Number(
                            employee.week
                              ?.hours
                            || 0
                          ).toFixed(2)
                        }

                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {
                          employee.week
                            ?.entries
                          || 0
                        } entries
                      </div>

                    </td>


                    {/* CONSISTENCY */}

                    <td className="p-3">

                      <div>
                        {
                          Number(
                            employee.week
                              ?.work_consistency
                            || 0
                          ).toFixed(1)
                        }%
                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {
                          employee.week
                            ?.active_days
                          || 0
                        }/7 days
                      </div>

                    </td>


                    {/* REVISIONS */}

                    <td className="p-3">

                      {
                        employee.tasks
                          ?.revision_count
                        || 0
                      }

                    </td>


                    {/* PERFORMANCE */}

                    <td className="p-3 min-w-[150px]">

                      <PerformanceBadge
                        value={
                          employee.performance_index
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
                        View Details
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
      {/* DETAIL MODAL */}
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

              {/* MODAL HEADER */}

              <div className="sticky top-0 bg-white z-10 border-b p-5 flex items-start justify-between">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Employee Performance Details
                  </h2>

                  {
                    selectedEmployee
                    &&
                    (
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
                    )
                  }

                </div>


                <button
                  onClick={
                    closeEmployeeDetail
                  }
                  className="text-2xl text-gray-500 hover:text-gray-900"
                >
                  ×
                </button>

              </div>


              {/* DETAIL LOADING */}

              {detailLoading && (

                <div className="p-10 text-center text-gray-500">
                  Loading employee performance...
                </div>

              )}


              {/* DETAIL ERROR */}

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


              {/* DETAIL CONTENT */}

              {!detailLoading
                &&
                selectedEmployee
                &&
                (

                  <div className="p-6">

                    {/* EMPLOYEE INFORMATION */}

                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                        <InfoItem
                          title="Employee"
                          value={
                            selectedEmployee.employee_name
                          }
                        />

                        <InfoItem
                          title="Employee Code"
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


                    {/* MAIN PERFORMANCE CARDS */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

                      <SummaryCard
                        title="Performance Index"
                        value={
                          `${Number(
                            selectedEmployee.performance_index
                            || 0
                          ).toFixed(1)}%`
                        }
                        subtitle="Composite comparison indicator"
                      />

                      <SummaryCard
                        title="Completion Rate"
                        value={
                          `${Number(
                            selectedEmployee.tasks
                              ?.completion_rate
                            || 0
                          ).toFixed(1)}%`
                        }
                        subtitle={
                          `${selectedEmployee.tasks?.completed || 0} completed`
                        }
                      />

                      <SummaryCard
                        title="Average Progress"
                        value={
                          `${Number(
                            selectedEmployee.tasks
                              ?.average_progress
                            || 0
                          ).toFixed(1)}%`
                        }
                        subtitle="Across assigned tasks"
                      />

                      <SummaryCard
                        title="7-Day Hours"
                        value={
                          Number(
                            selectedEmployee.week
                              ?.hours
                            || 0
                          ).toFixed(2)
                        }
                        subtitle={
                          `${selectedEmployee.week?.entries || 0} work entries`
                        }
                      />

                    </div>


                    {/* TODAY */}

                    <div className="mb-6">

                      <h3 className="font-semibold text-gray-900 mb-3">
                        Today's Activity
                      </h3>


                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <MetricCard
                          title="Hours Today"
                          value={
                            Number(
                              selectedEmployee.today
                                ?.hours
                              || 0
                            ).toFixed(2)
                          }
                        />

                        <MetricCard
                          title="Work Entries Today"
                          value={
                            selectedEmployee.today
                              ?.entries
                            || 0
                          }
                        />

                      </div>

                    </div>


                    {/* TASK STATUS */}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                      <div className="bg-white border border-gray-200 rounded-xl p-5">

                        <h3 className="font-semibold text-gray-900 mb-4">
                          Task Status
                        </h3>


                        <TaskStatusRow
                          label="Total"
                          value={
                            selectedEmployee.tasks
                              ?.total
                            || 0
                          }
                        />

                        <TaskStatusRow
                          label="Completed"
                          value={
                            selectedEmployee.tasks
                              ?.completed
                            || 0
                          }
                        />

                        <TaskStatusRow
                          label="Delivered"
                          value={
                            selectedEmployee.tasks
                              ?.delivered
                            || 0
                          }
                        />

                        <TaskStatusRow
                          label="In Progress"
                          value={
                            selectedEmployee.tasks
                              ?.in_progress
                            || 0
                          }
                        />

                        <TaskStatusRow
                          label="Pending"
                          value={
                            selectedEmployee.tasks
                              ?.pending
                            || 0
                          }
                        />

                        <TaskStatusRow
                          label="Revision"
                          value={
                            selectedEmployee.tasks
                              ?.revision
                            || 0
                          }
                        />

                        <TaskStatusRow
                          label="Cancelled"
                          value={
                            selectedEmployee.tasks
                              ?.cancelled
                            || 0
                          }
                        />

                      </div>


                      {/* INDICATORS */}

                      <div className="bg-white border border-gray-200 rounded-xl p-5">

                        <h3 className="font-semibold text-gray-900 mb-4">
                          Performance Indicators
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
                          label="Average Progress"
                          value={
                            selectedEmployee.tasks
                              ?.average_progress
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
                          label="Work Consistency"
                          value={
                            selectedEmployee.week
                              ?.work_consistency
                            || 0
                          }
                        />


                        <div className="mt-5 pt-4 border-t flex justify-between">

                          <span className="text-sm text-gray-500">
                            Revision Count
                          </span>

                          <span className="font-semibold text-gray-900">
                            {
                              selectedEmployee.tasks
                                ?.revision_count
                              || 0
                            }
                          </span>

                        </div>

                      </div>

                    </div>


                    {/* 7 DAY CHART */}

                    <WeeklyHoursChart
                      daily={
                        selectedEmployee.week
                          ?.daily
                        || []
                      }
                    />


                    {/* RECENT TASKS */}

                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">

                      <div className="p-5 border-b">

                        <h3 className="font-semibold text-gray-900">
                          Recent Tasks
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Latest assigned tasks.
                        </p>

                      </div>


                      <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                          <thead className="bg-gray-50">

                            <tr>

                              <th className="text-left p-3">
                                Task
                              </th>

                              <th className="text-left p-3">
                                Type
                              </th>

                              <th className="text-left p-3">
                                Priority
                              </th>

                              <th className="text-left p-3">
                                Status
                              </th>

                              <th className="text-left p-3">
                                Progress
                              </th>

                              <th className="text-left p-3">
                                Revisions
                              </th>

                              <th className="text-left p-3">
                                Deadline
                              </th>

                            </tr>

                          </thead>


                          <tbody>

                            {
                              !selectedEmployee.recent_tasks
                              ||
                              selectedEmployee.recent_tasks.length
                              === 0
                                ? (

                                  <tr>

                                    <td
                                      colSpan="7"
                                      className="p-8 text-center text-gray-400"
                                    >
                                      No task records available.
                                    </td>

                                  </tr>

                                )
                                : (

                                  selectedEmployee.recent_tasks.map(
                                    (task) => (

                                      <tr
                                        key={
                                          task.id
                                        }
                                        className="border-t"
                                      >

                                        <td className="p-3 min-w-[180px]">

                                          <div className="font-medium">
                                            #{task.id} {task.title}
                                          </div>

                                        </td>


                                        <td className="p-3">
                                          {
                                            formatLabel(
                                              task.work_type
                                            )
                                          }
                                        </td>


                                        <td className="p-3">
                                          {
                                            formatLabel(
                                              task.priority
                                            )
                                          }
                                        </td>


                                        <td className="p-3">

                                          <StatusBadge
                                            status={
                                              task.status
                                            }
                                          />

                                        </td>


                                        <td className="p-3">
                                          {
                                            task.progress_percentage
                                            ?? 0
                                          }%
                                        </td>


                                        <td className="p-3">
                                          {
                                            task.revision_count
                                            || 0
                                          }
                                        </td>


                                        <td className="p-3 whitespace-nowrap">
                                          {
                                            formatDate(
                                              task.deadline
                                            )
                                          }
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


                    {/* RECENT WORK */}

                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                      <div className="p-5 border-b">

                        <h3 className="font-semibold text-gray-900">
                          Recent Daily Work
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Latest employee work submissions.
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

                            </tr>

                          </thead>


                          <tbody>

                            {
                              !selectedEmployee.recent_work
                              ||
                              selectedEmployee.recent_work.length
                              === 0
                                ? (

                                  <tr>

                                    <td
                                      colSpan="7"
                                      className="p-8 text-center text-gray-400"
                                    >
                                      No daily work records available.
                                    </td>

                                  </tr>

                                )
                                : (

                                  selectedEmployee.recent_work.map(
                                    (record) => (

                                      <tr
                                        key={
                                          record.id
                                        }
                                        className="border-t"
                                      >

                                        <td className="p-3 whitespace-nowrap">
                                          {
                                            formatDate(
                                              record.work_date
                                            )
                                          }
                                        </td>


                                        <td className="p-3 min-w-[180px]">

                                          <div className="font-medium text-gray-900">
                                            {
                                              record.title
                                              || "-"
                                            }
                                          </div>

                                          {
                                            record.remarks
                                            &&
                                            (
                                              <div
                                                className="text-xs text-gray-400 mt-1 max-w-[260px] truncate"
                                                title={
                                                  record.remarks
                                                }
                                              >
                                                {
                                                  record.remarks
                                                }
                                              </div>
                                            )
                                          }

                                        </td>


                                        <td className="p-3">

                                          {
                                            record.task_id
                                              ? `#${record.task_id}`
                                              : "-"
                                          }

                                        </td>


                                        <td className="p-3">
                                          {
                                            formatLabel(
                                              record.work_type
                                            )
                                          }
                                        </td>


                                        <td className="p-3">

                                          {
                                            Number(
                                              record.hours_spent
                                              || 0
                                            ).toFixed(2)
                                          }

                                        </td>


                                        <td className="p-3">

                                          <StatusBadge
                                            status={
                                              record.status
                                            }
                                          />

                                        </td>


                                        <td className="p-3">
                                          {
                                            record.progress_percentage
                                            ?? 0
                                          }%
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

      {
        subtitle
        &&
        (
          <p className="text-xs text-gray-400 mt-2">
            {subtitle}
          </p>
        )
      }

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
    <div className="bg-white border border-gray-200 rounded-xl p-5">

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
        {value || "-"}
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
    <div>

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

    </div>
  );
}


// ============================================================
// PERFORMANCE BADGE
// ============================================================

function PerformanceBadge({
  value
}) {

  const score =
    Number(
      value
      || 0
    );


  let classes =
    "bg-gray-100 text-gray-700";

  if (
    score >= 80
  ) {

    classes =
      "bg-green-100 text-green-700";

  } else if (
    score >= 60
  ) {

    classes =
      "bg-blue-100 text-blue-700";

  } else if (
    score >= 40
  ) {

    classes =
      "bg-yellow-100 text-yellow-700";

  } else {

    classes =
      "bg-red-100 text-red-700";
  }


  return (
    <span
      className={
        `inline-flex px-3 py-1.5 rounded-full font-semibold ${classes}`
      }
      title="Composite comparison indicator"
    >
      {score.toFixed(1)}%
    </span>
  );
}


// ============================================================
// TASK STATUS ROW
// ============================================================

function TaskStatusRow({
  label,
  value
}) {

  return (
    <div className="flex justify-between items-center py-2.5 border-b last:border-b-0">

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
// INDICATOR ROW
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

        <span className="text-sm font-semibold text-gray-900">
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
// WEEKLY HOURS CHART
// ============================================================

function WeeklyHoursChart({
  daily
}) {

  const safeDaily =
    Array.isArray(
      daily
    )
      ? daily
      : [];


  const maxHours =
    safeDaily.length > 0
      ? Math.max(
          1,
          ...safeDaily.map(
            (item) =>
              Number(
                item.hours
                || 0
              )
          )
        )
      : 1;


  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">

      <div className="mb-5">

        <h3 className="font-semibold text-gray-900">
          Last 7 Days
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Daily recorded work hours.
        </p>

      </div>


      {
        safeDaily.length === 0
          ? (

            <div className="py-10 text-center text-gray-400">
              No weekly data available.
            </div>

          )
          : (

            <div className="h-64 flex items-end gap-3">

              {safeDaily.map(
                (item) => {

                  const hours =
                    Number(
                      item.hours
                      || 0
                    );


                  const height =
                    hours > 0
                      ? Math.max(
                          5,
                          (
                            hours
                            /
                            maxHours
                          )
                          *
                          100
                        )
                      : 2;


                  return (

                    <div
                      key={
                        item.date
                      }
                      className="flex-1 h-full flex flex-col justify-end"
                    >

                      <div className="text-center text-xs font-medium text-gray-600 mb-2">

                        {
                          hours.toFixed(
                            1
                          )
                        }h

                      </div>


                      <div className="flex-1 flex items-end justify-center">

                        <div
                          className="w-full max-w-14 bg-blue-500 hover:bg-blue-600 rounded-t-lg transition-all"
                          style={{
                            height:
                              `${height}%`
                          }}
                          title={
                            `${item.date}: ${hours.toFixed(2)} hours`
                          }
                        />

                      </div>


                      <div className="border-t pt-2 text-center">

                        <div className="text-sm font-medium text-gray-700">
                          {
                            item.day
                          }
                        </div>

                        <div className="text-[11px] text-gray-400">
                          {
                            shortDate(
                              item.date
                            )
                          }
                        </div>

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
// LABEL FORMAT
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
// DATE FORMAT
// ============================================================

function formatDate(
  value
) {

  if (!value) {
    return "-";
  }


  /*
    Backend work_date values are YYYY-MM-DD.
    Parsing these manually avoids timezone shifts.
  */

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
