import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  createMyWorkRecord,
  deleteMyWorkRecord,
  getMyTasks,
  getMyWorkRecords,
  updateMyWorkRecord
} from "../../services/api";


const emptyForm = {
  task_id: "",
  project_id: "",
  work_date: "",
  work_type: "",
  title: "",
  description: "",
  hours_spent: "",
  status: "in_progress",
  progress_percentage: 0,
  remarks: ""
};


export default function DailyWork() {

  const [
    records,
    setRecords
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
    success,
    setSuccess
  ] = useState("");

  const [
    showForm,
    setShowForm
  ] = useState(false);

  const [
    editingRecord,
    setEditingRecord
  ] = useState(null);

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    formData,
    setFormData
  ] = useState(
    emptyForm
  );

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
          workRecordData,
          taskData
        ] = await Promise.all([
          getMyWorkRecords(),
          getMyTasks()
        ]);


        setRecords(
          workRecordData
        );

        setTasks(
          taskData
        );


      } catch (err) {

        console.error(
          "Daily Work load error:",
          err
        );

        setError(
          "Unable to load daily work records."
        );


      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // LOAD FILTERED RECORDS
  // ==========================================================

  const loadRecords =
    async () => {

      try {

        setLoading(true);
        setError("");


        const data =
          await getMyWorkRecords({

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
          "Work record filter error:",
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
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters =
    async () => {

      setDateFilter("");
      setTaskFilter("");
      setStatusFilter("");

      try {

        const data =
          await getMyWorkRecords();

        setRecords(
          data
        );

      } catch (err) {

        console.error(err);

      }
    };


  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange =
    (event) => {

      const {
        name,
        value
      } = event.target;


      setFormData(
        (current) => ({
          ...current,

          [name]:
            value
        })
      );
    };


  // ==========================================================
  // TASK SELECTION
  // ==========================================================

  const handleTaskChange =
    (event) => {

      const value =
        event.target.value;


      if (!value) {

        setFormData(
          (current) => ({
            ...current,

            task_id: "",
            project_id: "",
            work_type: ""
          })
        );

        return;
      }


      const selectedTask =
        tasks.find(
          (task) =>
            task.id
            === Number(value)
        );


      setFormData(
        (current) => ({
          ...current,

          task_id:
            value,

          project_id:
            selectedTask
              ?.project_id
            ?? "",

          work_type:
            selectedTask
              ?.work_type
            ?? current.work_type,

          progress_percentage:
            selectedTask
              ?.progress_percentage
            ?? current.progress_percentage
        })
      );
    };


  // ==========================================================
  // OPEN ADD FORM
  // ==========================================================

  const openAddForm = () => {

    const today =
      new Date()
        .toISOString()
        .split("T")[0];


    setEditingRecord(
      null
    );


    setFormData({
      ...emptyForm,
      work_date:
        today
    });


    setError("");
    setSuccess("");

    setShowForm(
      true
    );
  };


  // ==========================================================
  // OPEN EDIT FORM
  // ==========================================================

  const openEditForm =
    (record) => {

      setEditingRecord(
        record
      );


      setFormData({

        task_id:
          record.task_id
          ?? "",

        project_id:
          record.project_id
          ?? "",

        work_date:
          record.work_date
          ?? "",

        work_type:
          record.work_type
          ?? "",

        title:
          record.title
          ?? "",

        description:
          record.description
          ?? "",

        hours_spent:
          record.hours_spent
          ?? "",

        status:
          record.status
          ?? "in_progress",

        progress_percentage:
          record.progress_percentage
          ?? 0,

        remarks:
          record.remarks
          ?? ""

      });


      setError("");
      setSuccess("");

      setShowForm(
        true
      );
    };


  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  const closeForm = () => {

    setShowForm(
      false
    );

    setEditingRecord(
      null
    );

    setFormData(
      emptyForm
    );
  };


  // ==========================================================
  // SAVE RECORD
  // ==========================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      try {

        setSaving(
          true
        );

        setError("");
        setSuccess("");


        const payload = {

          task_id:
            formData.task_id
              ? Number(
                  formData.task_id
                )
              : null,

          project_id:
            formData.project_id
              ? Number(
                  formData.project_id
                )
              : null,

          work_date:
            formData.work_date,

          work_type:
            formData.work_type
              ?.trim()
              || null,

          title:
            formData.title
              .trim(),

          description:
            formData.description
              .trim()
              || null,

          hours_spent:
            formData.hours_spent
              ? Number(
                  formData.hours_spent
                )
              : null,

          status:
            formData.status,

          progress_percentage:
            Number(
              formData.progress_percentage
            ),

          remarks:
            formData.remarks
              .trim()
              || null
        };


        if (
          !payload.work_date
        ) {

          setError(
            "Work date is required."
          );

          return;
        }


        if (
          !payload.title
        ) {

          setError(
            "Work title is required."
          );

          return;
        }


        if (
          payload.hours_spent
          !== null
          &&
          payload.hours_spent < 0
        ) {

          setError(
            "Hours spent cannot be negative."
          );

          return;
        }


        if (
          payload.progress_percentage
          < 0
          ||
          payload.progress_percentage
          > 100
        ) {

          setError(
            "Progress must be between 0 and 100."
          );

          return;
        }


        if (
          editingRecord
        ) {

          await updateMyWorkRecord(
            editingRecord.id,
            payload
          );


          setSuccess(
            "Daily work record updated successfully."
          );


        } else {

          await createMyWorkRecord(
            payload
          );


          setSuccess(
            "Daily work record added successfully."
          );
        }


        closeForm();

        await loadRecords();


      } catch (err) {

        console.error(
          "Work record save error:",
          err
        );


        const detail =
          err?.response
            ?.data
            ?.detail;


        setError(
          typeof detail
          === "string"
            ? detail
            : "Unable to save daily work record."
        );


      } finally {

        setSaving(
          false
        );

      }
    };


  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete =
    async (record) => {

      const confirmed =
        window.confirm(
          `Delete work entry "${record.title}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setError("");
        setSuccess("");


        await deleteMyWorkRecord(
          record.id
        );


        setRecords(
          (current) =>
            current.filter(
              (item) =>
                item.id
                !== record.id
            )
        );


        setSuccess(
          "Daily work record deleted successfully."
        );


      } catch (err) {

        console.error(
          "Delete work record error:",
          err
        );


        const detail =
          err?.response
            ?.data
            ?.detail;


        setError(
          typeof detail
          === "string"
            ? detail
            : "Unable to delete work record."
        );

      }
    };


  // ==========================================================
  // SUMMARY VALUES
  // ==========================================================

  const summary =
    useMemo(
      () => {

        const totalEntries =
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
          totalEntries,
          totalHours,
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
        Loading daily work...
      </div>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">
            Daily Work
          </h1>

          <p className="text-gray-500 mt-1">
            Add, edit and review your daily work records.
          </p>

        </div>


        <button
          onClick={
            openAddForm
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium"
        >
          + Add Work Entry
        </button>

      </div>


      {/* MESSAGES */}

      {error && (

        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-5">
          {error}
        </div>

      )}


      {success && (

        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-5">
          {success}
        </div>

      )}


      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <SummaryCard
          title="Entries"
          value={
            summary.totalEntries
          }
        />

        <SummaryCard
          title="Hours"
          value={
            summary.totalHours
              .toFixed(2)
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

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


          <div className="flex items-end">

            <button
              onClick={
                loadRecords
              }
              className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg"
            >
              Apply
            </button>

          </div>


          <div className="flex items-end">

            <button
              onClick={
                clearFilters
              }
              className="w-full border px-4 py-2.5 rounded-lg"
            >
              Clear
            </button>

          </div>

        </div>

      </div>


      {/* WORK RECORD TABLE */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b">

          <h2 className="font-semibold text-gray-900">
            Work History
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
                  Title
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
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {records.length === 0 && (

                <tr>

                  <td
                    colSpan="8"
                    className="p-8 text-center text-gray-400"
                  >
                    No daily work records found.
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

                    <td className="p-3 whitespace-nowrap">
                      {
                        formatDate(
                          record.work_date
                        )
                      }
                    </td>


                    <td className="p-3">

                      <div className="font-medium text-gray-900">
                        {record.title}
                      </div>

                      {record.description && (

                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {
                            record.description
                          }
                        </div>

                      )}

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
                        record.hours_spent
                        ?? "-"
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


                    <td className="p-3">

                      <div className="flex gap-2">

                        <button
                          onClick={
                            () =>
                              openEditForm(
                                record
                              )
                          }
                          className="border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                        >
                          Edit
                        </button>


                        <button
                          onClick={
                            () =>
                              handleDelete(
                                record
                              )
                          }
                          className="border border-red-300 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ADD / EDIT MODAL */}

      {showForm && (

        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">

            <div className="p-6 border-b flex justify-between items-start">

              <div>

                <h2 className="text-xl font-bold text-gray-900">

                  {
                    editingRecord
                      ? "Edit Work Entry"
                      : "Add Work Entry"
                  }

                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Record the work you performed.
                </p>

              </div>


              <button
                onClick={
                  closeForm
                }
                className="text-gray-500 text-2xl"
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
              className="p-6"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


                {/* DATE */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Work Date *
                  </label>

                  <input
                    type="date"
                    name="work_date"
                    value={
                      formData.work_date
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                {/* TASK */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Task
                  </label>

                  <select
                    name="task_id"
                    value={
                      formData.task_id
                    }
                    onChange={
                      handleTaskChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  >

                    <option value="">
                      No Task / General Work
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


                {/* PROJECT ID */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Project ID
                  </label>

                  <input
                    type="number"
                    min="1"
                    name="project_id"
                    value={
                      formData.project_id
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Optional"
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                {/* WORK TYPE */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Work Type
                  </label>

                  <input
                    name="work_type"
                    value={
                      formData.work_type
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Article, Code, Modification..."
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                {/* TITLE */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium mb-2">
                    Work Title *
                  </label>

                  <input
                    name="title"
                    value={
                      formData.title
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="What did you work on?"
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                {/* DESCRIPTION */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={
                      handleChange
                    }
                    rows="4"
                    placeholder="Describe the work completed today..."
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                {/* HOURS */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Hours Spent
                  </label>

                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    name="hours_spent"
                    value={
                      formData.hours_spent
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: 6.5"
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                {/* STATUS */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  >

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


                {/* PROGRESS */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Progress %
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="progress_percentage"
                    value={
                      formData.progress_percentage
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                {/* REMARKS */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium mb-2">
                    Remarks
                  </label>

                  <textarea
                    name="remarks"
                    value={
                      formData.remarks
                    }
                    onChange={
                      handleChange
                    }
                    rows="3"
                    placeholder="Optional remarks or pending work..."
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>

              </div>


              {/* BUTTONS */}

              <div className="flex justify-end gap-3 mt-8">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="border px-5 py-2.5 rounded-lg"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
                >

                  {
                    saving
                      ? "Saving..."
                      : editingRecord
                        ? "Update Entry"
                        : "Add Entry"
                  }

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

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