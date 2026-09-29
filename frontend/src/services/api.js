import axios from "axios";


const API_URL =
  import.meta.env.VITE_API_URL
  || "http://127.0.0.1:8000";


const api = axios.create({
  baseURL: API_URL
});


// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// ============================================================
// AUTHENTICATION
// ============================================================

export const loginUser =
  async (
    username,
    password
  ) => {

    const response =
      await api.post(
        "/auth/login",
        {
          username,
          password
        }
      );

    return response.data;
  };


export const getCurrentUser =
  async () => {

    const response =
      await api.get(
        "/auth/me"
      );

    return response.data;
  };


// ============================================================
// EMPLOYEES
// ============================================================

export const getEmployees =
  async (
    filters = {}
  ) => {

    const params = {};


    if (filters.q) {

      params.q =
        filters.q;

    }


    if (filters.status) {

      params.status =
        filters.status;

    }


    if (
      filters.department_id
    ) {

      params.department_id =
        filters.department_id;

    }


    const response =
      await api.get(
        "/employees",
        {
          params
        }
      );

    return response.data;
  };


export const getEmployee =
  async (
    employeeId
  ) => {

    const response =
      await api.get(
        `/employees/${employeeId}`
      );

    return response.data;
  };


export const createEmployee =
  async (
    payload
  ) => {

    const response =
      await api.post(
        "/employees",
        payload
      );

    return response.data;
  };


export const updateEmployee =
  async (
    employeeId,
    payload
  ) => {

    const response =
      await api.put(
        `/employees/${employeeId}`,
        payload
      );

    return response.data;
  };


export const updateEmployeeStatus =
  async (
    employeeId,
    employmentStatus
  ) => {

    const response =
      await api.patch(
        `/employees/${employeeId}/status`,
        {
          employment_status:
            employmentStatus
        }
      );

    return response.data;
  };


// ============================================================
// DEPARTMENTS
// ============================================================

export const getDepartments =
  async () => {

    const response =
      await api.get(
        "/departments"
      );

    return response.data;
  };


// ============================================================
// ADMIN TASKS
// ============================================================

export const getTasks =
  async () => {

    const response =
      await api.get(
        "/tasks"
      );

    return response.data;
  };


export const getTask =
  async (
    taskId
  ) => {

    const response =
      await api.get(
        `/tasks/${taskId}`
      );

    return response.data;
  };


export const createTask =
  async (
    payload
  ) => {

    const response =
      await api.post(
        "/tasks",
        payload
      );

    return response.data;
  };


export const updateTask =
  async (
    taskId,
    payload
  ) => {

    const response =
      await api.put(
        `/tasks/${taskId}`,
        payload
      );

    return response.data;
  };


export const deleteTask =
  async (
    taskId
  ) => {

    const response =
      await api.delete(
        `/tasks/${taskId}`
      );

    return response.data;
  };


// ============================================================
// EMPLOYEE DASHBOARD
// ============================================================

export const getEmployeeDashboard =
  async () => {

    const response =
      await api.get(
        "/employee-portal/dashboard"
      );

    return response.data;
  };


// ============================================================
// EMPLOYEE TASK CRUD
// ============================================================

export const getMyTasks =
  async () => {

    const response =
      await api.get(
        "/employee-portal/my-tasks"
      );

    return response.data;
  };


export const getMyTask =
  async (
    taskId
  ) => {

    const response =
      await api.get(
        `/employee-portal/my-tasks/${taskId}`
      );

    return response.data;
  };


export const createMyTask =
  async (
    payload
  ) => {

    const response =
      await api.post(
        "/employee-portal/my-tasks",
        payload
      );

    return response.data;
  };


export const updateMyTask =
  async (
    taskId,
    payload
  ) => {

    const response =
      await api.put(
        `/employee-portal/my-tasks/${taskId}`,
        payload
      );

    return response.data;
  };


export const deleteMyTask =
  async (
    taskId
  ) => {

    const response =
      await api.delete(
        `/employee-portal/my-tasks/${taskId}`
      );

    return response.data;
  };


// ============================================================
// EMPLOYEE DAILY WORK RECORDS
// ============================================================

export const getMyWorkRecords =
  async (
    filters = {}
  ) => {

    const params = {};


    if (
      filters.work_date
    ) {

      params.work_date =
        filters.work_date;

    }


    if (
      filters.task_id
    ) {

      params.task_id =
        filters.task_id;

    }


    if (
      filters.status
    ) {

      params.status =
        filters.status;

    }


    const response =
      await api.get(
        "/work-records/my",
        {
          params
        }
      );

    return response.data;
  };


export const getMyWorkRecord =
  async (
    recordId
  ) => {

    const response =
      await api.get(
        `/work-records/my/${recordId}`
      );

    return response.data;
  };


export const createMyWorkRecord =
  async (
    payload
  ) => {

    const response =
      await api.post(
        "/work-records/my",
        payload
      );

    return response.data;
  };


export const updateMyWorkRecord =
  async (
    recordId,
    payload
  ) => {

    const response =
      await api.put(
        `/work-records/my/${recordId}`,
        payload
      );

    return response.data;
  };


export const deleteMyWorkRecord =
  async (
    recordId
  ) => {

    const response =
      await api.delete(
        `/work-records/my/${recordId}`
      );

    return response.data;
  };


// ============================================================
// EMPLOYEE PERFORMANCE
// ============================================================

export const getMyPerformance =
  async () => {

    const response =
      await api.get(
        "/employee-performance/my"
      );

    return response.data;
  };


// ============================================================
// ADMIN WORK RECORDS
// ============================================================

export const getAdminWorkRecords =
  async (
    filters = {}
  ) => {

    const params = {};


    if (
      filters.employee_id
    ) {

      params.employee_id =
        filters.employee_id;

    }


    if (
      filters.work_date
    ) {

      params.work_date =
        filters.work_date;

    }


    if (
      filters.status
    ) {

      params.status =
        filters.status;

    }


    if (
      filters.task_id
    ) {

      params.task_id =
        filters.task_id;

    }


    const response =
      await api.get(
        "/admin/work-records",
        {
          params
        }
      );

    return response.data;
  };


export const getAdminWorkRecord =
  async (
    recordId
  ) => {

    const response =
      await api.get(
        `/admin/work-records/${recordId}`
      );

    return response.data;
  };


// ============================================================
// ADMIN LIVE ACTIVITY
// ============================================================

export const getAdminActivity =
  async (
    filters = {}
  ) => {

    const params = {};


    if (
      filters.employee_id
    ) {

      params.employee_id =
        filters.employee_id;

    }


    if (
      filters.action
    ) {

      params.action =
        filters.action;

    }


    if (
      filters.entity_type
    ) {

      params.entity_type =
        filters.entity_type;

    }


    if (
      filters.limit
    ) {

      params.limit =
        filters.limit;

    }


    const response =
      await api.get(
        "/admin/activity",
        {
          params
        }
      );

    return response.data;
  };


export const getAdminActivityById =
  async (
    activityId
  ) => {

    const response =
      await api.get(
        `/admin/activity/${activityId}`
      );

    return response.data;
  };


// ============================================================
// ADMIN EMPLOYEE PERFORMANCE
// ============================================================

export const getAdminPerformance =
  async () => {

    const response =
      await api.get(
        "/admin/performance"
      );

    return response.data;
  };


export const getAdminEmployeePerformance =
  async (
    employeeId
  ) => {

    const response =
      await api.get(
        `/admin/performance/${employeeId}`
      );

    return response.data;
  };


// ============================================================
// ADMIN REPORTS
// ============================================================

export const getAdminReports =
  async (
    filters = {}
  ) => {

    const params = {};


    if (
      filters.period
    ) {

      params.period =
        filters.period;

    }


    if (
      filters.target_date
    ) {

      params.target_date =
        filters.target_date;

    }


    if (
      filters.employee_id
    ) {

      params.employee_id =
        filters.employee_id;

    }


    const response =
      await api.get(
        "/admin/reports",
        {
          params
        }
      );

    return response.data;
  };


export const getAdminEmployeeReport =
  async (
    employeeId,
    filters = {}
  ) => {

    const params = {};


    if (
      filters.period
    ) {

      params.period =
        filters.period;

    }


    if (
      filters.target_date
    ) {

      params.target_date =
        filters.target_date;

    }


    const response =
      await api.get(
        `/admin/reports/employee/${employeeId}`,
        {
          params
        }
      );

    return response.data;
  };


// ============================================================
// ADMIN ML ANALYTICS
// ============================================================

export const getMLReadiness =
  async () => {

    const response =
      await api.get(
        "/admin/ml-analytics/readiness"
      );

    return response.data;
  };


export const getMLFeatures =
  async (
    filters = {}
  ) => {

    const params = {};


    if (
      filters.days
    ) {

      params.days =
        filters.days;

    }


    if (
      filters.employee_id
    ) {

      params.employee_id =
        filters.employee_id;

    }


    const response =
      await api.get(
        "/admin/ml-analytics/features",
        {
          params
        }
      );

    return response.data;
  };


export const getMLAnalyticsOverview =
  async (
    filters = {}
  ) => {

    const params = {};


    if (
      filters.days
    ) {

      params.days =
        filters.days;

    }


    const response =
      await api.get(
        "/admin/ml-analytics/overview",
        {
          params
        }
      );

    return response.data;
  };


// ============================================================
// DEFAULT API INSTANCE
// ============================================================

export default api;