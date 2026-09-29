import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getEmployees,
  getTasks
} from "../services/api";

import useDashboardSocket
  from "../hooks/useDashboardSocket";

import StatCard
  from "../components/StatCard";

import TaskTable
  from "../components/TaskTable";

import EmployeeTable
  from "../components/EmployeeTable";

import ActivityFeed
  from "../components/ActivityFeed";

import TaskStatusChart
  from "../components/TaskStatusChart";


export default function Dashboard() {

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


  useEffect(() => {

    const loadData = async () => {

      try {

        const [
          employeesData,
          tasksData
        ] = await Promise.all([
          getEmployees(),
          getTasks()
        ]);

        setEmployees(
          employeesData
        );

        setTasks(
          tasksData
        );

      } catch (error) {

        console.error(
          "Dashboard loading error:",
          error
        );

      } finally {

        setLoading(false);

      }
    };

    loadData();

  }, []);


  const handleSocketMessage =
    useCallback(
      (message) => {

        if (
          message.event
          === "task_updated"
        ) {

          setTasks(
            (currentTasks) =>
              currentTasks.map(
                (task) =>
                  task.id
                  === message.task_id
                    ? {
                        ...task,
                        status:
                          message.status,

                        progress_percentage:
                          message
                            .progress_percentage,

                        priority:
                          message.priority
                          ?? task.priority,

                        title:
                          message.title
                          ?? task.title,

                        work_type:
                          message.work_type
                          ?? task.work_type
                      }
                    : task
              )
          );

          setActivities(
            (current) => [
              message,
              ...current
            ].slice(0, 10)
          );
        }
      },
      []
    );


  useDashboardSocket(
    handleSocketMessage
  );


  const stats = useMemo(
    () => ({
      employees:
        employees.length,

      tasks:
        tasks.length,

      inProgress:
        tasks.filter(
          (task) =>
            task.status === "in_progress"
        ).length,

      delivered:
        tasks.filter(
          (task) =>
            task.status === "delivered"
        ).length,

      pending:
        tasks.filter(
          (task) =>
            task.status === "pending"
        ).length
    }),
    [employees, tasks]
  );


  if (loading) {
    return (
      <div className="p-10">
        Loading dashboard...
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100">

      <header className="bg-white border-b">

        <div className="max-w-7xl mx-auto px-6 py-5">

          <h1 className="text-2xl font-bold">
            Employee Management Dashboard
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Real-time employee and task monitoring
          </p>

        </div>

      </header>


      <main className="max-w-7xl mx-auto p-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

          <StatCard
            title="Employees"
            value={stats.employees}
          />

          <StatCard
            title="Total Tasks"
            value={stats.tasks}
          />

          <StatCard
            title="In Progress"
            value={stats.inProgress}
          />

          <StatCard
            title="Delivered"
            value={stats.delivered}
          />

          <StatCard
            title="Pending"
            value={stats.pending}
          />

        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          <div className="lg:col-span-2">

            <TaskStatusChart
              tasks={tasks}
            />

          </div>

          <ActivityFeed
            activities={activities}
          />

        </div>


        <div className="mt-6">

          <TaskTable
            tasks={tasks}
          />

        </div>


        <div className="mt-6">

          <EmployeeTable
            employees={employees}
          />

        </div>

      </main>

    </div>
  );
}