import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  createMyTask,
  deleteMyTask,
  getMyTasks,
  updateMyTask
} from "../../services/api";

import {
  useAuth
} from "../../auth/AuthContext";


const emptyForm = {
  project_id: "",
  title: "",
  description: "",
  work_type: "other",
  priority: "medium",
  status: "received",
  progress_percentage: 0,
  deadline: "",
  estimated_hours: ""
};


export default function MyTasks() {

  const {
    user
  } = useAuth();


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
    search,
    setSearch
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter
  ] = useState("");


  const [
    showForm,
    setShowForm
  ] = useState(false);


  const [
    editingTask,
    setEditingTask
  ] = useState(null);


  const [
    formData,
    setFormData
  ] = useState(
    emptyForm
  );


  const [
    saving,
    setSaving
  ] = useState(false);


  const [
    savingTask,
    setSavingTask
  ] = useState(null);


  useEffect(() => {

    loadTasks();

  }, []);


  // ==========================================================
  // LOAD TASKS
  // ==========================================================

  const loadTasks =
    async () => {

      try {

        setLoading(true);
        setError("");


        const data =
          await getMyTasks();


        setTasks(
          data
        );


      } catch (err) {

        console.error(
          err
        );


        setError(
          "Unable to load your tasks."
        );


      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // FILTERED TASKS
  // ==========================================================

  const filteredTasks =
    useMemo(
      () => {

        return tasks.filter(
          (task) => {

            const query =
              search
                .trim()
                .toLowerCase();


            const matchesSearch =
              !query
              ||
              task.title
                ?.toLowerCase()
                .includes(
                  query
                )
              ||
              task.description
                ?.toLowerCase()
                .includes(
                  query
                );


            const matchesStatus =
              !statusFilter
              ||
              task.status
              === statusFilter;


            return (
              matchesSearch
              &&
              matchesStatus
            );

          }
        );

      },
      [
        tasks,
        search,
        statusFilter
      ]
    );


  // ==========================================================
  // OPEN ADD FORM
  // ==========================================================

  const openAddForm = () => {

    setEditingTask(
      null
    );

    setFormData({
      ...emptyForm
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
    (task) => {

      setEditingTask(
        task
      );


      setFormData({

        project_id:
          task.project_id
          ?? "",

        title:
          task.title
          ?? "",

        description:
          task.description
          ?? "",

        work_type:
          task.work_type
          ?? "other",

        priority:
          task.priority
          ?? "medium",

        status:
          task.status
          ?? "received",

        progress_percentage:
          task.progress_percentage
          ?? 0,

        deadline:
          task.deadline
            ? task.deadline
                .slice(
                  0,
                  16
                )
            : "",

        estimated_hours:
          task.estimated_hours
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

    setEditingTask(
      null
    );

    setFormData({
      ...emptyForm
    });
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
  // CREATE / EDIT TASK
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

          project_id:
            formData.project_id
              ? Number(
                  formData.project_id
                )
              : null,

          title:
            formData.title
              .trim(),

          description:
            formData.description
              .trim()
              || null,

          work_type:
            formData.work_type,

          priority:
            formData.priority,

          status:
            formData.status,

          progress_percentage:
            Number(
              formData.progress_percentage
            ),

          deadline:
            formData.deadline
              || null,

          estimated_hours:
            formData.estimated_hours
              ? Number(
                  formData.estimated_hours
                )
              : null
        };


        if (
          !payload.title
        ) {

          setError(
            "Task title is required."
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
          editingTask
        ) {

          await updateMyTask(
            editingTask.id,
            payload
          );


          setSuccess(
            "Task updated successfully."
          );


        } else {

          await createMyTask(
            payload
          );


          setSuccess(
            "Task created successfully."
          );
        }


        closeForm();

        await loadTasks();


      } catch (err) {

        console.error(
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
            : "Unable to save task."
        );


      } finally {

        setSaving(
          false
        );

      }
    };


  // ==========================================================
  // QUICK STATUS / PROGRESS CHANGE
  // ==========================================================

  const changeTask =
    (
      taskId,
      field,
      value
    ) => {

      setTasks(
        (current) =>
          current.map(
            (task) =>
              task.id
              === taskId
                ? {
                    ...task,
                    [field]:
                      value
                  }
                : task
          )
      );
    };


  // ==========================================================
  // QUICK SAVE
  // ==========================================================

  const saveProgress =
    async (task) => {

      try {

        setSavingTask(
          task.id
        );

        setError("");
        setSuccess("");


        const progress =
          Number(
            task.progress_percentage
          );


        if (
          progress < 0
          ||
          progress > 100
        ) {

          setError(
            "Progress must be between 0 and 100."
          );

          return;
        }


        await updateMyTask(
          task.id,
          {
            status:
              task.status,

            progress_percentage:
              progress
          }
        );


        setSuccess(
          `Task #${task.id} updated successfully.`
        );


        await loadTasks();


      } catch (err) {

        console.error(
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
            : "Unable to update task."
        );


      } finally {

        setSavingTask(
          null
        );

      }
    };


  // ==========================================================
  // DELETE TASK
  // ==========================================================

  const handleDelete =
    async (task) => {

      const confirmed =
        window.confirm(
          `Delete "${task.title}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setError("");
        setSuccess("");


        await deleteMyTask(
          task.id
        );


        setTasks(
          (current) =>
            current.filter(
              (item) =>
                item.id
                !== task.id
            )
        );


        setSuccess(
          "Task deleted successfully."
        );


      } catch (err) {

        console.error(
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
            : "Unable to delete task."
        );

      }
    };


  if (
    loading
    &&
    tasks.length === 0
  ) {

    return (
      <div className="p-6">
        Loading your tasks...
      </div>
    );
  }


  return (
    <div>

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">
            My Tasks
          </h1>

          <p className="text-gray-500 mt-1">
            Create and manage your own work.
          </p>

        </div>


        <button
          onClick={
            openAddForm
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium"
        >
          + Add Task
        </button>

      </div>


      {/* ==================================================== */}
      {/* MESSAGES */}
      {/* ==================================================== */}

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


      {/* ==================================================== */}
      {/* FILTERS */}
      {/* ==================================================== */}

      <div className="bg-white border rounded-xl p-4 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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
            placeholder="Search tasks..."
            className="border rounded-lg px-4 py-2.5 md:col-span-2"
          />


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
            className="border rounded-lg px-4 py-2.5"
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

      </div>


      {/* ==================================================== */}
      {/* TASKS */}
      {/* ==================================================== */}

      <div className="space-y-5">

        {filteredTasks.length === 0 && (

          <div className="bg-white border rounded-xl p-8 text-center text-gray-500">

            No tasks found.

          </div>

        )}


        {filteredTasks.map(
          (task) => {

            const selfCreated =
              task.created_by
              === user?.user_id;


            return (

              <div
                key={
                  task.id
                }
                className="bg-white border rounded-xl shadow-sm p-6"
              >

                <div className="flex flex-col lg:flex-row lg:justify-between gap-4">

                  <div>

                    <p className="text-xs text-gray-400">
                      TASK #{task.id}
                    </p>


                    <h2 className="text-lg font-semibold mt-1">
                      {task.title}
                    </h2>


                    <p className="text-sm text-gray-500 mt-2">
                      {
                        task.description
                        ||
                        "No description."
                      }
                    </p>

                  </div>


                  <div className="flex gap-2 flex-wrap">

                    <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                      {
                        task.work_type
                      }
                    </span>


                    <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full">
                      {
                        task.priority
                      }
                    </span>


                    {selfCreated && (

                      <span className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full">
                        My Task
                      </span>

                    )}

                  </div>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

                  <InfoBox
                    label="Deadline"
                    value={
                      task.deadline
                        ? new Date(
                            task.deadline
                          )
                          .toLocaleDateString()
                        : "-"
                    }
                  />


                  <InfoBox
                    label="Estimated Hours"
                    value={
                      task.estimated_hours
                      ?? "-"
                    }
                  />


                  <InfoBox
                    label="Project ID"
                    value={
                      task.project_id
                      ?? "-"
                    }
                  />

                </div>


                {/* QUICK UPDATE */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

                  <select
                    value={
                      task.status
                    }
                    onChange={
                      (event) =>
                        changeTask(
                          task.id,
                          "status",
                          event.target.value
                        )
                    }
                    className="border rounded-lg px-3 py-2.5"
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


                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      task.progress_percentage
                    }
                    onChange={
                      (event) =>
                        changeTask(
                          task.id,
                          "progress_percentage",
                          event.target.value
                        )
                    }
                    className="border rounded-lg px-3 py-2.5"
                  />


                  <button
                    onClick={
                      () =>
                        saveProgress(
                          task
                        )
                    }
                    disabled={
                      savingTask
                      === task.id
                    }
                    className="bg-blue-600 text-white rounded-lg px-4 py-2.5 disabled:opacity-50"
                  >

                    {
                      savingTask
                      === task.id
                        ? "Saving..."
                        : "Update Progress"
                    }

                  </button>

                </div>


                {/* PROGRESS BAR */}

                <div className="mt-5">

                  <div className="flex justify-between text-xs text-gray-500 mb-2">

                    <span>
                      Progress
                    </span>

                    <span>
                      {
                        task.progress_percentage
                      }%
                    </span>

                  </div>


                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{
                        width:
                          `${Math.min(
                            100,
                            Math.max(
                              0,
                              Number(
                                task.progress_percentage
                              )
                              || 0
                            )
                          )}%`
                      }}
                    />

                  </div>

                </div>


                {/* EDIT / DELETE */}

                {selfCreated && (

                  <div className="flex gap-3 mt-6">

                    <button
                      onClick={
                        () =>
                          openEditForm(
                            task
                          )
                      }
                      className="border border-blue-300 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50"
                    >
                      Edit
                    </button>


                    <button
                      onClick={
                        () =>
                          handleDelete(
                            task
                          )
                      }
                      className="border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>

                  </div>

                )}

              </div>

            );

          }
        )}

      </div>


      {/* ==================================================== */}
      {/* ADD / EDIT MODAL */}
      {/* ==================================================== */}

      {showForm && (

        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">

            <div className="p-6 border-b flex justify-between">

              <div>

                <h2 className="text-xl font-bold">

                  {
                    editingTask
                      ? "Edit Task"
                      : "Add New Task"
                  }

                </h2>

                <p className="text-sm text-gray-500 mt-1">

                  {
                    editingTask
                      ? "Modify your work details."
                      : "Create a new work task."
                  }

                </p>

              </div>


              <button
                onClick={
                  closeForm
                }
                className="text-2xl text-gray-500"
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

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium mb-2">
                    Task Title *
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
                    className="w-full border rounded-lg px-4 py-2.5"
                    placeholder="Enter work title"
                  />

                </div>


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
                    className="w-full border rounded-lg px-4 py-2.5"
                    placeholder="Describe the work..."
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Work Type
                  </label>

                  <select
                    name="work_type"
                    value={
                      formData.work_type
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  >

                    <option value="article">
                      Article
                    </option>

                    <option value="code">
                      Code
                    </option>

                    <option value="addition">
                      Addition
                    </option>

                    <option value="modification">
                      Modification
                    </option>

                    <option value="correction">
                      Correction
                    </option>

                    <option value="rewrite">
                      Rewrite
                    </option>

                    <option value="dataset">
                      Dataset
                    </option>

                    <option value="reviewers_comments">
                      Reviewers Comments
                    </option>

                    <option value="thesis">
                      Thesis
                    </option>

                    <option value="ppt">
                      PPT
                    </option>

                    <option value="research">
                      Research
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Priority
                  </label>

                  <select
                    name="priority"
                    value={
                      formData.priority
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  >

                    <option value="low">
                      Low
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="high">
                      High
                    </option>

                    <option value="urgent">
                      Urgent
                    </option>

                  </select>

                </div>


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


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Progress %
                  </label>

                  <input
                    type="number"
                    name="progress_percentage"
                    min="0"
                    max="100"
                    value={
                      formData.progress_percentage
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Deadline
                  </label>

                  <input
                    type="datetime-local"
                    name="deadline"
                    value={
                      formData.deadline
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Estimated Hours
                  </label>

                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    name="estimated_hours"
                    value={
                      formData.estimated_hours
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


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
                    className="w-full border rounded-lg px-4 py-2.5"
                    placeholder="Optional"
                  />

                </div>

              </div>


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
                      : editingTask
                        ? "Update Task"
                        : "Create Task"
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


function InfoBox({
  label,
  value
}) {

  return (
    <div className="bg-gray-50 border rounded-lg p-4">

      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="text-sm font-medium mt-1">
        {value}
      </p>

    </div>
  );
}