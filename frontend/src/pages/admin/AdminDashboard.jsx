import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getEmployees,
  getTasks
} from "../../services/api";

import useDashboardSocket
  from "../../hooks/useDashboardSocket";

import StatCard
  from "../../components/StatCard";

import TaskTable
  from "../../components/TaskTable";

import EmployeeTable
  from "../../components/EmployeeTable";

import ActivityFeed
  from "../../components/ActivityFeed";

import TaskStatusChart
  from "../../components/TaskStatusChart";


export default function AdminDashboard() {

  const [
    employees,
    setEmployees
  ] = useState([]);

  const [
    tasks,
    setTasks
  ] = useState([]);

  const [
    activities,
    setActivities
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");


  // ============================================================
  // INITIAL DASHBOARD DATA
  // ============================================================

  useEffect(() => {

    const loadDashboardData =
      async () => {

        try {

          setLoading(true);
          setError("");

          const [
            employeeData,
            taskData
          ] = await Promise.all([
            getEmployees(),
            getTasks()
          ]);

          setEmployees(
            employeeData
          );

          setTasks(
            taskData
          );

        } catch (err) {

          console.error(
            "Dashboard loading error:",
            err
          );

          setError(
            "Unable to load dashboard data."
          );

        } finally {

          setLoading(false);

        }
      };


    loadDashboardData();

  }, []);


  // ============================================================
  // REAL-TIME WEBSOCKET EVENTS
  // ============================================================

  const handleSocketMessage =
    useCallback(
      (message) => {

        console.log(
          "Live dashboard message:",
          message
        );


        // ------------------------------------------------------
        // TASK CREATED
        // ------------------------------------------------------

        if (
          message.event
          === "task_created"
        ) {

          if (
            message.task
          ) {

            setTasks(
              (currentTasks) => [

                message.task,

                ...currentTasks.filter(
                  (task) =>
                    task.id
                    !== message.task.id
                )

              ]
            );

          }


          setActivities(
            (current) => [

              {
                ...message,

                status:
                  message.task
                    ?.status
                  || "created",

                progress_percentage:
                  message.task
                    ?.progress_percentage
                  ?? 0,

                received_at:
                  new Date()
                    .toLocaleTimeString()
              },

              ...current

            ].slice(
              0,
              10
            )
          );


          return;
        }


        // ------------------------------------------------------
        // TASK UPDATED
        // ------------------------------------------------------

        if (
          message.event
          === "task_updated"
        ) {

          setTasks(
            (currentTasks) =>
              currentTasks.map(
                (task) => {

                  if (
                    task.id
                    !== message.task_id
                  ) {

                    return task;

                  }


                  if (
                    message.task
                  ) {

                    return {
                      ...task,
                      ...message.task
                    };

                  }


                  return {
                    ...task,

                    project_id:
                      message.project_id
                      ?? task.project_id,

                    assigned_to:
                      message.employee_id
                      ?? task.assigned_to,

                    title:
                      message.title
                      ?? task.title,

                    work_type:
                      message.work_type
                      ?? task.work_type,

                    priority:
                      message.priority
                      ?? task.priority,

                    status:
                      message.status
                      ?? task.status,

                    progress_percentage:
                      message.progress_percentage
                      ?? task.progress_percentage
                  };

                }
              )
          );


          setActivities(
            (current) => [

              {
                ...message,

                received_at:
                  new Date()
                    .toLocaleTimeString()
              },

              ...current

            ].slice(
              0,
              10
            )
          );


          return;
        }


        // ------------------------------------------------------
        // TASK DELETED
        // ------------------------------------------------------

        if (
          message.event
          === "task_deleted"
        ) {

          setTasks(
            (currentTasks) =>
              currentTasks.filter(
                (task) =>
                  task.id
                  !== message.task_id
              )
          );


          setActivities(
            (current) => [

              {
                ...message,

                status:
                  "deleted",

                progress_percentage:
                  0,

                received_at:
                  new Date()
                    .toLocaleTimeString()
              },

              ...current

            ].slice(
              0,
              10
            )
          );


          return;
        }

      },
      []
    );


  useDashboardSocket(
    handleSocketMessage
  );


  // ============================================================
  // DASHBOARD STATISTICS
  // ============================================================

  const stats =
    useMemo(
      () => {

        const totalEmployees =
          employees.length;

        const totalTasks =
          tasks.length;

        const received =
          tasks.filter(
            (task) =>
              task.status
              === "received"
          ).length;

        const pending =
          tasks.filter(
            (task) =>
              task.status
              === "pending"
          ).length;

        const inProgress =
          tasks.filter(
            (task) =>
              task.status
              === "in_progress"
          ).length;

        const delivered =
          tasks.filter(
            (task) =>
              task.status
              === "delivered"
          ).length;

        const completed =
          tasks.filter(
            (task) =>
              task.status
              === "completed"
          ).length;


        return {
          totalEmployees,
          totalTasks,
          received,
          pending,
          inProgress,
          delivered,
          completed
        };

      },
      [
        employees,
        tasks
      ]
    );


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (
      <div className="min-h-[300px] flex items-center justify-center">

        <div className="text-center">

          <div className="text-lg font-semibold text-gray-700">
            Loading dashboard...
          </div>

          <p className="text-sm text-gray-400 mt-2">
            Retrieving employee and task data
          </p>

        </div>

      </div>
    );
  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">

        <h2 className="font-semibold">
          Dashboard Error
        </h2>

        <p className="text-sm mt-1">
          {error}
        </p>

      </div>
    );
  }


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div>

      {/* HEADER */}

      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-900">
          Admin Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Real-time overview of employees,
          tasks and work activity.
        </p>

      </div>


      {/* STAT CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">

        <StatCard
          title="Employees"
          value={
            stats.totalEmployees
          }
        />

        <StatCard
          title="Total Tasks"
          value={
            stats.totalTasks
          }
        />

        <StatCard
          title="In Progress"
          value={
            stats.inProgress
          }
        />

        <StatCard
          title="Delivered"
          value={
            stats.delivered
          }
        />

        <StatCard
          title="Pending"
          value={
            stats.pending
          }
        />

      </div>


      {/* CHART + LIVE ACTIVITY */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">

        <div className="xl:col-span-2">

          <TaskStatusChart
            tasks={
              tasks
            }
          />

        </div>


        <div>

          <ActivityFeed
            activities={
              activities
            }
          />

        </div>

      </div>


      {/* TASK TABLE */}

      <div className="mt-6">

        <TaskTable
          tasks={
            tasks
          }
        />

      </div>


      {/* EMPLOYEE TABLE */}

      <div className="mt-6">

        <EmployeeTable
          employees={
            employees
          }
        />

      </div>

    </div>
  );
}