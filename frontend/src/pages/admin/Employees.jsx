import {
  useEffect,
  useState
} from "react";

import {
  createEmployee,
  getDepartments,
  getEmployees,
  updateEmployee,
  updateEmployeeStatus
} from "../../services/api";


const emptyForm = {
  username: "",
  email: "",
  password: "",

  employee_code: "",
  first_name: "",
  last_name: "",
  phone: "",
  designation: "",

  department_id: "",

  joining_date: "",

  employment_status:
    "active"
};


export default function Employees() {

  const [
    employees,
    setEmployees
  ] = useState([]);

  const [
    departments,
    setDepartments
  ] = useState([]);

  const [
    search,
    setSearch
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter
  ] = useState("");

  const [
    departmentFilter,
    setDepartmentFilter
  ] = useState("");

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
    editingEmployee,
    setEditingEmployee
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


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadInitialData();

  }, []);


  const loadInitialData =
    async () => {

      try {

        setLoading(true);

        const [
          employeeData,
          departmentData
        ] = await Promise.all([
          getEmployees(),
          getDepartments()
        ]);


        setEmployees(
          employeeData
        );

        setDepartments(
          departmentData
        );


      } catch (err) {

        console.error(err);

        setError(
          "Unable to load employee data."
        );


      } finally {

        setLoading(false);

      }
    };


  // ============================================================
  // SEARCH / FILTER
  // ============================================================

  const loadEmployees =
    async () => {

      try {

        setLoading(true);

        const data =
          await getEmployees({
            q:
              search || undefined,

            status:
              statusFilter
              || undefined,

            department_id:
              departmentFilter
              || undefined
          });


        setEmployees(data);

        setError("");


      } catch (err) {

        console.error(err);

        setError(
          "Unable to load employees."
        );


      } finally {

        setLoading(false);

      }
    };


  const clearFilters = () => {

    setSearch("");

    setStatusFilter("");

    setDepartmentFilter("");

    setTimeout(
      async () => {

        try {

          const data =
            await getEmployees();

          setEmployees(data);

        } catch (err) {

          console.error(err);

        }

      },
      0
    );
  };


  // ============================================================
  // FORM HANDLING
  // ============================================================

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


  const openAddForm = () => {

    setEditingEmployee(null);

    setFormData(
      emptyForm
    );

    setError("");

    setSuccess("");

    setShowForm(true);
  };


  const openEditForm =
    (employee) => {

      setEditingEmployee(
        employee
      );


      setFormData({
        username:
          employee.username
          || "",

        email:
          employee.email
          || "",

        password: "",

        employee_code:
          employee.employee_code
          || "",

        first_name:
          employee.first_name
          || "",

        last_name:
          employee.last_name
          || "",

        phone:
          employee.phone
          || "",

        designation:
          employee.designation
          || "",

        department_id:
          employee.department_id
          || "",

        joining_date:
          employee.joining_date
          || "",

        employment_status:
          employee.employment_status
          || "active"
      });


      setError("");

      setSuccess("");

      setShowForm(true);
    };


  const closeForm = () => {

    setShowForm(false);

    setEditingEmployee(null);

    setFormData(
      emptyForm
    );
  };


  // ============================================================
  // ADD / EDIT EMPLOYEE
  // ============================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();

      setSaving(true);

      setError("");

      setSuccess("");


      try {

        const payload = {
          username:
            formData.username.trim(),

          email:
            formData.email.trim(),

          employee_code:
            formData.employee_code.trim(),

          first_name:
            formData.first_name.trim(),

          last_name:
            formData.last_name.trim()
            || null,

          phone:
            formData.phone.trim()
            || null,

          designation:
            formData.designation.trim()
            || null,

          department_id:
            formData.department_id
              ? Number(
                  formData.department_id
                )
              : null,

          joining_date:
            formData.joining_date
            || null,

          employment_status:
            formData.employment_status
        };


        if (
          !editingEmployee
        ) {

          payload.password =
            formData.password;


          await createEmployee(
            payload
          );


          setSuccess(
            "Employee added successfully."
          );


        } else {

          await updateEmployee(
            editingEmployee.id,
            payload
          );


          setSuccess(
            "Employee updated successfully."
          );
        }


        closeForm();

        await loadEmployees();


      } catch (err) {

        console.error(err);


        const message =
          err?.response
            ?.data
            ?.detail;


        setError(
          typeof message
          === "string"

            ? message

            : "Unable to save employee."
        );


      } finally {

        setSaving(false);

      }
    };


  // ============================================================
  // STATUS
  // ============================================================

  const handleStatusChange =
    async (
      employee
    ) => {

      const nextStatus =
        employee.employment_status
        === "active"
          ? "inactive"
          : "active";


      const confirmed =
        window.confirm(
          `Change ${employee.first_name}'s status to ${nextStatus}?`
        );


      if (!confirmed) {
        return;
      }


      try {

        await updateEmployeeStatus(
          employee.id,
          nextStatus
        );


        await loadEmployees();


      } catch (err) {

        console.error(err);

        setError(
          "Unable to update employee status."
        );
      }
    };


  // ============================================================
  // LOADING
  // ============================================================

  if (
    loading
    &&
    employees.length === 0
  ) {

    return (
      <div className="p-6">
        Loading employees...
      </div>
    );
  }


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div>

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">
            Employees
          </h1>

          <p className="text-gray-500 mt-1">
            Manage employee accounts,
            departments, designations
            and employment status.
          </p>

        </div>


        <button
          onClick={
            openAddForm
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium"
        >
          + Add Employee
        </button>

      </div>


      {/* ===================================================== */}
      {/* MESSAGES */}
      {/* ===================================================== */}

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


      {/* ===================================================== */}
      {/* FILTERS */}
      {/* ===================================================== */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

          <input
            type="text"
            value={search}
            onChange={
              (event) =>
                setSearch(
                  event.target.value
                )
            }
            placeholder="Search employee..."
            className="border rounded-lg px-4 py-2.5 xl:col-span-2"
          />


          <select
            value={
              departmentFilter
            }
            onChange={
              (event) =>
                setDepartmentFilter(
                  event.target.value
                )
            }
            className="border rounded-lg px-4 py-2.5"
          >

            <option value="">
              All Departments
            </option>

            {departments.map(
              (department) => (

                <option
                  key={
                    department.id
                  }
                  value={
                    department.id
                  }
                >
                  {
                    department.name
                  }
                </option>

              )
            )}

          </select>


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


          <div className="flex gap-2">

            <button
              onClick={
                loadEmployees
              }
              className="bg-slate-900 text-white px-4 py-2.5 rounded-lg flex-1"
            >
              Search
            </button>


            <button
              onClick={
                clearFilters
              }
              className="border px-4 py-2.5 rounded-lg"
            >
              Clear
            </button>

          </div>

        </div>

      </div>


      {/* ===================================================== */}
      {/* TABLE */}
      {/* ===================================================== */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b">

          <h2 className="font-semibold">
            Employee List
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {employees.length} employee(s)
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left p-3">
                  Code
                </th>

                <th className="text-left p-3">
                  Employee
                </th>

                <th className="text-left p-3">
                  Department
                </th>

                <th className="text-left p-3">
                  Designation
                </th>

                <th className="text-left p-3">
                  Status
                </th>

                <th className="text-left p-3">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {employees.length === 0 && (

                <tr>

                  <td
                    colSpan="6"
                    className="p-8 text-center text-gray-400"
                  >
                    No employees found.
                  </td>

                </tr>

              )}


              {employees.map(
                (employee) => (

                  <tr
                    key={
                      employee.id
                    }
                    className="border-t hover:bg-gray-50"
                  >

                    <td className="p-3 font-medium">

                      {
                        employee.employee_code
                      }

                    </td>


                    <td className="p-3">

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
                          employee.email
                          || employee.username
                          || "-"
                        }

                      </div>

                    </td>


                    <td className="p-3">

                      {
                        employee.department_name
                        || "-"
                      }

                    </td>


                    <td className="p-3">

                      {
                        employee.designation
                        || "-"
                      }

                    </td>


                    <td className="p-3">

                      <span
                        className={
                          `inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            employee.employment_status
                            === "active"
                              ? "bg-green-100 text-green-700"

                              : employee.employment_status
                                === "inactive"

                              ? "bg-gray-200 text-gray-700"

                              : "bg-red-100 text-red-700"
                          }`
                        }
                      >
                        {
                          employee.employment_status
                        }
                      </span>

                    </td>


                    <td className="p-3">

                      <div className="flex gap-2">

                        <button
                          onClick={
                            () =>
                              openEditForm(
                                employee
                              )
                          }
                          className="border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                        >
                          Edit
                        </button>


                        <button
                          onClick={
                            () =>
                              handleStatusChange(
                                employee
                              )
                          }
                          className="border px-3 py-1.5 rounded-lg hover:bg-gray-50"
                        >

                          {
                            employee.employment_status
                            === "active"
                              ? "Deactivate"
                              : "Activate"
                          }

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


      {/* ===================================================== */}
      {/* ADD / EDIT MODAL */}
      {/* ===================================================== */}

      {showForm && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            <div className="p-6 border-b flex justify-between items-center">

              <div>

                <h2 className="text-xl font-bold">

                  {
                    editingEmployee
                      ? "Edit Employee"
                      : "Add Employee"
                  }

                </h2>

                <p className="text-sm text-gray-500 mt-1">

                  {
                    editingEmployee
                      ? "Update employee information."
                      : "Create a new employee account."
                  }

                </p>

              </div>


              <button
                onClick={
                  closeForm
                }
                className="text-gray-500 text-xl"
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


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Employee Code *
                  </label>

                  <input
                    name="employee_code"
                    value={
                      formData.employee_code
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full border rounded-lg px-4 py-2.5"
                    placeholder="EMP002"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Username *
                  </label>

                  <input
                    name="username"
                    value={
                      formData.username
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full border rounded-lg px-4 py-2.5"
                    placeholder="employee.username"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    First Name *
                  </label>

                  <input
                    name="first_name"
                    value={
                      formData.first_name
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Last Name
                  </label>

                  <input
                    name="last_name"
                    value={
                      formData.last_name
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                {!editingEmployee && (

                  <div>

                    <label className="block text-sm font-medium mb-2">
                      Password *
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={
                        formData.password
                      }
                      onChange={
                        handleChange
                      }
                      minLength="6"
                      required
                      className="w-full border rounded-lg px-4 py-2.5"
                    />

                  </div>

                )}


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Designation
                  </label>

                  <input
                    name="designation"
                    value={
                      formData.designation
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                    placeholder="Developer / SME / Researcher"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Department
                  </label>

                  <select
                    name="department_id"
                    value={
                      formData.department_id
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  >

                    <option value="">
                      Select Department
                    </option>

                    {departments.map(
                      (department) => (

                        <option
                          key={
                            department.id
                          }
                          value={
                            department.id
                          }
                        >
                          {
                            department.name
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Joining Date
                  </label>

                  <input
                    type="date"
                    name="joining_date"
                    value={
                      formData.joining_date
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium mb-2">
                    Employment Status
                  </label>

                  <select
                    name="employment_status"
                    value={
                      formData.employment_status
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                  >

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
                      : editingEmployee
                        ? "Update Employee"
                        : "Add Employee"
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