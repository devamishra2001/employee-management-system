export default function EmployeeTable({
  employees
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      <div className="p-5 border-b">
        <h2 className="text-lg font-semibold">
          Employees
        </h2>
      </div>

      <table className="w-full text-sm">

        <thead className="bg-gray-50">
          <tr>

            <th className="text-left p-3">
              Code
            </th>

            <th className="text-left p-3">
              Name
            </th>

            <th className="text-left p-3">
              Designation
            </th>

            <th className="text-left p-3">
              Status
            </th>

          </tr>
        </thead>

        <tbody>

          {employees.map((employee) => (
            <tr
              key={employee.id}
              className="border-t"
            >

              <td className="p-3">
                {employee.employee_code}
              </td>

              <td className="p-3">
                {employee.first_name}{" "}
                {employee.last_name}
              </td>

              <td className="p-3">
                {employee.designation || "-"}
              </td>

              <td className="p-3">
                {employee.employment_status}
              </td>

            </tr>
          ))}

        </tbody>
      </table>

    </div>
  );
}