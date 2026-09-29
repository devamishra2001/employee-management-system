import {
  useEffect,
  useState
} from "react";

import {
  getEmployeeDashboard
} from "../../services/api";


export default function EmployeeDashboard() {

  const [
    dashboard,
    setDashboard
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");


  useEffect(() => {

    loadDashboard();

  }, []);


  const loadDashboard =
    async () => {

      try {

        setLoading(true);
        setError("");

        const data =
          await getEmployeeDashboard();

        setDashboard(data);

      } catch (err) {

        console.error(
          "Employee dashboard error:",
          err
        );

        setError(
          "Unable to load employee dashboard."
        );

      } finally {

        setLoading(false);

      }
    };


  if (loading) {

    return (
      <div className="p-6">
        Loading dashboard...
      </div>
    );
  }


  if (error) {

    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }


  return (
    <div>

      {/* HEADER */}

      <div className="mb-7">

        <h1 className="text-2xl font-bold text-gray-900">
          Welcome,{" "}
          {
            dashboard?.employee_name
            || "Employee"
          }
        </h1>

        <p className="text-gray-500 mt-1">
          Employee Code:{" "}
          {
            dashboard?.employee_code
            || "-"
          }
        </p>

      </div>


      {/* STATISTICS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">

        <StatBox
          title="Total Tasks"
          value={
            dashboard?.total_tasks
          }
        />

        <StatBox
          title="Received"
          value={
            dashboard?.received
          }
        />

        <StatBox
          title="Pending"
          value={
            dashboard?.pending
          }
        />

        <StatBox
          title="In Progress"
          value={
            dashboard?.in_progress
          }
        />

        <StatBox
          title="Delivered"
          value={
            dashboard?.delivered
          }
        />

      </div>


      {/* WORKSPACE INFORMATION */}

      <div className="mt-7 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-gray-900">
          My Workspace
        </h2>

        <p className="text-gray-500 mt-2">
          Use My Tasks to view and update your assigned work.
          Use Daily Work to submit your daily work records.
        </p>

      </div>


      {/* TASK STATUS SUMMARY */}

      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-gray-900">
          Task Status Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">

          <SummaryItem
            label="Received"
            value={
              dashboard?.received
            }
          />

          <SummaryItem
            label="Pending"
            value={
              dashboard?.pending
            }
          />

          <SummaryItem
            label="In Progress"
            value={
              dashboard?.in_progress
            }
          />

          <SummaryItem
            label="Delivered"
            value={
              dashboard?.delivered
            }
          />

          <SummaryItem
            label="Completed"
            value={
              dashboard?.completed
            }
          />

        </div>

      </div>

    </div>
  );
}


function StatBox({
  title,
  value
}) {

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className="text-3xl font-bold text-gray-900 mt-2">
        {value ?? 0}
      </h2>

    </div>
  );
}


function SummaryItem({
  label,
  value
}) {

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="text-xl font-semibold text-gray-900 mt-1">
        {value ?? 0}
      </p>

    </div>
  );
}