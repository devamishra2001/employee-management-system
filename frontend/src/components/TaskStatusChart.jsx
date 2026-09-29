import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#eab308",
  "#9333ea",
  "#ea580c",
  "#dc2626"
];

export default function TaskStatusChart({
  tasks
}) {
  const counts = {};

  tasks.forEach((task) => {
    counts[task.status] =
      (counts[task.status] || 0) + 1;
  });

  const data = Object.entries(
    counts
  ).map(
    ([name, value]) => ({
      name,
      value
    })
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">

      <h2 className="text-lg font-semibold mb-4">
        Task Status Distribution
      </h2>

      <div className="h-[280px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              label
            >

              {data.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index % COLORS.length
                      ]
                    }
                  />
                )
              )}

            </Pie>

            <Tooltip />

            <Legend />

          </PieChart>
        </ResponsiveContainer>

      </div>
    </div>
  );
}