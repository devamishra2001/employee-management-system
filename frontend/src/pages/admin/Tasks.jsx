import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getTasks,
  getEmployees,
  updateTask,
  createTask,
  deleteTask
} from "../../services/api";

import useDashboardSocket
  from "../../hooks/useDashboardSocket";


const emptyForm = {
  project_id: "",
  assigned_to: "",
  title: "",
  description: "",
  work_type: "other",
  priority: "medium",
  status: "received",
  progress_percentage: 0,
  deadline: "",
  estimated_hours: "",
  actual_hours: ""
};


export default function Tasks() {

  const [
    tasks,
    setTasks
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
    success,
    setSuccess
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
    search,
    setSearch
  ] = useState("");

  const [
    employeeFilter,
    setEmployeeFilter
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter
  ] = useState("");

  const [
    priorityFilter,
    setPriorityFilter
  ] = useState("");

  const [
    workTypeFilter,
    setWorkTypeFilter
  ] = useState("");


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    loadData();

  }, []);


  const loadData =
    async () => {

      try {

        setLoading(true);
        setError("");

        const [
          taskData,
          employeeData
        ] = await Promise.all([
          getTasks(),
          getEmployees()
        ]);

        setTasks(
          taskData
        );

        setEmployees(
          employeeData
        );

      } catch (err) {

        console.error(
          "Admin Tasks load error:",
          err
        );

        setError(
          "Unable to load tasks."
        );

      } finally {

        setLoading(false);

      }
    };


  // ==========================================================
  // REAL-TIME TASK UPDATES
  // ==========================================================

  const handleSocketMessage =
    useCallback(
      (message) => {

        if (
          message.event
          === "task_created"
          &&
          message.task
        ) {

          setTasks(
            (current) => {

              const exists =
                current.some(
                  (task) =>
                    task.id
                    === message.task.id
                );

              if (exists) {
                return current;
              }

              return [
                message.task,
                ...current
              ];
            }
          );

        }


        if (
          message.event
          === "task_updated"
        ) {

          setTasks(
            (current) =>
              current.map(
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

                    status:
                      message.status
                      ?? task.status,

                    progress_percentage:
                      message.progress_percentage
                      ?? task.progress_percentage,

                    priority:
                      message.priority
                      ?? task.priority,

                    work_type:
                      message.work_type
                      ?? task.work_type,

                    title:
                      message.title
                      ?? task.title,

                    assigned_to:
                      message.employee_id
                      ?? task.assigned_to,

                    project_id:
                      message.project_id
                      ?? task.project_id
                  };
                }
              )
          );

        }


        if (
          message.event
          === "task_deleted"
        ) {

          setTasks(
            (current) =>
              current.filter(
                (task) =>
                  task.id
                  !== message.task_id
              )
          );

        }

      },
      []
    );


  useDashboardSocket(
    handleSocketMessage
  );


  // ==========================================================
  // FILTERED TASKS
  // ==========================================================

  const filteredTasks =
    useMemo(
      () => {

        return tasks.filter(
          (task) => {

            const searchValue =
              search
                .trim()
                .toLowerCase();


            const matchesSearch =
              !searchValue
              ||
              String(
                task.id
              ).includes(
                searchValue
              )
              ||
              (
                task.title
                || ""
              )
                .toLowerCase()
                .includes(
                  searchValue
                )
              ||
              (
                task.description
                || ""
              )
                .toLowerCase()
                .includes(
                  searchValue
                );


            const matchesEmployee =
              !employeeFilter
              ||
              Number(
                task.assigned_to
              )
              === Number(
                employeeFilter
              );


            const matchesStatus =
              !statusFilter
              ||
              task.status
              === statusFilter;


            const matchesPriority =
              !priorityFilter
              ||
              task.priority
              === priorityFilter;


            const matchesWorkType =
              !workTypeFilter
              ||
              task.work_type
              === workTypeFilter;


            return (
              matchesSearch
              &&
              matchesEmployee
              &&
              matchesStatus
              &&
              matchesPriority
              &&
              matchesWorkType
            );
          }
        );

      },
      [
        tasks,
        search,
        employeeFilter,
        statusFilter,
        priorityFilter,
        workTypeFilter
      ]
    );


  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary =
    useMemo(
      () => {

        return {

          total:
            tasks.length,

          received:
            tasks.filter(
              (task) =>
                task.status
                === "received"
            ).length,

          pending:
            tasks.filter(
              (task) =>
                task.status
                === "pending"
            ).length,

          inProgress:
            tasks.filter(
              (task) =>
                task.status
                === "in_progress"
            ).length,

          delivered:
            tasks.filter(
              (task) =>
                task.status
                === "delivered"
            ).length,

          completed:
            tasks.filter(
              (task) =>
                task.status
                === "completed"
            ).length

        };

      },
      [
        tasks
      ]
    );


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
  // OPEN CREATE FORM
  // ==========================================================

  const openCreateForm =
    () => {

      setEditingTask(
        null
      );

      setFormData(
        emptyForm
      );

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

        assigned_to:
          task.assigned_to
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
          formatDateTimeLocal(
            task.deadline
          ),

        estimated_hours:
          task.estimated_hours
          ?? "",

        actual_hours:
          task.actual_hours
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

  const closeForm =
    () => {

      setShowForm(
        false
      );

      setEditingTask(
        null
      );

      setFormData(
        emptyForm
      );
    };


  // ==========================================================
  // SAVE TASK
  // ==========================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      try {

        setSaving(true);
        setError("");
        setSuccess("");


        if (
          !formData.title.trim()
        ) {

          setError(
            "Task title is required."
          );

          return;
        }


        if (
          !formData.assigned_to
        ) {

          setError(
            "Please assign the task to an employee."
          );

          return;
        }


        const payload = {

          project_id:
            formData.project_id
              ? Number(
                  formData.project_id
                )
              : null,

          assigned_to:
            Number(
              formData.assigned_to
            ),

          title:
            formData.title.trim(),

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
              || 0
            ),

          deadline:
            formData.deadline
              ? new Date(
                  formData.deadline
                ).toISOString()
              : null,

          estimated_hours:
            formData.estimated_hours
              ? Number(
                  formData.estimated_hours
                )
              : null,

          actual_hours:
            formData.actual_hours
              ? Number(
                  formData.actual_hours
                )
              : null
        };


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

          const updated =
            await updateTask(
              editingTask.id,
              payload
            );


          setTasks(
            (current) =>
              current.map(
                (task) =>
                  task.id
                  === editingTask.id
                    ? {
                        ...task,
                        ...updated
                      }
                    : task
              )
          );


          setSuccess(
            "Task updated successfully."
          );

        } else {

          const created =
            await createTask(
              payload
            );


          setTasks(
            (current) => {

              const exists =
                current.some(
                  (task) =>
                    task.id
                    === created.id
                );

              if (exists) {

                return current;
              }

              return [
                created,
                ...current
              ];
            }
          );


          setSuccess(
            "Task created successfully."
          );
        }


        closeForm();


      } catch (err) {

        console.error(
          "Task save error:",
          err
        );


        const detail =
          err?.response
            ?.data
            ?.detail;


        if (
          Array.isArray(
            detail
          )
        ) {

          setError(
            detail
              .map(
                (item) =>
                  item.msg
              )
              .join(", ")
          );

        } else {

          setError(
            typeof detail
            === "string"
              ? detail
              : "Unable to save task."
          );
        }


      } finally {

        setSaving(
          false
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
          `Delete task "${task.title}"?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setError("");
        setSuccess("");


        await deleteTask(
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
          "Delete task error:",
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


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters =
    () => {

      setSearch("");
      setEmployeeFilter("");
      setStatusFilter("");
      setPriorityFilter("");
      setWorkTypeFilter("");
    };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
    &&
    tasks.length === 0
  ) {

    return (
      <div className="p-6">
        Loading tasks...
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
            Tasks
          </h1>

          <p className="text-gray-500 mt-1">
            Create, assign and manage employee tasks.
          </p>

        </div>


        <button
          onClick={
            openCreateForm
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium"
        >
          + Create Task
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">

        <SummaryCard
          title="Total"
          value={
            summary.total
          }
        />

        <SummaryCard
          title="Received"
          value={
            summary.received
          }
        />

        <SummaryCard
          title="Pending"
          value={
            summary.pending
          }
        />

        <SummaryCard
          title="In Progress"
          value={
            summary.inProgress
          }
        />

        <SummaryCard
          title="Delivered"
          value={
            summary.delivered
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

          {/* SEARCH */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Search
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
              placeholder="ID, title, description..."
              className="w-full border rounded-lg px-3 py-2.5"
            />

          </div>


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


          {/* PRIORITY */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Priority
            </label>

            <select
              value={
                priorityFilter
              }
              onChange={
                (event) =>
                  setPriorityFilter(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              <option value="">
                All Priorities
              </option>

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


          {/* WORK TYPE */}

          <div>

            <label className="block text-xs text-gray-500 mb-1">
              Work Type
            </label>

            <select
              value={
                workTypeFilter
              }
              onChange={
                (event) =>
                  setWorkTypeFilter(
                    event.target.value
                  )
              }
              className="w-full border rounded-lg px-3 py-2.5"
            >

              <option value="">
                All Work Types
              </option>

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


      {/* TASK TABLE */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b">

          <h2 className="font-semibold text-gray-900">
            Task List
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {filteredTasks.length} task(s)
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left p-3">
                  ID
                </th>

                <th className="text-left p-3">
                  Task
                </th>

                <th className="text-left p-3">
                  Employee
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
                  Deadline
                </th>

                <th className="text-left p-3">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredTasks.length === 0 && (

                <tr>

                  <td
                    colSpan="9"
                    className="p-8 text-center text-gray-400"
                  >
                    No tasks found.
                  </td>

                </tr>

              )}


              {filteredTasks.map(
                (task) => {

                  const employee =
                    employees.find(
                      (item) =>
                        item.id
                        === task.assigned_to
                    );


                  return (

                    <tr
                      key={
                        task.id
                      }
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="p-3">
                        #{task.id}
                      </td>


                      <td className="p-3 min-w-[220px]">

                        <div className="font-medium text-gray-900">
                          {task.title}
                        </div>

                        {task.description && (

                          <div className="text-xs text-gray-500 mt-1 max-w-[280px] truncate">
                            {
                              task.description
                            }
                          </div>

                        )}

                      </td>


                      <td className="p-3 min-w-[150px]">

                        {
                          employee
                            ? (
                              <>
                                <div className="font-medium text-gray-900">
                                  {
                                    employee.first_name
                                  }
                                  {" "}
                                  {
                                    employee.last_name
                                    || ""
                                  }
                                </div>

                                <div className="text-xs text-gray-500">
                                  {
                                    employee.employee_code
                                  }
                                </div>
                              </>
                            )
                            : `Employee #${task.assigned_to}`
                        }

                      </td>


                      <td className="p-3">
                        {
                          formatLabel(
                            task.work_type
                          )
                        }
                      </td>


                      <td className="p-3">

                        <PriorityBadge
                          priority={
                            task.priority
                          }
                        />

                      </td>


                      <td className="p-3">

                        <StatusBadge
                          status={
                            task.status
                          }
                        />

                      </td>


                      <td className="p-3 min-w-[140px]">

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
                                        task.progress_percentage
                                        || 0
                                      )
                                    )
                                  )}%`
                              }}
                            />

                          </div>

                          <span>
                            {
                              task.progress_percentage
                              ?? 0
                            }%
                          </span>

                        </div>

                      </td>


                      <td className="p-3 whitespace-nowrap">

                        {
                          formatDate(
                            task.deadline
                          )
                        }

                      </td>


                      <td className="p-3">

                        <div className="flex gap-2">

                          <button
                            onClick={
                              () =>
                                openEditForm(
                                  task
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
                                  task
                                )
                            }
                            className="border border-red-300 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  );

                }
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* CREATE / EDIT MODAL */}

      {showForm && (

        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">

            <div className="p-6 border-b flex justify-between items-start">

              <div>

                <h2 className="text-xl font-bold text-gray-900">

                  {
                    editingTask
                      ? "Edit Task"
                      : "Create Task"
                  }

                </h2>

                <p className="text-sm text-gray-500 mt-1">

                  {
                    editingTask
                      ? "Modify the selected employee task."
                      : "Create and assign a new task to an employee."
                  }

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


                {/* EMPLOYEE */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Assign To *
                  </label>

                  <select
                    name="assigned_to"
                    value={
                      formData.assigned_to
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full border rounded-lg px-4 py-2.5"
                  >

                    <option value="">
                      Select Employee
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


                {/* PROJECT */}

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


                {/* TITLE */}

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
                    placeholder="Enter task title"
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
                    placeholder="Describe the assigned work..."
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                {/* WORK TYPE */}

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


                {/* PRIORITY */}

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


                {/* DEADLINE */}

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


                {/* ESTIMATED HOURS */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Estimated Hours
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    name="estimated_hours"
                    value={
                      formData.estimated_hours
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: 8"
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                {/* ACTUAL HOURS */}

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Actual Hours
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    name="actual_hours"
                    value={
                      formData.actual_hours
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Optional"
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


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
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
        formatLabel(
          status
        )
      }
    </span>
  );
}


// ============================================================
// PRIORITY BADGE
// ============================================================

function PriorityBadge({
  priority
}) {

  const classes = {

    low:
      "bg-gray-100 text-gray-700",

    medium:
      "bg-blue-100 text-blue-700",

    high:
      "bg-orange-100 text-orange-700",

    urgent:
      "bg-red-100 text-red-700"
  };


  return (
    <span
      className={
        `inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
          classes[priority]
          || "bg-gray-100 text-gray-700"
        }`
      }
    >
      {
        formatLabel(
          priority
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
// DATE FORMAT
// ============================================================

function formatDate(
  value
) {

  if (!value) {
    return "-";
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
// DATETIME-LOCAL FORMAT
// ============================================================

function formatDateTimeLocal(
  value
) {

  if (!value) {
    return "";
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

    return "";
  }


  const pad =
    (number) =>
      String(number)
        .padStart(
          2,
          "0"
        );


  return (
    `${date.getFullYear()}-`
    +
    `${pad(
      date.getMonth() + 1
    )}-`
    +
    `${pad(
      date.getDate()
    )}T`
    +
    `${pad(
      date.getHours()
    )}:`
    +
    `${pad(
      date.getMinutes()
    )}`
  );
}