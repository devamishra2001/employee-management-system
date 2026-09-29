import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getMyPerformance
} from "../../services/api";


export default function MyPerformance() {

  const [
    data,
    setData
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");


  // ==========================================================
  // LOAD PERFORMANCE DATA
  // ==========================================================

  useEffect(() => {

    loadPerformance();

  }, []);


  const loadPerformance =
    async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await getMyPerformance();

        setData(
          response
        );

      } catch (err) {

        console.error(
          "Performance load error:",
          err
        );

        const detail =
          err?.response
            ?.data
            ?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Unable to load performance data."
        );

      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // CHART PREPARATION
  // ==========================================================

  const chartData =
    useMemo(
      () => {

        if (
          !data?.week?.daily
        ) {

          return [];
        }

        return data.week.daily;

      },
      [
        data
      ]
    );


  const maxHours =
    useMemo(
      () => {

        if (
          chartData.length === 0
        ) {

          return 1;
        }

        const maximum =
          Math.max(
            ...chartData.map(
              (item) =>
                Number(
                  item.hours
                  || 0
                )
            )
          );

        return maximum > 0
          ? maximum
          : 1;

      },
      [
        chartData
      ]
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="p-6">
        Loading performance...
      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error
    &&
    !data
  ) {

    return (
      <div>

        <div className="mb-6">

          <h1 className="text-2xl font-bold text-gray-900">
            My Performance
          </h1>

        </div>

        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">

          <p>
            {error}
          </p>

          <button
            onClick={
              loadPerformance
            }
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">
            My Performance
          </h1>

          <p className="text-gray-500 mt-1">

            {
              data?.employee?.name
              || "Employee"
            }

            {
              data?.employee
                ?.employee_code
                ? ` • ${data.employee.employee_code}`
                : ""
            }

          </p>

          {
            data?.employee
              ?.designation
            &&
            (
              <p className="text-sm text-gray-400 mt-1">
                {
                  data.employee
                    .designation
                }
              </p>
            )
          }

        </div>


        <button
          onClick={
            loadPerformance
          }
          className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded-lg text-sm"
        >
          Refresh
        </button>

      </div>


      {/* ERROR MESSAGE */}

      {error && (

        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-5">
          {error}
        </div>

      )}


      {/* TODAY SUMMARY */}

      <div className="mb-6">

        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Today
        </h2>


        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <SummaryCard
            title="Today's Hours"
            value={
              Number(
                data?.today?.hours
                || 0
              ).toFixed(2)
            }
            subtitle="Hours recorded today"
          />


          <SummaryCard
            title="Work Entries"
            value={
              data?.today?.entries
              || 0
            }
            subtitle="Entries submitted today"
          />


          <SummaryCard
            title="Completed Entries"
            value={
              data?.today
                ?.completed_entries
              || 0
            }
            subtitle="Today's completed work"
          />


          <SummaryCard
            title="7-Day Hours"
            value={
              Number(
                data?.week?.hours
                || 0
              ).toFixed(2)
            }
            subtitle="Total hours in last 7 days"
          />

        </div>

      </div>


      {/* TASK PERFORMANCE */}

      <div className="mb-6">

        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Task Performance
        </h2>


        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">

          <MetricCard
            title="Total Tasks"
            value={
              data?.tasks?.total
              || 0
            }
          />


          <MetricCard
            title="Completed"
            value={
              data?.tasks?.completed
              || 0
            }
          />


          <MetricCard
            title="In Progress"
            value={
              data?.tasks?.in_progress
              || 0
            }
          />


          <MetricCard
            title="Pending"
            value={
              data?.tasks?.pending
              || 0
            }
          />


          <MetricCard
            title="Delivered"
            value={
              data?.tasks?.delivered
              || 0
            }
          />


          <MetricCard
            title="Average Progress"
            value={
              `${Number(
                data?.tasks
                  ?.average_progress
                || 0
              ).toFixed(1)}%`
            }
          />

        </div>

      </div>


      {/* AVERAGE PROGRESS */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

        <div className="flex justify-between items-center mb-3">

          <div>

            <h2 className="font-semibold text-gray-900">
              Overall Task Progress
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Average progress across all assigned tasks.
            </p>

          </div>


          <span className="text-2xl font-bold text-gray-900">

            {
              Number(
                data?.tasks
                  ?.average_progress
                || 0
              ).toFixed(1)
            }%

          </span>

        </div>


        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">

          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{
              width:
                `${Math.min(
                  100,
                  Math.max(
                    0,
                    Number(
                      data?.tasks
                        ?.average_progress
                      || 0
                    )
                  )
                )}%`
            }}
          />

        </div>

      </div>


      {/* 7-DAY CHART */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">

          <div>

            <h2 className="font-semibold text-gray-900">
              Last 7 Days
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Daily hours recorded from your work entries.
            </p>

          </div>


          <div className="text-sm text-gray-500">

            {
              data?.week?.entries
              || 0
            } work entries

          </div>

        </div>


        <div className="h-72 flex items-end gap-3">

          {chartData.map(
            (item) => {

              const hours =
                Number(
                  item.hours
                  || 0
                );

              const percentage =
                (
                  hours
                  / maxHours
                )
                * 100;


              return (

                <div
                  key={
                    item.date
                  }
                  className="flex-1 h-full flex flex-col justify-end"
                >

                  <div className="flex-1 flex flex-col justify-end">

                    <div className="text-center text-xs font-medium text-gray-700 mb-2">

                      {
                        hours.toFixed(
                          1
                        )
                      }h

                    </div>


                    <div className="w-full h-[200px] flex items-end justify-center">

                      <div
                        className="w-full max-w-14 bg-blue-500 hover:bg-blue-600 rounded-t-lg transition-all min-h-[4px]"
                        style={{
                          height:
                            hours > 0
                              ? `${Math.max(
                                  4,
                                  percentage
                                )}%`
                              : "4px"
                        }}
                        title={
                          `${item.date}: ${hours.toFixed(2)} hours`
                        }
                      />

                    </div>

                  </div>


                  <div className="text-center border-t pt-2 mt-2">

                    <div className="text-sm font-medium text-gray-700">
                      {item.day}
                    </div>

                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {
                        formatShortDate(
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

      </div>


      {/* WEEK DETAILS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* DAILY BREAKDOWN */}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          <div className="p-5 border-b">

            <h2 className="font-semibold text-gray-900">
              7-Day Breakdown
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Hours and work entries by day.
            </p>

          </div>


          <div className="divide-y">

            {chartData.map(
              (item) => (

                <div
                  key={
                    item.date
                  }
                  className="p-4 flex items-center justify-between"
                >

                  <div>

                    <div className="font-medium text-gray-900">

                      {item.day}

                    </div>

                    <div className="text-xs text-gray-500 mt-1">

                      {
                        formatDate(
                          item.date
                        )
                      }

                    </div>

                  </div>


                  <div className="text-right">

                    <div className="font-semibold text-gray-900">

                      {
                        Number(
                          item.hours
                          || 0
                        ).toFixed(2)
                      } hrs

                    </div>

                    <div className="text-xs text-gray-500 mt-1">

                      {
                        item.entries
                        || 0
                      } entries

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </div>


        {/* STATUS SUMMARY */}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">

          <h2 className="font-semibold text-gray-900">
            Task Status Summary
          </h2>

          <p className="text-sm text-gray-500 mt-1 mb-5">
            Current distribution of your tasks.
          </p>


          <StatusRow
            label="Completed"
            value={
              data?.tasks?.completed
              || 0
            }
            total={
              data?.tasks?.total
              || 0
            }
          />


          <StatusRow
            label="In Progress"
            value={
              data?.tasks?.in_progress
              || 0
            }
            total={
              data?.tasks?.total
              || 0
            }
          />


          <StatusRow
            label="Pending"
            value={
              data?.tasks?.pending
              || 0
            }
            total={
              data?.tasks?.total
              || 0
            }
          />


          <StatusRow
            label="Delivered"
            value={
              data?.tasks?.delivered
              || 0
            }
            total={
              data?.tasks?.total
              || 0
            }
          />

        </div>

      </div>


      {/* RECENT WORK */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b">

          <h2 className="font-semibold text-gray-900">
            Recent Work
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Your latest 10 daily work entries.
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
                !data?.recent_work
                ||
                data.recent_work
                  .length === 0
              ? (

                <tr>

                  <td
                    colSpan="7"
                    className="p-8 text-center text-gray-400"
                  >
                    No daily work entries available yet.
                  </td>

                </tr>

              )
              : (

                data.recent_work.map(
                  (record) => (

                    <tr
                      key={
                        record.id
                      }
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="p-3 whitespace-nowrap">

                        {
                          formatDate(
                            record.work_date
                          )
                        }

                      </td>


                      <td className="p-3 min-w-[200px]">

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
                              className="text-xs text-gray-500 mt-1 max-w-[260px] truncate"
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
                          record.work_type
                          || "-"
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


                      <td className="p-3 min-w-[130px]">

                        <div className="flex items-center gap-2">

                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">

                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width:
                                  `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      Number(
                                        record.progress_percentage
                                        || 0
                                      )
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

                    </tr>

                  )
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
  value,
  subtitle
}) {

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-2">
        {value}
      </h2>

      <p className="text-xs text-gray-400 mt-2">
        {subtitle}
      </p>

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
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">

      <p className="text-xs text-gray-500">
        {title}
      </p>

      <p className="text-2xl font-bold text-gray-900 mt-2">
        {value}
      </p>

    </div>
  );
}


// ============================================================
// STATUS ROW
// ============================================================

function StatusRow({
  label,
  value,
  total
}) {

  const percentage =
    total > 0
      ? (
          Number(value)
          /
          Number(total)
        )
        * 100
      : 0;


  return (
    <div className="mb-5">

      <div className="flex justify-between mb-2">

        <span className="text-sm text-gray-700">
          {label}
        </span>

        <span className="text-sm font-medium text-gray-900">
          {value}
        </span>

      </div>


      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">

        <div
          className="h-full bg-blue-500 rounded-full"
          style={{
            width:
              `${Math.min(
                100,
                Math.max(
                  0,
                  percentage
                )
              )}%`
          }}
        />

      </div>

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
// DATE
// ============================================================

function formatDate(
  dateValue
) {

  if (!dateValue) {
    return "-";
  }


  const parts =
    dateValue.split("-");


  if (
    parts.length !== 3
  ) {

    return dateValue;
  }


  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


// ============================================================
// SHORT DATE
// ============================================================

function formatShortDate(
  dateValue
) {

  if (!dateValue) {
    return "";
  }


  const parts =
    dateValue.split("-");


  if (
    parts.length !== 3
  ) {

    return dateValue;
  }


  return `${parts[2]}/${parts[1]}`;
}