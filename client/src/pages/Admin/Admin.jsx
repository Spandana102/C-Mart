import "./Admin.css";

function AdminDashboard() {
  return (
    <div className="admin-dashboard">

      <aside className="admin-sidebar">
        <h2>Campus Bazaar</h2>

        <nav>
          <button>Dashboard</button>
          <button>Users</button>
          <button>Products</button>
          <button>Reports</button>
          <button>Complaints</button>
        </nav>

        <button className="logout-btn">Logout</button>
      </aside>

      <main className="admin-main">

        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome to Campus Bazaar Admin Panel</p>
          </div>
        </div>

        <div className="dashboard-cards">

          <div className="dashboard-card">
            <h3>Total Users</h3>
            <p>0</p>
          </div>

          <div className="dashboard-card">
            <h3>Total Products</h3>
            <p>0</p>
          </div>

          <div className="dashboard-card">
            <h3>Reports</h3>
            <p>0</p>
          </div>

          <div className="dashboard-card">
            <h3>Complaints</h3>
            <p>0</p>
          </div>

        </div>

      </main>

    </div>
  );
}

export default AdminDashboard;