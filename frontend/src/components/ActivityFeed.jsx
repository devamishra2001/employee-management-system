export default function ActivityFeed({
  activities
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

      <div className="p-5 border-b">
        <h2 className="text-lg font-semibold">
          Live Activity
        </h2>
      </div>

      <div className="p-5 space-y-4">

        {activities.length === 0 && (
          <p className="text-gray-400 text-sm">
            Waiting for live updates...
          </p>
        )}

        {activities.map(
          (activity, index) => (
            <div
              key={index}
              className="border-l-2 border-blue-500 pl-3"
            >

              <p className="font-medium">
                Task #{activity.task_id} updated
              </p>

              <p className="text-sm text-gray-500">
                {activity.status}
                {" | "}
                {activity.progress_percentage}%
              </p>

            </div>
          )
        )}

      </div>
    </div>
  );
}