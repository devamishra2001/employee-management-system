export default function TaskTable({
  tasks
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      <div className="p-5 border-b">
        <h2 className="text-lg font-semibold">
          Tasks
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">
                ID
              </th>

              <th className="text-left p-3">
                Title
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
            </tr>
          </thead>

          <tbody>

            {tasks.map((task) => (
              <tr
                key={task.id}
                className="border-t"
              >
                <td className="p-3">
                  {task.id}
                </td>

                <td className="p-3 font-medium">
                  {task.title}
                </td>

                <td className="p-3">
                  {task.work_type}
                </td>

                <td className="p-3">
                  {task.priority}
                </td>

                <td className="p-3">
                  {task.status}
                </td>

                <td className="p-3 min-w-[180px]">

                  <div className="flex items-center gap-2">

                    <div className="w-full h-2 bg-gray-200 rounded-full">

                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{
                          width:
                            `${task.progress_percentage}%`
                        }}
                      />

                    </div>

                    <span>
                      {task.progress_percentage}%
                    </span>

                  </div>

                </td>
              </tr>
            ))}

          </tbody>

        </table>
      </div>
    </div>
  );
}