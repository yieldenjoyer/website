const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold">Your Positions</h3>
          <p className="text-gray-400">No active positions yet.</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold">Strategies</h3>
          <p className="text-gray-400">Explore available strategies.</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold">Latest Snapshots</h3>
          <p className="text-gray-400">No snapshots available.</p>
        </div>
        <div className="card md:col-span-3 relative">
          <span className="absolute top-2 right-2 bg-blue-500 text-xs px-2 py-1 rounded">Coming Soon</span>
          <h3 className="text-lg font-semibold">Advanced Analytics</h3>
          <p className="text-gray-400">Detailed performance metrics coming soon.</p>
        </div>
        <div className="card md:col-span-3 relative">
          <span className="absolute top-2 right-2 bg-blue-500 text-xs px-2 py-1 rounded">Coming Soon</span>
          <h3 className="text-lg font-semibold">Leaderboard</h3>
          <p className="text-gray-400">Top performers coming soon.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;