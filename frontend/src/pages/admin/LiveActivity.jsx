import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getAdminActivity,
  getEmployees
} from "../../services/api";

import useDashboardSocket
  from "../../hooks/useDashboardSocket";


export default function LiveActivity() {

  const [
    activities,
    setActivities
  ] = useState([]);

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
    employeeFilter,
    setEmployeeFilter
  ] = useState("");

  const [
    actionFilter,
    setActionFilter
  ] = useState("");

  const [
    entityFilter,
    setEntityFilter
  ] = useState("");

  const [
    limit,
    setLimit
  ] = useState(100);

  const [
    lastRealtimeEvent,
    setLastRealtimeEvent
  ] = useState(null);


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
          activityData,
          employeeData
        ] = await Promise.all([
          getAdminActivity({
            limit: 100
          }),
          getEmployees()
        ]);

        setActivities(
          activityData
        );

        setEmployees(
          employeeData
        );

      } catch (err) {

        console.error(
          "Live Activity load error:",
          err
        );

        setError(
          "Unable to load activity logs."
        );

      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // LOAD ACTIVITY WITH CURRENT FILTERS
  // ==========================================================

  const loadActivities =
    useCallback(
      async () => {

        try {

          setLoading(true);
          setError("");

          const data =
            await getAdminActivity({

              employee_id:
                employeeFilter
                || undefined,

              action:
                actionFilter
                || undefined,

              entity_type:
                entityFilter
                || undefined,

              limit:
                limit

            });

          setActivities(
            data
          );

        } catch (err) {

          console.error(
            "Activity filter error:",
            err
          );

          const detail =
            err?.response
              ?.data
              ?.detail;

          setError(
            typeof detail === "string"
              ? detail
              : "Unable to load activity logs."
          );

        } finally {

          setLoading(false);

        }

      },
      [
        employeeFilter,
        actionFilter,
        entityFilter,
        limit
      ]
    );


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters =
    async () => {

      setEmployeeFilter("");
      setActionFilter("");
      setEntityFilter("");
      setLimit(100);

      try {

        setLoading(true);

        const data =
          await getAdminActivity({
            limit: 100
          });

        setActivities(
          data
        );

        setError("");

      } catch (err) {

        console.error(err);

        setError(
          "Unable to reload activity logs."
        );

      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // REAL-TIME WEBSOCKET
  // ==========================================================

  const handleSocketMessage =
    useCallback(
      async (message) => {

        const supportedEvents = [
          "task_created",
          "task_updated",
          "task_deleted",
          "work_record_created",
          "work_record_updated",
          "work_record_deleted"
        ];


        if (
          !supportedEvents.includes(
            message.event
          )
        ) {

          return;
        }


        setLastRealtimeEvent({
          event:
            message.event,

          time:
            new Date()
        });


        try {

          const data =
            await getAdminActivity({

              employee_id:
                employeeFilter
                || undefined,

              action:
                actionFilter
                || undefined,

              entity_type:
                entityFilter
                || undefined,

              limit:
                limit

            });

          setActivities(
            data
          );

        } catch (err) {

          console.error(
            "Realtime activity refresh error:",
            err
          );

        }

      },
      [
        employeeFilter,
        actionFilter,
        entityFilter,
        limit
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

        const total =
          activities.length;


        const taskEvents =
          activities.filter(
            (activity) =>
              activity.entity_type
              === "task"
          ).length;


        const workRecordEvents =
          activities.filter(
            (activity) =>
              activity.entity_type
              === "work_record"
          ).length;


        const uniqueUsers =
          new Set(
            activities
              .filter(
                (activity) =>
                  activity.user_id
              )
              .map(
                (activity) =>
                  activity.user_id
              )
          ).size;


        return {
          total,
          taskEvents,
          workRecordEvents,
          uniqueUsers
        };

      },
      [
        activities
      ]
    );


  // ==========================================================
  // UNIQUE ACTION OPTIONS
  // ==========================================================

  const actionOptions =
    useMemo(
      () => {

        const defaults = [
          "task_created",
          "task_updated",
          "task_deleted",
          "work_record_created",
          "work_record_updated",
          "work_record_deleted"
        ];


        const fromLogs =
          activities
            .map(
              (activity) =>
                activity.action
            )
            .filter(
              Boolean
            );


        return [
          ...new Set([
            ...defaults,
            ...fromLogs
          ])
        ].sort();

      },
      [
        activities
      ]
    );


  // ==========================================================
  // ENTITY OPTIONS
  // ==========================================================

  const entityOptions =
    useMemo(
      () => {

        const defaults = [
          "task",
          "work_record",
          "employee",
          "project"
        ];


        const fromLogs =
          activities
            .map(
              (activity) =>
                activity.entity_type
            )
            .filter(
              Boolean
            );


        return [
          ...new Set([
            ...defaults,
            ...fromLogs
          ])
        ].sort();

      },
      [
        activities
      ]
    );


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">
            Live Activity
          </h1>

          <p className="text-gray-500 mt-1">
            Monitor employee task and daily-work activity in real time.
          </p>

        </div>


        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2 text-sm">

            <span className="relative flex h-3 w-3">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />

              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />

            </span>

            <span className="text-gray-600">
              Live monitoring
            </span>

          </div>


          <button
            onClick={
              loadActivities
            }
            className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded-lg text-sm"
          >
            Refresh
          </button>

        </div>

      </div>


      {/* LAST REALTIME EVENT */}

      {lastRealtimeEvent && (

        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-5 text-sm">

          Real-time event received:{" "}

          <strong>
            {
              formatAction(
                lastRealtimeEvent.event
              )
            }
          </strong>

          {" at "}

          {
            lastRealtimeEvent
              .time
              .toLocaleTimeString()
          }

        </div>

      )}


      {/* ERROR */}

      {error && (

        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-5">
          {error}
        </div>

      )}


      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <SummaryCard
          title="Activity Events"
          value={
            summary.total
          }
        />

        <SummaryCard
          title="Task Events"
          value={
            summary.taskEvents
          }
        />

        <SummaryCard
          title="Work Record Events"
          value={
            summary.workRecordEvents
          }
        />

        <SummaryCard
          title="Active Users"
          value={
            summary.uniqueUsers
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


          {/* ACTION */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Action
            </label>

            <select
              value={
                actionFilter
              }
              onChange={
                (event) =>
                  setActionFilter(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              <option value="">
                All Actions
              </option>

              {actionOptions.map(
                (action) => (

                  <option
                    key={
                      action
                    }
                    value={
                      action
                    }
                  >
                    {
                      formatAction(
                        action
                      )
                    }
                  </option>

                )
              )}

            </select>

          </div>


          {/* ENTITY */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Entity
            </label>

            <select
              value={
                entityFilter
              }
              onChange={
                (event) =>
                  setEntityFilter(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              <option value="">
                All Entities
              </option>

              {entityOptions.map(
                (entity) => (

                  <option
                    key={
                      entity
                    }
                    value={
                      entity
                    }
                  >
                    {
                      formatLabel(
                        entity
                      )
                    }
                  </option>

                )
              )}

            </select>

          </div>


          {/* LIMIT */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Records
            </label>

            <select
              value={
                limit
              }
              onChange={
                (event) =>
                  setLimit(
                    Number(
                      event.target.value
                    )
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              <option value={25}>
                Latest 25
              </option>

              <option value={50}>
                Latest 50
              </option>

              <option value={100}>
                Latest 100
              </option>

              <option value={250}>
                Latest 250
              </option>

              <option value={500}>
                Latest 500
              </option>

            </select>

          </div>


          {/* APPLY */}

          <div className="flex items-end">

            <button
              onClick={
                loadActivities
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


      {/* ACTIVITY FEED */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b flex items-center justify-between">

          <div>

            <h2 className="font-semibold text-gray-900">
              Activity Feed
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Latest activity first
            </p>

          </div>


          {loading && (

            <span className="text-sm text-gray-400">
              Refreshing...
            </span>

          )}

        </div>


        {/* EMPTY */}

        {!loading
          &&
          activities.length === 0
          &&
          (

            <div className="p-10 text-center text-gray-400">

              No activity logs found.

            </div>

          )
        }


        {/* EVENTS */}

        <div className="divide-y divide-gray-100">

          {activities.map(
            (activity) => (

              <ActivityItem
                key={
                  activity.id
                }
                activity={
                  activity
                }
              />

            )
          )}

        </div>

      </div>

    </div>
  );
}


// ============================================================
// ACTIVITY ITEM
// ============================================================

function ActivityItem({
  activity
}) {

  return (
    <div className="p-5 hover:bg-gray-50">

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

        <div className="flex gap-4 min-w-0">

          {/* ICON */}

          <div
            className={
              `w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-semibold ${getActivityStyle(
                activity.action
              )}`
            }
          >

            {
              getActivityIcon(
                activity.action
              )
            }

          </div>


          {/* CONTENT */}

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <span className="font-semibold text-gray-900">

                {
                  activity.employee_name
                  ||
                  activity.username
                  ||
                  "System"
                }

              </span>


              {activity.employee_code && (

                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">

                  {
                    activity.employee_code
                  }

                </span>

              )}


              {activity.role && (

                <span className="text-xs text-gray-400 capitalize">

                  {
                    activity.role
                  }

                </span>

              )}

            </div>


            <div className="mt-2">

              <span
                className={
                  `inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getActionBadgeStyle(
                    activity.action
                  )}`
                }
              >

                {
                  formatAction(
                    activity.action
                  )
                }

              </span>

            </div>


            <p className="text-sm text-gray-600 mt-3 break-words">

              {
                activity.details
                ||
                buildFallbackDetails(
                  activity
                )
              }

            </p>


            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-xs text-gray-400">

              <span>

                Entity:{" "}

                <strong className="font-medium text-gray-500">

                  {
                    formatLabel(
                      activity.entity_type
                    )
                  }

                </strong>

              </span>


              {activity.entity_id !== null
                &&
                activity.entity_id !== undefined
                &&
                (

                  <span>

                    ID:{" "}

                    <strong className="font-medium text-gray-500">

                      {
                        activity.entity_id
                      }

                    </strong>

                  </span>

                )
              }


              {activity.ip_address && (

                <span>

                  IP:{" "}

                  <strong className="font-medium text-gray-500">

                    {
                      activity.ip_address
                    }

                  </strong>

                </span>

              )}

            </div>

          </div>

        </div>


        {/* TIME */}

        <div className="shrink-0 lg:text-right">

          <div className="text-sm text-gray-700">

            {
              formatDateTime(
                activity.created_at
              )
            }

          </div>


          <div className="text-xs text-gray-400 mt-1">

            {
              relativeTime(
                activity.created_at
              )
            }

          </div>

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
// ACTIVITY ICON
// ============================================================

function getActivityIcon(
  action
) {

  if (
    action?.includes(
      "created"
    )
  ) {

    return "+";
  }


  if (
    action?.includes(
      "updated"
    )
  ) {

    return "↻";
  }


  if (
    action?.includes(
      "deleted"
    )
  ) {

    return "×";
  }


  return "•";
}


// ============================================================
// ACTIVITY ICON STYLE
// ============================================================

function getActivityStyle(
  action
) {

  if (
    action?.includes(
      "created"
    )
  ) {

    return "bg-green-100 text-green-700";
  }


  if (
    action?.includes(
      "updated"
    )
  ) {

    return "bg-blue-100 text-blue-700";
  }


  if (
    action?.includes(
      "deleted"
    )
  ) {

    return "bg-red-100 text-red-700";
  }


  return "bg-gray-100 text-gray-700";
}


// ============================================================
// BADGE STYLE
// ============================================================

function getActionBadgeStyle(
  action
) {

  if (
    action?.includes(
      "created"
    )
  ) {

    return "bg-green-50 text-green-700 border border-green-200";
  }


  if (
    action?.includes(
      "updated"
    )
  ) {

    return "bg-blue-50 text-blue-700 border border-blue-200";
  }


  if (
    action?.includes(
      "deleted"
    )
  ) {

    return "bg-red-50 text-red-700 border border-red-200";
  }


  return "bg-gray-50 text-gray-700 border border-gray-200";
}


// ============================================================
// FALLBACK DETAILS
// ============================================================

function buildFallbackDetails(
  activity
) {

  const action =
    formatAction(
      activity.action
    );


  const entity =
    formatLabel(
      activity.entity_type
    );


  if (
    activity.entity_id !== null
    &&
    activity.entity_id !== undefined
  ) {

    return `${action} ${entity} #${activity.entity_id}`;
  }


  return `${action} ${entity}`;
}


// ============================================================
// ACTION FORMAT
// ============================================================

function formatAction(
  value
) {

  if (!value) {
    return "Activity";
  }


  return value
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
// LABEL FORMAT
// ============================================================

function formatLabel(
  value
) {

  if (!value) {
    return "-";
  }


  return value
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
// DATE / TIME
// ============================================================

function formatDateTime(
  value
) {

  if (!value) {
    return "-";
  }


  const date =
    new Date(
      normalizeBackendDate(
        value
      )
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
// RELATIVE TIME
// ============================================================

function relativeTime(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(
      normalizeBackendDate(
        value
      )
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";
  }


  const difference =
    Date.now()
    -
    date.getTime();


  const seconds =
    Math.floor(
      difference
      / 1000
    );


  if (
    seconds < 0
  ) {

    return "just now";
  }


  if (
    seconds < 60
  ) {

    return "just now";
  }


  const minutes =
    Math.floor(
      seconds
      / 60
    );


  if (
    minutes < 60
  ) {

    return `${minutes} min ago`;
  }


  const hours =
    Math.floor(
      minutes
      / 60
    );


  if (
    hours < 24
  ) {

    return `${hours} hr ago`;
  }


  const days =
    Math.floor(
      hours
      / 24
    );


  if (
    days === 1
  ) {

    return "1 day ago";
  }


  return `${days} days ago`;
}


// ============================================================
// MYSQL / FASTAPI DATETIME NORMALIZATION
// ============================================================

function normalizeBackendDate(
  value
) {

  if (
    typeof value
    !== "string"
  ) {

    return value;
  }


  /*
    If backend sends:
    2026-09-29T15:30:00

    this function leaves it usable by JavaScript.

    If backend later sends timezone information,
    JavaScript will also handle it correctly.
  */

  return value;
}