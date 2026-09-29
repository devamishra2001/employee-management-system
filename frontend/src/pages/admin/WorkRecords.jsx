import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getAdminWorkRecords,
  getEmployees,
  getTasks
} from "../../services/api";

import useDashboardSocket
  from "../../hooks/useDashboardSocket";


export default function WorkRecords() {

  const [
    records,
    setRecords
  ] = useState([]);

  const [
    employees,
    setEmployees
  ] = useState([]);

  const [
    tasks,
    setTasks
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
    employeeFilter,
    setEmployeeFilter
  ] = useState("");

  const [
    dateFilter,
    setDateFilter
  ] = useState("");

  const [
    taskFilter,
    setTaskFilter
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter
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
          recordsData,
          employeesData,
          tasksData
        ] = await Promise.all([
          getAdminWorkRecords(),
          getEmployees(),
          getTasks()
        ]);

        setRecords(
          recordsData
        );

        setEmployees(
          employeesData
        );

        setTasks(
          tasksData
        );

      } catch (err) {

        console.error(
          "Admin work records loading error:",
          err
        );

        setError(
          "Unable to load work records."
        );

      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // FILTERED LOAD
  // ==========================================================

  const loadRecords =
    async () => {

      try {

        setLoading(true);
        setError("");

        const data =
          await getAdminWorkRecords({

            employee_id:
              employeeFilter
              || undefined,

            work_date:
              dateFilter
              || undefined,

            task_id:
              taskFilter
              || undefined,

            status:
              statusFilter
              || undefined

          });

        setRecords(
          data
        );

      } catch (err) {

        console.error(
          "Admin work record filter error:",
          err
        );

        setError(
          "Unable to filter work records."
        );

      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters =
    async () => {

      setEmployeeFilter("");
      setDateFilter("");
      setTaskFilter("");
      setStatusFilter("");

      try {

        const data =
          await getAdminWorkRecords();

        setRecords(
          data
        );

      } catch (err) {

        console.error(err);

        setError(
          "Unable to reload work records."
        );

      }
    };


  // ==========================================================
  // REAL-TIME WEBSOCKET
  // ==========================================================

  const handleSocketMessage =
    useCallback(
      async (message) => {

        if (
          message.event
          === "work_record_created"
          ||
          message.event
          === "work_record_updated"
          ||
          message.event
          === "work_record_deleted"
        ) {

          try {

            const data =
              await getAdminWorkRecords({

                employee_id:
                  employeeFilter
                  || undefined,

                work_date:
                  dateFilter
                  || undefined,

                task_id:
                  taskFilter
                  || undefined,

                status:
                  statusFilter
                  || undefined

              });

            setRecords(
              data
            );

          } catch (err) {

            console.error(
              "Realtime work record refresh error:",
              err
            );

          }

        }

      },
      [
        employeeFilter,
        dateFilter,
        taskFilter,
        statusFilter
      ]
    );


  useDashboardSocket(
    handleSocketMessage
  );


  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary =
    useMemo(
      () => {

        const totalRecords =
          records.length;

        const totalHours =
          records.reduce(
            (
              total,
              record
            ) =>
              total
              +
              Number(
                record.hours_spent
                || 0
              ),
            0
          );

        const uniqueEmployees =
          new Set(
            records.map(
              (record) =>
                record.employee_id
            )
          ).size;

        const completed =
          records.filter(
            (record) =>
              record.status
              === "completed"
          ).length;

        const inProgress =
          records.filter(
            (record) =>
              record.status
              === "in_progress"
          ).length;

        return {
          totalRecords,
          totalHours,
          uniqueEmployees,
          completed,
          inProgress
        };

      },
      [
        records
      ]
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
    &&
    records.length === 0
  ) {

    return (
      <div className="p-6">
        Loading work records...
      </div>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div>

      {/* HEADER */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          All Work Records
        </h1>

        <p className="text-gray-500 mt-1">
          Monitor daily work entries submitted by all employees.
        </p>

      </div>


      {/* ERROR */}

      {error && (

        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-5">
          {error}
        </div>

      )}


      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">

        <SummaryCard
          title="Work Entries"
          value={
            summary.totalRecords
          }
        />

        <SummaryCard
          title="Total Hours"
          value={
            summary.totalHours
              .toFixed(2)
          }
        />

        <SummaryCard
          title="Employees"
          value={
            summary.uniqueEmployees
          }
        />

        <SummaryCard
          title="In Progress"
          value={
            summary.inProgress
          }
        />

        <SummaryCard
          title="Completed"
          value={
            summary.completed
          }
        />

      </div>


      {/* FILTERS */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">

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


          {/* DATE */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Date
            </label>

            <input
              type="date"
              value={
                dateFilter
              }
              onChange={
                (event) =>
                  setDateFilter(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            />

          </div>


          {/* TASK */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Task
            </label>

            <select
              value={
                taskFilter
              }
              onChange={
                (event) =>
                  setTaskFilter(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              <option value="">
                All Tasks
              </option>

              {tasks.map(
                (task) => (

                  <option
                    key={
                      task.id
                    }
                    value={
                      task.id
                    }
                  >
                    #{task.id} - {task.title}
                  </option>

                )
              )}

            </select>

          </div>


          {/* STATUS */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Status
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
                All Statuses
              </option>

              <option value="received">
                Received
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="in_progress">
                In Progress
              </option>

              <option value="delivered">
                Delivered
              </option>

              <option value="revision">
                Revision
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

            </select>

          </div>


          {/* APPLY */}

          <div className="flex items-end">

            <button
              onClick={
                loadRecords
              }
              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg"
            >
              Apply
            </button>

          </div>


          {/* CLEAR */}

          <div className="flex items-end">

            <button
              onClick={
                clearFilters
              }
              className="w-full border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-lg"
            >
              Clear
            </button>

          </div>

        </div>

      </div>


      {/* TABLE */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b">

          <h2 className="font-semibold text-gray-900">
            Employee Work History
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {records.length} record(s)
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
                  Employee
                </th>

                <th className="text-left p-3">
                  Work
                </th>

                <th className="text-left p-3">
                  Task
                </th>

                <th className="text-left p-3">
                  Project
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

              {records.length === 0 && (

                <tr>

                  <td
                    colSpan="9"
                    className="p-8 text-center text-gray-400"
                  >
                    No work records found.
                  </td>

                </tr>

              )}


              {records.map(
                (record) => (

                  <tr
                    key={
                      record.id
                    }
                    className="border-t hover:bg-gray-50"
                  >

                    {/* DATE */}

                    <td className="p-3 whitespace-nowrap">

                      {
                        formatDate(
                          record.work_date
                        )
                      }

                    </td>


                    {/* EMPLOYEE */}

                    <td className="p-3">

                      <div className="font-medium text-gray-900">
                        {
                          record.employee_name
                          || "-"
                        }
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        {
                          record.employee_code
                          || "-"
                        }
                      </div>

                    </td>


                    {/* WORK */}

                    <td className="p-3 min-w-[220px]">

                      <div className="font-medium text-gray-900">
                        {
                          record.title
                          || "-"
                        }
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        {
                          record.work_type
                          || "-"
                        }
                      </div>

                      {record.description && (

                        <div className="text-xs text-gray-400 mt-1 max-w-[260px] truncate">
                          {
                            record.description
                          }
                        </div>

                      )}

                    </td>


                    {/* TASK */}

                    <td className="p-3 min-w-[160px]">

                      {
                        record.task_id
                          ? (
                            <>
                              <div className="font-medium">
                                #{record.task_id}
                              </div>

                              <div className="text-xs text-gray-500">
                                {
                                  record.task_title
                                  || "-"
                                }
                              </div>
                            </>
                          )
                          : "-"
                      }

                    </td>


                    {/* PROJECT */}

                    <td className="p-3">

                      {
                        record.project_code
                        ||
                        (
                          record.project_id
                            ? `#${record.project_id}`
                            : "-"
                        )
                      }

                    </td>


                    {/* HOURS */}

                    <td className="p-3">

                      {
                        record.hours_spent
                        ?? "-"
                      }

                    </td>


                    {/* STATUS */}

                    <td className="p-3">

                      <StatusBadge
                        status={
                          record.status
                        }
                      />

                    </td>


                    {/* PROGRESS */}

                    <td className="p-3 min-w-[140px]">

                      <div className="flex items-center gap-2">

                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">

                          <div
                            className="h-2 bg-blue-600 rounded-full"
                            style={{
                              width:
                                `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Number(
                                      record.progress_percentage
                                    )
                                    || 0
                                  )
                                )}%`
                            }}
                          />

                        </div>

                        <span>
                          {
                            record.progress_percentage
                            ?? 0
                          }%
                        </span>

                      </div>

                    </td>


                    {/* REMARKS */}

                    <td className="p-3 max-w-[240px]">

                      <span
                        title={
                          record.remarks
                          || ""
                        }
                      >
                        {
                          record.remarks
                          || "-"
                        }
                      </span>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>

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

      <h2 className="text-3xl font-bold text-gray-900 mt-2">
        {value}
      </h2>

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
          || "bg-gray-100 text-gray-700"
        }`
      }
    >

      {
        status
          ? status.replace(
              "_",
              " "
            )
          : "-"
      }

    </span>
  );
}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(
  dateValue
) {

  if (!dateValue) {
    return "-";
  }


  const [
    year,
    month,
    day
  ] = dateValue.split("-");


  if (
    !year
    ||
    !month
    ||
    !day
  ) {

    return dateValue;
  }


  return `${day}-${month}-${year}`;
}